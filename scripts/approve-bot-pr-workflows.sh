#!/usr/bin/env bash
# bot PR（GITHUB_TOKEN 建立）的 pull_request workflow 補償鏈 SSOT。
# 用法：approve-bot-pr-workflows.sh <branch> <head_sha> [pr_number]
# 需 env：GH_TOKEN、GITHUB_REPOSITORY
set -euo pipefail

BRANCH="$1"
HEAD_SHA="$2"
PR_NUMBER="${3:-}"
BRANCH_ENC=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$BRANCH")

fetch_pending_ids() {
  gh api "repos/${GITHUB_REPOSITORY}/actions/runs?branch=${BRANCH_ENC}&event=pull_request&per_page=30" \
    --jq "[.workflow_runs[] | select(.head_sha == \"${HEAD_SHA}\" and (.status == \"action_required\" or .conclusion == \"action_required\"))] | map(.id) | join(\" \")"
}

fetch_any_run_count() {
  gh api "repos/${GITHUB_REPOSITORY}/actions/runs?branch=${BRANCH_ENC}&event=pull_request&per_page=30" \
    --jq "[.workflow_runs[] | select(.head_sha == \"${HEAD_SHA}\")] | length"
}

PENDING_IDS=""
for _ in {1..12}; do
  sleep 5
  PENDING_IDS=$(fetch_pending_ids)
  if [ -n "$PENDING_IDS" ]; then
    break
  fi
done

if [ -z "$PENDING_IDS" ]; then
  ANY_RUN=$(fetch_any_run_count)
  if [ "$ANY_RUN" -gt 0 ]; then
    echo "No approval-required pull_request runs for ${HEAD_SHA}; CI already active."
    exit 0
  fi
  if [ -z "$PR_NUMBER" ]; then
    echo "::error::No pull_request runs for ${HEAD_SHA} and no PR number for close/reopen."
    exit 1
  fi
  echo "No pull_request runs for ${HEAD_SHA}; close/reopen PR #${PR_NUMBER} to trigger CI..."
  gh pr close "$PR_NUMBER"
  gh pr reopen "$PR_NUMBER"
  sleep 15
  HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid -q .headRefOid)
  for _ in {1..12}; do
    sleep 5
    PENDING_IDS=$(fetch_pending_ids)
    ANY_RUN=$(fetch_any_run_count)
    if [ -n "$PENDING_IDS" ] || [ "$ANY_RUN" -gt 0 ]; then
      break
    fi
  done
  if [ -z "$PENDING_IDS" ] && [ "$ANY_RUN" -eq 0 ]; then
    echo "::error::No pull_request runs after close/reopen for ${HEAD_SHA}; add RELEASE_PAT secret (issue #771)."
    exit 1
  fi
  if [ -z "$PENDING_IDS" ]; then
    echo "pull_request runs exist after close/reopen; no approval required."
    exit 0
  fi
fi

for RUN in $PENDING_IDS; do
  if gh api -X POST "repos/${GITHUB_REPOSITORY}/actions/runs/${RUN}/approve" >/dev/null; then
    echo "Approved pull_request run ${RUN}"
  else
    echo "::error::Failed to approve pull_request run ${RUN}. GITHUB_TOKEN may lack permission; add RELEASE_PAT — issue #771."
    exit 1
  fi
done
