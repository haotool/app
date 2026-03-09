---
'@app/ratewise': patch
---

fix(ratewise): 修復 apple-touch-icon 與 PWA 圖示去背透明度

- apple-touch-icon.png：從 solid #eef3fb 背景重新生成為透明去背版本（87% 透明）
- pwa-192x192.png、pwa-384x384.png、pwa-512x512.png：同步修復為透明版本
- public/optimized/apple-touch-icon-112w.webp / .avif：同步更新透明版本
- 保留 pwa-512x512-maskable.png 的 solid 背景（maskable icon 規範需要安全區域）
