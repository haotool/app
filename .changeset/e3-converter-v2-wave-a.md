---
'@app/ratewise': minor
---

新增單幣別換算 v2「等值雙列」實驗模式（flag `converter-v2`，預設關閉）：兩列對等可編輯、divider
內嵌 swap、一行 rate chip（tap 切換現金／即期）、常駐 4×4 計算機、bottom sheet 幣別選擇器、
72px sparkline 漲跌摘要與 65vh 趨勢圖（7 天／30 天／90 天、最高最低標記、長按十字線）；
短螢幕自動壓縮留白以維持免捲動；切換編輯列僅移動輸入焦點、不改動任何既有數值；可經
`?converter=v2` 搶先體驗，flag 關閉時行為與現行完全一致。
