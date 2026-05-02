#!/usr/bin/env node
/* globals console, process */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PR_BATCH = 25;
const DEFAULT_PR_LIMIT = 200;
const DEFAULT_THREAD_BATCH = 100;
const DEFAULT_COMMENT_BATCH = 100;
const DEFAULT_STATES = ['OPEN', 'MERGED'];
const CODEX_BOT_PATTERNS = ['chatgpt-codex-connector', 'codex', 'openai-codex'];
const NON_HUMAN_REPLY_PATTERNS = ['github-actions', '[bot]'];

function parseArgs(argv) {
  const opts = {
    repo: null,
    states: [...DEFAULT_STATES],
    prLimit: DEFAULT_PR_LIMIT,
    json: false,
    output: null,
    filter: 'all',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo' && argv[i + 1]) {
      opts.repo = argv[++i];
    } else if (arg === '--states' && argv[i + 1]) {
      opts.states = argv[++i]
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
    } else if (arg === '--pr-limit' && argv[i + 1]) {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--pr-limit 必須是正整數');
      }
      opts.prLimit = value;
    } else if (arg === '--filter' && argv[i + 1]) {
      opts.filter = argv[++i];
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--output' && argv[i + 1]) {
      opts.output = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Codex review thread 稽核

用法：
  node scripts/audit-codex-review-threads.mjs
  node scripts/audit-codex-review-threads.mjs --filter unresolved
  node scripts/audit-codex-review-threads.mjs --states OPEN,MERGED --pr-limit 100 --json
  node scripts/audit-codex-review-threads.mjs --output .cache/codex-thread-audit.json

參數：
  --repo <owner/name>      指定 repo；未提供時自動使用目前 gh repo
  --states <list>          PR 狀態，預設 OPEN,MERGED
  --pr-limit <n>           最多掃描多少張 PR，預設 ${DEFAULT_PR_LIMIT}
  --filter <type>          all | unresolved | no-reply | unresolved-no-reply | resolved-no-reply
  --json                   以 JSON 輸出
  --output <file>          將結果寫入檔案
`);
}

function ghJson(args, stdin) {
  const output = execFileSync('gh', args, {
    input: stdin,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function resolveRepo(repoArg) {
  if (repoArg) {
    const [owner, name] = repoArg.split('/');
    if (!owner || !name) {
      throw new Error('--repo 必須是 owner/name');
    }
    return { owner, name, nameWithOwner: `${owner}/${name}` };
  }
  const repo = ghJson(['repo', 'view', '--json', 'nameWithOwner']);
  const [owner, name] = repo.nameWithOwner.split('/');
  return { owner, name, nameWithOwner: repo.nameWithOwner };
}

function isCodexLogin(login = '') {
  const normalized = String(login).toLowerCase();
  return CODEX_BOT_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function isNonHumanReplyLogin(login = '') {
  const normalized = String(login).toLowerCase();
  return NON_HUMAN_REPLY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function buildPrListQuery(states) {
  const statesLiteral = states.join(', ');
  return `
    query($owner: String!, $repo: String!, $first: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: $first, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }, states: [${statesLiteral}]) {
          nodes {
            number
            title
            state
            url
            updatedAt
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;
}

function buildThreadQuery() {
  return `
    query($owner: String!, $repo: String!, $number: Int!, $first: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          number
          reviewThreads(first: $first, after: $after) {
            nodes {
              id
              isResolved
              isOutdated
              path
              line
              originalLine
              diffSide
              comments(first: ${DEFAULT_COMMENT_BATCH}) {
                nodes {
                  id
                  body
                  createdAt
                  updatedAt
                  url
                  author { login }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;
}

function buildThreadCommentsQuery() {
  return `
    query($threadId: ID!, $first: Int!, $after: String) {
      node(id: $threadId) {
        ... on PullRequestReviewThread {
          comments(first: $first, after: $after) {
            nodes {
              id
              body
              createdAt
              updatedAt
              url
              author { login }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;
}

function fetchPullRequests(repo, states, limit) {
  const query = buildPrListQuery(states);
  const prs = [];
  let after = null;

  while (prs.length < limit) {
    const first = Math.min(DEFAULT_PR_BATCH, limit - prs.length);
    const payload = ghJson(
      [
        'api',
        'graphql',
        '-F',
        `owner=${repo.owner}`,
        '-F',
        `repo=${repo.name}`,
        '-F',
        `first=${first}`,
        '-F',
        `after=${after ?? ''}`,
        '-F',
        'query=@-',
      ],
      query,
    );

    const group = payload.data?.repository?.pullRequests;
    if (!group) break;
    prs.push(...group.nodes);
    if (!group.pageInfo?.hasNextPage) break;
    after = group.pageInfo.endCursor;
  }

  return prs.slice(0, limit);
}

function fetchReviewThreads(repo, prNumber) {
  const query = buildThreadQuery();
  const threads = [];
  let after = null;

  while (true) {
    const payload = ghJson(
      [
        'api',
        'graphql',
        '-F',
        `owner=${repo.owner}`,
        '-F',
        `repo=${repo.name}`,
        '-F',
        `number=${prNumber}`,
        '-F',
        `first=${DEFAULT_THREAD_BATCH}`,
        '-F',
        `after=${after ?? ''}`,
        '-F',
        'query=@-',
      ],
      query,
    );

    const group = payload.data?.repository?.pullRequest?.reviewThreads;
    if (!group) break;
    threads.push(...group.nodes);
    if (!group.pageInfo?.hasNextPage) break;
    after = group.pageInfo.endCursor;
  }

  return threads;
}

function fetchAllThreadComments(threadId, initialComments) {
  const commentQuery = buildThreadCommentsQuery();
  const nodes = [...(initialComments?.nodes ?? [])];
  let pageInfo = initialComments?.pageInfo ?? { hasNextPage: false, endCursor: null };

  while (pageInfo.hasNextPage) {
    const payload = ghJson(
      [
        'api',
        'graphql',
        '-F',
        `threadId=${threadId}`,
        '-F',
        `first=${DEFAULT_COMMENT_BATCH}`,
        '-F',
        `after=${pageInfo.endCursor ?? ''}`,
        '-F',
        'query=@-',
      ],
      commentQuery,
    );

    const group = payload.data?.node?.comments;
    if (!group) break;
    nodes.push(...group.nodes);
    pageInfo = group.pageInfo ?? { hasNextPage: false, endCursor: null };
  }

  return nodes;
}

function classifyThread(pr, thread) {
  const allComments = fetchAllThreadComments(thread.id, thread.comments);
  const comments = allComments.map((comment) => ({
    id: comment.id,
    author: comment.author?.login ?? '(unknown)',
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    url: comment.url,
  }));
  const codexComments = comments.filter((comment) => isCodexLogin(comment.author));
  if (codexComments.length === 0) return null;

  const firstCodex = codexComments[0];
  const latestCodex = codexComments.at(-1) ?? firstCodex;
  const lastComment = comments.at(-1) ?? null;
  const hasHumanReplyAfterCodex = comments.some(
    (comment) =>
      comment.createdAt > latestCodex.createdAt &&
      !isCodexLogin(comment.author) &&
      !isNonHumanReplyLogin(comment.author),
  );
  const classes = [];
  if (!thread.isResolved) classes.push('unresolved');
  if (!hasHumanReplyAfterCodex) classes.push('no-reply');
  if (!thread.isResolved && !hasHumanReplyAfterCodex) classes.push('unresolved-no-reply');
  if (thread.isResolved && !hasHumanReplyAfterCodex) classes.push('resolved-no-reply');

  return {
    prNumber: pr.number,
    prTitle: pr.title,
    prState: pr.state,
    prUrl: pr.url,
    prUpdatedAt: pr.updatedAt,
    threadId: thread.id,
    path: thread.path,
    line: thread.line ?? thread.originalLine ?? null,
    diffSide: thread.diffSide ?? null,
    isResolved: thread.isResolved,
    isOutdated: thread.isOutdated,
    hasHumanReplyAfterCodex,
    firstCodexAt: firstCodex.createdAt,
    latestCodexAt: latestCodex.createdAt,
    lastCommentAuthor: lastComment?.author ?? null,
    lastCommentAt: lastComment?.createdAt ?? null,
    lastCommentUrl: lastComment?.url ?? null,
    codexCommentCount: codexComments.length,
    latestCodexComment: {
      author: latestCodex.author ?? null,
      createdAt: latestCodex.createdAt ?? null,
      url: latestCodex.url ?? null,
      body: latestCodex.body ?? '',
    },
    classes,
  };
}

function filterItems(items, filter) {
  if (filter === 'all') return items;
  return items.filter((item) => item.classes.includes(filter));
}

function summarize(items) {
  const counts = {
    total: items.length,
    unresolved: 0,
    noReply: 0,
    unresolvedNoReply: 0,
    resolvedNoReply: 0,
  };

  for (const item of items) {
    if (item.classes.includes('unresolved')) counts.unresolved += 1;
    if (item.classes.includes('no-reply')) counts.noReply += 1;
    if (item.classes.includes('unresolved-no-reply')) counts.unresolvedNoReply += 1;
    if (item.classes.includes('resolved-no-reply')) counts.resolvedNoReply += 1;
  }

  return counts;
}

function renderText(repo, prsScanned, items, counts, filter) {
  const lines = [];
  lines.push(`Codex review thread 稽核：${repo.nameWithOwner}`);
  lines.push(`掃描 PR 數：${prsScanned}`);
  lines.push(`篩選：${filter}`);
  lines.push(`符合條件：${items.length}`);
  lines.push(
    `統計（全量 Codex threads）：total=${counts.total}, unresolved=${counts.unresolved}, no-reply=${counts.noReply}, unresolved-no-reply=${counts.unresolvedNoReply}, resolved-no-reply=${counts.resolvedNoReply}`,
  );
  lines.push('');

  if (items.length === 0) {
    lines.push('沒有符合條件的 Codex review threads。');
    return `${lines.join('\n')}\n`;
  }

  for (const item of items) {
    lines.push(`#${item.prNumber} ${item.prTitle}`);
    lines.push(`  state=${item.prState} resolved=${item.isResolved} outdated=${item.isOutdated}`);
    lines.push(`  class=${item.classes.join(', ')}`);
    lines.push(`  file=${item.path ?? '(global)'} line=${item.line ?? '-'}`);
    lines.push(`  latest=${item.lastCommentAuthor ?? '-'} ${item.lastCommentAt ?? '-'}`);
    lines.push(`  url=${item.latestCodexComment.url ?? item.lastCommentUrl ?? item.prUrl}`);
    lines.push(`  note=${item.latestCodexComment.body.replace(/\s+/g, ' ').slice(0, 220)}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const allowedFilters = new Set([
    'all',
    'unresolved',
    'no-reply',
    'unresolved-no-reply',
    'resolved-no-reply',
  ]);
  if (!allowedFilters.has(opts.filter)) {
    throw new Error(`--filter 僅支援 ${Array.from(allowedFilters).join(', ')}`);
  }

  const repo = resolveRepo(opts.repo);
  const prs = fetchPullRequests(repo, opts.states, opts.prLimit);
  const items = [];

  for (const pr of prs) {
    const threads = fetchReviewThreads(repo, pr.number);
    for (const thread of threads) {
      const item = classifyThread(pr, thread);
      if (item) items.push(item);
    }
  }

  items.sort((a, b) => Date.parse(b.firstCodexAt) - Date.parse(a.firstCodexAt));
  const filtered = filterItems(items, opts.filter);
  const counts = summarize(items);
  const result = {
    repo: repo.nameWithOwner,
    scannedAt: new Date().toISOString(),
    filters: {
      states: opts.states,
      prLimit: opts.prLimit,
      filter: opts.filter,
    },
    scannedPrCount: prs.length,
    matchedCount: filtered.length,
    counts,
    items: filtered,
  };

  const output = opts.json
    ? `${JSON.stringify(result, null, 2)}\n`
    : renderText(repo, prs.length, filtered, counts, opts.filter);
  if (opts.output) {
    fs.mkdirSync(path.dirname(opts.output), { recursive: true });
    fs.writeFileSync(opts.output, output, 'utf8');
  }
  process.stdout.write(output);
}

main();
