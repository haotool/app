---
'@app/ratewise': patch
---

修復已設定「等值雙列」模式的使用者冷啟動時 console 出現的 React #418 hydration 錯誤：首屏先與預渲染輸出一致，畫面繪製前才切換至等值雙列版面，無可察覺閃爍。
