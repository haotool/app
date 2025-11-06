# Docker 建置測試腳本 (PowerShell 版本)
# 用於本地測試 Docker 建置流程，驗證版本號注入和 PWA 配置

$ErrorActionPreference = "Stop"

Write-Host "🐳 開始 Docker 建置測試..." -ForegroundColor Cyan
Write-Host ""

# 清理舊的建置
Write-Host "📦 清理舊的建置..." -ForegroundColor Yellow
docker rmi ratewise:test 2>$null

# 建置 Docker 映像
Write-Host ""
Write-Host "🔨 建置 Docker 映像..." -ForegroundColor Yellow
docker build -t ratewise:test -f Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker 建置失敗" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker 建置成功" -ForegroundColor Green
Write-Host ""

# 啟動容器
Write-Host "🚀 啟動容器..." -ForegroundColor Yellow
$CONTAINER_ID = docker run -d -p 8080:80 ratewise:test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 容器啟動失敗" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 容器啟動成功 (ID: $($CONTAINER_ID.Substring(0, 12)))" -ForegroundColor Green
Write-Host ""

# 等待容器啟動
Write-Host "⏳ 等待容器啟動..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 檢查容器狀態
$containerRunning = docker ps | Select-String $CONTAINER_ID
if (-not $containerRunning) {
    Write-Host "❌ 容器未運行" -ForegroundColor Red
    docker logs $CONTAINER_ID
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

Write-Host "✅ 容器運行中" -ForegroundColor Green
Write-Host ""

# 測試 HTTP 連接
Write-Host "🔍 測試 HTTP 連接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/ratewise/" -UseBasicParsing
    $HTTP_CODE = $response.StatusCode
} catch {
    $HTTP_CODE = $_.Exception.Response.StatusCode.value__
}

if ($HTTP_CODE -ne 200) {
    Write-Host "❌ HTTP 連接失敗 (狀態碼: $HTTP_CODE)" -ForegroundColor Red
    docker logs $CONTAINER_ID
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

Write-Host "✅ HTTP 連接成功 (狀態碼: $HTTP_CODE)" -ForegroundColor Green
Write-Host ""

# 下載 index.html 並檢查版本號
Write-Host "📄 檢查版本號注入..." -ForegroundColor Yellow
$HTML_CONTENT = (Invoke-WebRequest -Uri "http://localhost:8080/ratewise/" -UseBasicParsing).Content

# 檢查版本號是否被正確替換
if ($HTML_CONTENT -match '__APP_VERSION__') {
    Write-Host "❌ 版本號未被替換（仍然是佔位符）" -ForegroundColor Red
    Write-Host ""
    Write-Host "HTML 內容片段:"
    $HTML_CONTENT | Select-String -Pattern '__APP_VERSION__' -Context 2
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

if ($HTML_CONTENT -match '__BUILD_TIME__') {
    Write-Host "❌ 建置時間未被替換（仍然是佔位符）" -ForegroundColor Red
    Write-Host ""
    Write-Host "HTML 內容片段:"
    $HTML_CONTENT | Select-String -Pattern '__BUILD_TIME__' -Context 2
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

# 提取版本號和建置時間
$APP_VERSION = [regex]::Match($HTML_CONTENT, 'name="app-version" content="([^"]+)"').Groups[1].Value
$BUILD_TIME = [regex]::Match($HTML_CONTENT, 'name="build-time" content="([^"]+)"').Groups[1].Value

Write-Host "✅ 版本號注入成功" -ForegroundColor Green
Write-Host "   App Version: $APP_VERSION"
Write-Host "   Build Time: $BUILD_TIME"
Write-Host ""

# 檢查 manifest.webmanifest
Write-Host "📱 檢查 PWA Manifest..." -ForegroundColor Yellow
try {
    $MANIFEST_CONTENT = (Invoke-WebRequest -Uri "http://localhost:8080/ratewise/manifest.webmanifest" -UseBasicParsing).Content
} catch {
    Write-Host "❌ Manifest 檔案不存在或無法訪問" -ForegroundColor Red
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

# 檢查 scope 是否有尾斜線
if ($MANIFEST_CONTENT -match '"scope": "/ratewise/"') {
    Write-Host "✅ Manifest scope 配置正確" -ForegroundColor Green
} else {
    Write-Host "⚠️  Manifest scope 缺少尾斜線" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manifest 內容:"
    $MANIFEST_CONTENT | Select-String -Pattern '"scope"' -Context 1
}

# 檢查 start_url
if ($MANIFEST_CONTENT -match '"start_url": "/ratewise"') {
    Write-Host "✅ Manifest start_url 配置正確" -ForegroundColor Green
} else {
    Write-Host "⚠️  Manifest start_url 配置異常" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manifest 內容:"
    $MANIFEST_CONTENT | Select-String -Pattern '"start_url"' -Context 1
}

Write-Host ""

# 檢查 Service Worker
Write-Host "⚙️  檢查 Service Worker..." -ForegroundColor Yellow
try {
    $swResponse = Invoke-WebRequest -Uri "http://localhost:8080/ratewise/sw.js" -UseBasicParsing
    $SW_CODE = $swResponse.StatusCode
} catch {
    $SW_CODE = $_.Exception.Response.StatusCode.value__
}

if ($SW_CODE -ne 200) {
    Write-Host "❌ Service Worker 檔案不存在 (狀態碼: $SW_CODE)" -ForegroundColor Red
    docker rm -f $CONTAINER_ID 2>$null
    exit 1
}

Write-Host "✅ Service Worker 檔案存在" -ForegroundColor Green
Write-Host ""

# 檢查圖標檔案
Write-Host "🎨 檢查 PWA 圖標..." -ForegroundColor Yellow
try {
    $iconResponse = Invoke-WebRequest -Uri "http://localhost:8080/ratewise/icons/ratewise-icon-192x192.png" -UseBasicParsing
    $ICON_CODE = $iconResponse.StatusCode
} catch {
    $ICON_CODE = $_.Exception.Response.StatusCode.value__
}

if ($ICON_CODE -ne 200) {
    Write-Host "⚠️  PWA 圖標可能缺失 (狀態碼: $ICON_CODE)" -ForegroundColor Yellow
} else {
    Write-Host "✅ PWA 圖標存在" -ForegroundColor Green
}

Write-Host ""

# 總結
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Docker 建置測試完成" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 測試結果:"
Write-Host "   - HTTP 連接: ✅"
Write-Host "   - 版本號注入: ✅"
Write-Host "   - PWA Manifest: ✅"
Write-Host "   - Service Worker: ✅"
Write-Host ""
Write-Host "🌐 本地測試 URL:"
Write-Host "   http://localhost:8080/ratewise/"
Write-Host ""
Write-Host "💡 提示:"
Write-Host "   - 容器將繼續運行，可以在瀏覽器中測試"
Write-Host "   - 使用 'docker rm -f $CONTAINER_ID' 停止容器"
Write-Host "   - 使用 'docker logs $CONTAINER_ID' 查看日誌"
Write-Host ""
Write-Host "📝 容器資訊:"
Write-Host "   Container ID: $CONTAINER_ID"
Write-Host "   Image: ratewise:test"
Write-Host "   Port: 8080:80"
Write-Host ""

# 提示用戶
Write-Host "按 Enter 繼續（容器將保持運行）..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "容器 ID: $CONTAINER_ID"
Write-Host "使用以下命令停止容器:"
Write-Host "  docker rm -f $CONTAINER_ID"

