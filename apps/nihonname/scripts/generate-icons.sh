#!/bin/bash
# generate-icons.sh - 生成所有 PWA 圖標
# [Created: 2025-12-06] 使用 sharp-cli 或 ImageMagick 生成圖標

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_DIR/public"
ICONS_DIR="$PUBLIC_DIR/icons"

echo "📁 Project: $PROJECT_DIR"
echo "📁 Public: $PUBLIC_DIR"
echo "📁 Icons: $ICONS_DIR"

# 確保 icons 目錄存在
mkdir -p "$ICONS_DIR"

# 檢查是否有 ImageMagick
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick detected"
    
    # 從 SVG 生成 PNG 圖標
    echo "🎨 Generating PNG icons from favicon.svg..."
    
    # favicon-16x16.png
    convert -background none -resize 16x16 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/favicon-16x16.png"
    echo "  ✓ favicon-16x16.png"
    
    # favicon-32x32.png
    convert -background none -resize 32x32 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/favicon-32x32.png"
    echo "  ✓ favicon-32x32.png"
    
    # apple-touch-icon.png (180x180)
    convert -background none -resize 180x180 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/apple-touch-icon.png"
    cp "$ICONS_DIR/apple-touch-icon.png" "$PUBLIC_DIR/apple-touch-icon.png"
    echo "  ✓ apple-touch-icon.png"
    
    # icon-192x192.png (PWA)
    convert -background none -resize 192x192 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/icon-192x192.png"
    echo "  ✓ icon-192x192.png"
    
    # icon-512x512.png (PWA)
    convert -background none -resize 512x512 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/icon-512x512.png"
    echo "  ✓ icon-512x512.png"
    
    # maskable-icon-512x512.png (PWA maskable - 帶安全區域)
    # 先生成 512x512，然後加白色背景和圓角
    convert -background "#faf5f0" -resize 512x512 -gravity center -extent 512x512 "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/maskable-icon-512x512.png"
    echo "  ✓ maskable-icon-512x512.png"
    
    # favicon.ico (多尺寸)
    convert -background none "$PUBLIC_DIR/favicon.svg" -define icon:auto-resize=48,32,16 "$PUBLIC_DIR/favicon.ico"
    cp "$PUBLIC_DIR/favicon.ico" "$ICONS_DIR/favicon.ico"
    echo "  ✓ favicon.ico"
    
    # 複製 SVG 到 icons 目錄
    cp "$PUBLIC_DIR/favicon.svg" "$ICONS_DIR/icon.svg"
    echo "  ✓ icon.svg"
    
    echo ""
    echo "✅ All icons generated successfully!"
    
elif command -v sips &> /dev/null; then
    echo "⚠️ Only sips available (macOS). Limited functionality."
    echo "   Please install ImageMagick for full support:"
    echo "   brew install imagemagick"
    exit 1
else
    echo "❌ No image processing tool found!"
    echo "   Please install ImageMagick:"
    echo "   brew install imagemagick"
    exit 1
fi

# 顯示生成的文件
echo ""
echo "📋 Generated files:"
ls -la "$ICONS_DIR"
echo ""
ls -la "$PUBLIC_DIR/favicon.ico" "$PUBLIC_DIR/favicon.svg" "$PUBLIC_DIR/apple-touch-icon.png" 2>/dev/null || true

