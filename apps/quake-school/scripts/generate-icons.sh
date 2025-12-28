#!/bin/bash
# PWA Icon Generator for Quake-School
# 需要安裝 ImageMagick: brew install imagemagick

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/public/icons"
SOURCE_SVG="$PROJECT_DIR/public/favicon.svg"

# 確保目錄存在
mkdir -p "$ICONS_DIR"

echo "🎨 Generating PWA icons from $SOURCE_SVG..."

# 生成各種尺寸的 PNG 圖標
convert "$SOURCE_SVG" -resize 16x16 "$ICONS_DIR/favicon-16x16.png"
convert "$SOURCE_SVG" -resize 32x32 "$ICONS_DIR/favicon-32x32.png"
convert "$SOURCE_SVG" -resize 180x180 "$ICONS_DIR/apple-touch-icon.png"
convert "$SOURCE_SVG" -resize 192x192 "$ICONS_DIR/icon-192x192.png"
convert "$SOURCE_SVG" -resize 512x512 "$ICONS_DIR/icon-512x512.png"

# 生成 maskable icon (需要較大的安全區域)
convert "$SOURCE_SVG" -resize 512x512 -gravity center -background "#dc2626" -extent 640x640 "$ICONS_DIR/maskable-icon-512x512.png"

# 複製到 public 根目錄
cp "$ICONS_DIR/apple-touch-icon.png" "$PROJECT_DIR/public/apple-touch-icon.png"
cp "$SOURCE_SVG" "$ICONS_DIR/icon.svg"

# 生成 favicon.ico (多尺寸)
convert "$SOURCE_SVG" -resize 16x16 -resize 32x32 -resize 48x48 "$PROJECT_DIR/public/favicon.ico"

echo "✅ Icons generated successfully!"
echo "Generated files:"
ls -la "$ICONS_DIR/"
