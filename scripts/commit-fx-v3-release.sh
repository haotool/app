#!/usr/bin/env bash
# v3 release 專用提交：只提交 public/rates/v3/，不觸碰 v2 latest.json。
# 任何失敗皆以非零結束，讓 publish-v3 job 標紅（不得以 continue-on-error 遮蔽）。
set -euo pipefail

MESSAGE="${1:?commit message required}"
V3_DIR="public/rates/v3"
PURGE_URL="https://purge.jsdelivr.net/gh/haotool/app@data/${V3_DIR}/current.json"

if [[ -z "$(git status --porcelain --untracked-files=all -- "$V3_DIR/")" ]]; then
  echo "ℹ️ v3 release unchanged; nothing to commit or purge."
  exit 0
fi

# checkout 不保存 credentials（persist-credentials: false）；token 只在本步驟以 extraheader 注入，
# 不寫入 .git/config。未提供 token 時（本機驗證）沿用既有 git 認證。
git_remote() {
  if [[ -n "${GIT_PUSH_TOKEN:-}" ]]; then
    local auth
    auth=$(printf 'x-access-token:%s' "$GIT_PUSH_TOKEN" | base64 | tr -d '\n')
    echo "::add-mask::${auth}"
    git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth}" "$@"
  else
    git "$@"
  fi
}

git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"
git add "$V3_DIR/"
git commit -m "$MESSAGE" -m "🤖 Published by the v3 release job"

for i in 1 2 3; do
  if git_remote pull --rebase origin data && git_remote push origin HEAD:data; then
    echo "✅ v3 release pushed"
    break
  fi
  if [[ $i -eq 3 ]]; then
    echo "::error::v3 release push failed after 3 attempts"
    exit 1
  fi
  sleep 5
done

for i in 1 2 3; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PURGE_URL")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ CDN cache purged: $PURGE_URL"
    exit 0
  fi
  echo "⚠️ Purge attempt $i failed (HTTP $HTTP_STATUS)"
  sleep 5
done
echo "::warning::v3 pointer purge failed; CDN may serve the previous pointer until TTL expires"
