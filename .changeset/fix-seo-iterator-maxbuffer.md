---
'ratewise-monorepo': patch
---

修正 SEO 迭代器 spawnSync maxBuffer 上限，避免日誌過多時 ENOBUFS 導致迭代失敗
