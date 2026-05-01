#!/usr/bin/env node
/* globals console, process */
/**
 * 監控指定 PR 的 Codex review threads 與 CI checks。
 * - 偵測新留言（含 codex bot）
 * - 偵測留言從未解決 -> 已 resolved
 * - 偵測 checks 狀態變化
 *
 * 用法：
 *   node scripts/monitor-codex-review.mjs --pr 281 --interval 20 --follow
 *   node scripts/monitor-codex-review.mjs --pr 281 --once
 *   node scripts/monitor-codex-review.mjs --pr 281 --json-state .tmp/codex-monitor-state.json
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CODEX_BOTS = ['chatgpt-codex-connector[bot]', 'codex[bot]', 'openai-codex'];
const DEFAULT_INTERVAL_SEC = 30;
let cachedRepoMeta = null;

function gh(cmd) {
  return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function ghJson(cmd) {
  return JSON.parse(gh(cmd));
}

function getRepoMeta() {
  if (cachedRepoMeta) return cachedRepoMeta;
  const meta = ghJson('repo view --json owner,name');
  cachedRepoMeta = {
    owner: meta.owner.login,
    repo: meta.name,
  };
  return cachedRepoMeta;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    interval: DEFAULT_INTERVAL_SEC,
    follow: false,
    once: false,
    pr: null,
    stateFile: '.cache/pr-codex-monitor.json',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--pr' && args[i + 1]) {
      opts.pr = Number(args[++i]);
    } else if (arg === '--interval' && args[i + 1]) {
      const sec = Number(args[++i]);
      if (Number.isFinite(sec) && sec > 0) opts.interval = sec;
    } else if (arg === '--json-state' && args[i + 1]) {
      opts.stateFile = args[++i];
    } else if (arg === '--once') {
      opts.once = true;
    } else if (arg === '--follow') {
      opts.follow = true;
    }
  }

  if (!opts.pr) {
    const current = ghJson('pr view --json number');
    opts.pr = current.number;
  }

  return opts;
}

function isCodexLogin(login = '') {
  return CODEX_BOTS.includes(login.toLowerCase()) || login.toLowerCase().includes('codex');
}

function normalizeBody(body = '') {
  return body.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function fetchReviewThreads(prNumber) {
  const allNodes = [];
  let after = null;

  while (true) {
    const query = `
      query($owner: String!, $name: String!, $pr: Int!, $after: String) {
        repository(owner: $owner, name: $name) {
          pullRequest(number: $pr) {
            reviewThreads(first: 100, after: $after) {
              nodes {
                id
                isResolved
                isOutdated
                path
                line
                startLine
                originalLine
                originalStartLine
                comments(first: 30) {
                  nodes {
                    id
                    body
                    createdAt
                    updatedAt
                    url
                    author {
                      login
                    }
                  }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    `;

    const { owner, repo } = getRepoMeta();
    const payload = gh(
      `api graphql \
      -F owner='${owner}' \
      -F name='${repo}' \
      -F pr=${prNumber} \
      -f after=${after ? `"${after}"` : 'null'} \
      -f query='${query.replace(/\n/g, ' ')}'`,
    );

    const data = JSON.parse(payload);
    const group = data.data?.repository?.pullRequest?.reviewThreads;
    if (!group) break;

    allNodes.push(...group.nodes);
    if (!group.pageInfo?.hasNextPage) break;
    after = group.pageInfo.endCursor;
  }

  return allNodes
    .map((thread) => {
      const comments = thread.comments.nodes
        .filter((c) => isCodexLogin(c.author?.login))
        .map((c) => ({
          id: c.id,
          author: c.author?.login ?? '(unknown)',
          body: c.body,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          url: c.url,
        }));

      return {
        ...thread,
        codexComments: comments,
        latestCodexComment: comments.at(-1) ?? null,
      };
    })
    .filter((thread) => thread.codexComments.length > 0);
}

function fetchCodexIssueComments(prNumber) {
  const { owner, repo } = getRepoMeta();
  const comments = ghJson(`api repos/${owner}/${repo}/issues/${prNumber}/comments --paginate`);

  return comments
    .filter((c) => isCodexLogin(c.user?.login))
    .map((c) => ({
      id: String(c.id),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      body: c.body,
      url: c.html_url,
      author: c.user?.login ?? '(unknown)',
    }));
}

function fetchCheckSummary(prNumber) {
  let checks = [];
  try {
    checks = ghJson(`pr checks ${prNumber} --json state,name,bucket`);
  } catch (error) {
    const output = error.stdout?.toString().trim();
    if (output) {
      console.log(`[checks] API 回傳非穩定狀態，稍後重試: ${output}`);
      return {
        all: [],
        buckets: {},
        warning: 'checks-unavailable',
      };
    }
    throw error;
  }
  const buckets = new Map();
  for (const check of checks) {
    const list = buckets.get(check.bucket) ?? [];
    list.push({ name: check.name, state: check.state, workflow: check.workflow ?? '(none)' });
    buckets.set(check.bucket, list);
  }
  return {
    all: checks,
    buckets: Object.fromEntries(buckets.entries()),
  };
}

function loadState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { checks: {}, threads: {}, issueComments: {} };
  }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-TW');
}

function diffAndPrint(pr, next, prev) {
  let changed = false;

  const prevChecksByName = prev.checksByName ?? {};
  const nextChecksByName = Object.fromEntries(next.checks.all.map((c) => [c.name, c.state]));
  for (const [name, state] of Object.entries(nextChecksByName)) {
    if (prevChecksByName[name] && prevChecksByName[name] !== state) {
      console.log(`[checks] ${name}: ${prevChecksByName[name]} -> ${state}`);
      changed = true;
    } else if (!prevChecksByName[name]) {
      console.log(`[checks] 新增: ${name} ${state}`);
      changed = true;
    }
  }

  const prevThreads = prev.threads ?? {};
  const seenThread = new Set();
  for (const t of next.threads) {
    seenThread.add(t.id);
    const prevThread = prevThreads[t.id];
    if (!prevThread) {
      const latest = t.latestCodexComment;
      console.log(
        `[review] NEW  PR#${pr} thread unresolved? ${!t.isResolved} path=${t.path} line=${t.line ?? t.originalLine ?? '-'} `,
      );
      console.log(
        `       ${t.codexComments.length} 則 codex comment，最新: ${latest?.author} ${formatTime(latest?.createdAt)}`,
      );
      console.log(`       ${latest?.url}`);
      console.log(`       ${normalizeBody(latest?.body || '')}`);
      changed = true;
      continue;
    }

    if (!prevThread.isResolved && t.isResolved) {
      console.log(`[review] RESOLVED PR#${pr} thread ${t.id}`);
      console.log(`         ${t.path || 'global'} line ${t.line ?? t.originalLine ?? '-'}`);
      changed = true;
    }

    const prevComment = prevThread.lastCodexComment;
    const latest = t.latestCodexComment;
    if (latest && (!prevComment || prevComment.id !== latest.id)) {
      console.log(`[review] NEW-COMMENT PR#${pr} thread ${t.id}`);
      console.log(`            ${latest.author} ${formatTime(latest.createdAt)}`);
      console.log(`            ${latest.url}`);
      console.log(`            ${normalizeBody(latest.body)}`);
      changed = true;
    }
  }

  for (const threadId of Object.keys(prevThreads)) {
    if (!seenThread.has(threadId) && prevThreads[threadId]?.isResolved === false) {
      // 若 thread 消失，通常為 PR 更新後該 thread 被折疊或清理，記為已不再追蹤。
      console.log(`[review] PR#${pr} thread ${threadId} 已不再出現（可能已過時或被移除）`);
      changed = true;
    }
  }

  const prevIssue = prev.issueComments ?? {};
  for (const item of next.issueComments) {
    if (!prevIssue[item.id]) {
      console.log(`[issue-comment] NEW PR#${pr} ${item.author}: ${formatTime(item.createdAt)}`);
      console.log(`             ${item.url}`);
      console.log(`             ${normalizeBody(item.body)}`);
      changed = true;
    }
  }

  return {
    changed,
    checksByName: nextChecksByName,
    threads: Object.fromEntries(
      next.threads.map((t) => [
        t.id,
        {
          isResolved: t.isResolved,
          lastCodexComment: t.latestCodexComment
            ? { id: t.latestCodexComment.id, at: t.latestCodexComment.createdAt }
            : null,
        },
      ]),
    ),
    issueComments: Object.fromEntries(next.issueComments.map((c) => [c.id, true])),
  };
}

function runOnce(cfg) {
  const threads = fetchReviewThreads(cfg.pr);
  const issueComments = fetchCodexIssueComments(cfg.pr);
  const checks = fetchCheckSummary(cfg.pr);
  const nextState = {
    checksByName: Object.fromEntries(checks.all.map((c) => [c.name, c.state])),
    threads: Object.fromEntries(
      threads.map((t) => [
        t.id,
        {
          isResolved: t.isResolved,
          lastCodexComment: t.latestCodexComment
            ? { id: t.latestCodexComment.id, at: t.latestCodexComment.createdAt }
            : null,
        },
      ]),
    ),
    issueComments: Object.fromEntries(issueComments.map((c) => [c.id, true])),
  };

  const prev = loadState(cfg.stateFile);
  const result = diffAndPrint(cfg.pr, { checks, threads, issueComments }, prev);
  saveState(cfg.stateFile, { ...nextState });
  if (result.changed) {
    const byBucket = Object.entries(checks.buckets)
      .map(([bucket, list]) => `${bucket}:${list.length}`)
      .join(' ');
    console.log(
      `\n[summary] checks[${byBucket}] unresolvedThreads=${threads.filter((x) => !x.isResolved).length}\n`,
    );
  } else if (checks.warning === 'checks-unavailable') {
    console.log('[summary] checks API 未回傳可比較資料，已保留監控核心 thread 變化\n');
  }
}

async function main() {
  const cfg = parseArgs();
  do {
    const before = Date.now();
    runOnce(cfg);
    if (cfg.once) break;
    const elapsed = (Date.now() - before) / 1000;
    const wait = Math.max(1, cfg.interval - elapsed);
    await awaitDelay(wait);
  } while (cfg.follow);
}

function awaitDelay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
