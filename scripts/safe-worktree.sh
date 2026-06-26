#!/usr/bin/env bash
#
# safe-worktree.sh — 防 stale baseline 白工的 worktree 建立守門。
#
# 動機：多次出現「從本地過期同名分支開 worktree → 工作早已在 origin 收編 → 整支 PR 白工/回退」
# 的事故（例：被取代的 cluster PR）。本腳本一律以 origin/<base> 的最新 tip 為基準建立 worktree，
# 使過期的本地分支在物理上無法成為起點。
#
# 用法：
#   scripts/safe-worktree.sh <new-branch> <worktree-path> [base-branch]
#
# 範例：
#   scripts/safe-worktree.sh fix/foo ../app-foo main
#   scripts/safe-worktree.sh converge/bar ../app-bar chore/ratewise-production-governance-v2
#
set -euo pipefail

NEW_BRANCH="${1:?用法：safe-worktree.sh <new-branch> <worktree-path> [base-branch]}"
WORKTREE_PATH="${2:?需要 worktree 路徑}"
BASE="${3:-main}"
REMOTE_REF="origin/${BASE}"

echo "🔄 git fetch --all --prune ..."
git fetch --all --prune

if ! git rev-parse --verify --quiet "${REMOTE_REF}" >/dev/null; then
  echo "❌ 找不到遠端分支 ${REMOTE_REF}，請確認 base 名稱。" >&2
  exit 1
fi

REMOTE_SHA="$(git rev-parse "${REMOTE_REF}")"

# 若本地存在同名分支，檢查是否落後 origin（落後＝stale，提醒但仍以 origin 為準）。
if git rev-parse --verify --quiet "refs/heads/${BASE}" >/dev/null; then
  LOCAL_SHA="$(git rev-parse "${BASE}")"
  if [ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]; then
    AHEAD="$(git rev-list --count "${REMOTE_REF}..${BASE}")"
    BEHIND="$(git rev-list --count "${BASE}..${REMOTE_REF}")"
    echo "⚠️  本地 ${BASE} (${LOCAL_SHA:0:8}) 與 ${REMOTE_REF} (${REMOTE_SHA:0:8}) 不一致：ahead ${AHEAD} / behind ${BEHIND}" >&2
    echo "    一律以 ${REMOTE_REF} 最新 tip 為基準，避免 stale baseline 白工。" >&2
  fi
fi

echo "🌱 git worktree add -b ${NEW_BRANCH} ${WORKTREE_PATH} ${REMOTE_REF}（@ ${REMOTE_SHA:0:8}）"
git worktree add -b "${NEW_BRANCH}" "${WORKTREE_PATH}" "${REMOTE_SHA}"
echo "✅ worktree 已從 ${REMOTE_REF} @ ${REMOTE_SHA:0:8} 建立：${WORKTREE_PATH}"
