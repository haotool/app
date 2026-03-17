---
'@app/ratewise': patch
---

fix(seo): 匯差腳本幣別缺漏時中止生成，防止不完整資料污染生產 SEO 內容

- errors > 0 時改為 console.error + process.exit(1)，確保 GitHub Actions 工作流程明確失敗
- 防止上游 API 暫時缺漏幣別時，腳本靜默提交不完整的 seo-rate-examples.ts 至主分支
