---
'@app/starpuff': patch
---

內部結構重構：GameScene 以 strangler 模式拆分為星星門／慈悲補血／受擊與環境場效／玩家體感／事件路由五個子系統模組（行為零改變，玩家無可見差異）。
