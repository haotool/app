#!/usr/bin/env node
/* globals console, process */
/**
 * Codex PR 評論過濾腳本
 *
 * 用法：
 *   node scripts/codex-review.mjs           # 近 7 天所有 PR 的 Codex 評論
 *   node scripts/codex-review.mjs --days 14 # 近 14 天
 *   node scripts/codex-review.mjs --pr 168  # 指定 PR 號碼
 *   node scripts/codex-review.mjs --open    # 僅列出未解決（無 resolved 標記）
 */

import { execSync } from 'node:child_process';

const CODEX_BOT_PATTERNS = ['chatgpt-codex-connector[bot]', 'codex[bot]', 'openai-codex'];

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function gh(cmd) {
  return JSON.parse(execSync(`gh ${cmd}`, { encoding: 'utf8' }));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { days: 7, pr: null, openOnly: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) opts.days = Number(args[++i]);
    if (args[i] === '--pr' && args[i + 1]) opts.pr = Number(args[++i]);
    if (args[i] === '--open') opts.openOnly = true;
  }
  return opts;
}

function isCodexBot(login) {
  return CODEX_BOT_PATTERNS.some((p) => login.includes('codex') || login === p);
}

function extractBadge(body) {
  const m = body.match(/!\[([^[\]]+) Badge\]/);
  return m ? m[1] : null;
}

function extractTitle(body) {
  // Bold text after badge line
  const m = body.match(/\*\*(.+?)\*\*/);
  return m ? m[1].replace(/!\[[^\]]+\]\([^)]+\)\s*/g, '').trim() : '(無標題)';
}

function formatComment(pr, comment) {
  const badge = extractBadge(comment.body);
  const title = extractTitle(comment.body);
  const badgeColor = badge === 'P1' ? colors.red : badge === 'P2' ? colors.yellow : colors.cyan;
  const badgeStr = badge ? `${badgeColor}[${badge}]${colors.reset} ` : '';

  const lines = [
    `${colors.bold}PR #${pr.number}${colors.reset} ${colors.gray}${pr.title}${colors.reset}`,
    `  ${badgeStr}${colors.bold}${title}${colors.reset}`,
    `  ${colors.gray}File: ${comment.path ?? '(issue comment)'}${colors.reset}`,
    `  ${colors.blue}${comment.html_url}${colors.reset}`,
    '',
    ...comment.body
      .split('\n')
      .slice(0, 6)
      .map((l) => `  ${colors.gray}${l}${colors.reset}`),
    `  ${colors.gray}...${colors.reset}`,
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs();
  const cutoff = new Date(Date.now() - opts.days * 86400 * 1000).toISOString();

  let prs;
  if (opts.pr) {
    prs = [gh(`pr view ${opts.pr} --json number,title,createdAt,state`)];
  } else {
    prs = gh(`pr list --state all --limit 50 --json number,title,createdAt,state`).filter(
      (pr) => pr.createdAt >= cutoff,
    );
  }

  console.log(
    `\n${colors.bold}${colors.blue}Codex PR 評論過濾${colors.reset}  ${colors.gray}(近 ${opts.days} 天，${prs.length} 個 PR)${colors.reset}\n`,
  );

  let total = 0;

  for (const pr of prs) {
    const inlineComments = gh(
      `api repos/{owner}/{repo}/pulls/${pr.number}/comments --paginate`,
    ).filter((c) => isCodexBot(c.user.login));

    const issueComments = gh(
      `api repos/{owner}/{repo}/issues/${pr.number}/comments --paginate`,
    ).filter((c) => isCodexBot(c.user.login));

    const allComments = [...inlineComments, ...issueComments];

    const filtered = opts.openOnly
      ? allComments.filter((c) => !c.body.includes('resolved') && !c.body.includes('已解決'))
      : allComments;

    for (const comment of filtered) {
      console.log(formatComment(pr, comment));
      total++;
    }
  }

  if (total === 0) {
    console.log(`${colors.green}✓ 近 ${opts.days} 天無未解決 Codex 評論${colors.reset}\n`);
  } else {
    console.log(
      `${colors.yellow}共 ${total} 則 Codex 評論${opts.openOnly ? '（未解決）' : ''}${colors.reset}\n`,
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
