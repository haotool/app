---
'@app/ratewise': patch
---

將 RateWise 品牌字串統一收斂至 `src/config/app-info.ts` SSOT。SEO metadata、UI 文案、i18n、build scripts、靜態公共檔（offline.html / security.txt 透過 `scripts/templates/` 模板 + prebuild 生成）皆改以 `APP_INFO.shortName` / `APP_INFO.name` 組合，未來若更名 shortName 只需改一處即可散播至所有產出物。
