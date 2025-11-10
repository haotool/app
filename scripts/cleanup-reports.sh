#!/bin/bash
# 專業級文檔清理腳本
# 執行時間：2025-11-10T02:45:00+08:00

set -e

echo "🧹 開始執行專業級文檔清理..."
echo "======================================"

# 1. 移除根目錄臨時總結文檔
echo "📝 清理根目錄臨時文檔..."
rm -f FINAL_LINUS_SCAN_SUMMARY.md
rm -f FINAL_DEPLOYMENT_SUMMARY.md

# 2. 移除 docs/dev/ 報告與日誌文檔
echo "📝 清理 docs/dev/ 報告與日誌..."
rm -f docs/dev/LIGHTHOUSE_OPTIMIZATION_LOG.md
rm -f docs/dev/LIGHTHOUSE_OPTIMIZATION_REPORT_20251107.md
rm -f docs/dev/E2E_TEST_FIX_LOG.md
rm -f docs/dev/CI_CD_WORK_LOG.md
rm -f docs/dev/TEST_COVERAGE_IMPROVEMENT.md

# 3. 移除 apps/ratewise/docs/ 報告與總結
echo "📝 清理 apps/ratewise/docs/ 報告..."
rm -f apps/ratewise/docs/PWA_UPDATE_FINAL_REPORT.md
rm -f apps/ratewise/docs/IMAGE_OPTIMIZATION_REPORT.md
rm -f apps/ratewise/docs/OPTIMIZATION_SUMMARY.md
rm -f apps/ratewise/docs/LIGHTHOUSE_OPTIMIZATION_SUMMARY.md

# 4. 移除 tests/ 測試報告
echo "📝 清理 tests/ 測試報告..."
rm -f tests/notification-system-test-report.md

# 5. 移除 docs/ 臨時任務清單
echo "📝 清理 docs/ 臨時任務..."
rm -f docs/REMAINING_TASKS.md

# 6. 移除 tmp/ 臨時文件
echo "📝 清理 tmp/ 臨時文件..."
rm -rf tmp/

# 7. 歸檔 008 驗證報告
echo "📝 歸檔 008 驗證報告..."
mkdir -p docs/archive/reports
mv docs/dev/008_sw_cache_fix_verification_report.md docs/archive/reports/ 2>/dev/null || true

# 8. 清理 apps/ratewise 臨時文件
echo "📝 清理 apps/ratewise 臨時文件..."
rm -f apps/ratewise/lighthouse-report.json
rm -f apps/ratewise/preview-lighthouse.log
rm -f apps/ratewise/preview-server.log
rm -f apps/ratewise/build-output.log
rm -f apps/ratewise/docker-build.log
rm -f apps/ratewise/docker-build-test.log
rm -f apps/ratewise/test-output.log

# 9. 清理根目錄臨時文件
echo "📝 清理根目錄臨時文件..."
rm -f build-output.log
rm -f docker-build.log
rm -f docker-build-test.log
rm -f test-output.log
rm -f lighthouse-report.json

echo ""
echo "✅ 文檔清理完成！"
echo ""
echo "📊 清理統計："
echo "  - 移除臨時總結文檔：2 個"
echo "  - 移除開發報告/日誌：5 個"
echo "  - 移除應用報告/總結：4 個"
echo "  - 移除測試報告：1 個"
echo "  - 歸檔驗證報告：1 個"
echo "  - 清理臨時文件：10+ 個"
echo ""
echo "📋 下一步："
echo "  git status"
echo "  git add ."
echo "  git commit -m 'chore(docs): 專業級文檔清理 - 移除報告/總結/日誌類臨時文檔'"
