# 星噗噗 — 美術資產、音效與演出

> **職責範圍**：看起來與聽起來的規格。統一風格關鍵詞與各批 codex imagegen 資產清單、背景平鋪與視差、場景裝飾密度、Juice 清單與動畫打磨、zzfx 音效表。
>
> **不在本檔**：物理/視覺縮放解耦通道（架構契約，見 `00-foundations.md` §117）；震屏強度偏好（見 `05-save-settings.md` §118.2）。
>
> **紀律**：codex imagegen 僅用於本檔列出的資產批次；走路／跳躍等動作一律程式 tween，不生成逐幀序列。
>
> **閱讀慣例**：每一句主文都是現行有效規則；被取代的舊規則一律降級為緊接其後的 `> **已廢止**` 附註，僅供追溯。索引與取代對照見 [`../GAME_DESIGN.md`](../GAME_DESIGN.md) 與 [`99-superseded.md`](99-superseded.md)。章號 §N 為全專案穩定識別碼（程式註解直接引用），拆檔不重新編號。

## 8. Juice 清單（品質關鍵，全數必做）

hit-stop 60ms、震屏 4px、受擊白閃、squash & stretch（跳躍/落地/吸入鼓脹）、吸入漩渦粒子、星彈拖尾、傷害數字浮動、魔王死亡星爆、HP 心心受擊跳動、按鈕按壓回饋、入場/退場 tween。

## 9. 音效（zzfx，零音檔資產）

jump、flap、inhale（迴圈）、swallow、shoot、hit、hurt、metal（皇冠落地）、pop（puffy 爆裂）、chomp（咬咬花咬合）、boss-roar、boss-slam、win、lose；BGM 用 zzfx 合成短循環（手刻序列混音，零依賴）。首次觸控後 resume AudioContext（iOS 必須）。靜音偏好存 `sp-settings.audioMuted`（§118.1），設定頁「音效」開關即改即存。

> **已廢止**（v19 起，現行見 §118.1）：獨立 localStorage 鍵 `sp-muted`——僅存留為一次性 migration 來源，落盤成功後刪除。

## 10. 美術資產規格（codex imagegen 專用；除此之外嚴禁動用 codex）

統一風格關鍵詞（每次生成必附）：
`kawaii chibi jelly creature, soft pastel palette, thick rounded soft outline, glossy jelly highlight, flat cel shading, clean high-quality mobile game sprite, centered, full body`

透明需求資產以 flat #00ff00 背景生成後去背。生成尺寸 2048×2048（bg 為 1024×1536），交付至 `apps/starpuff/src/assets/sprites/`。表列 `.png` 為生成源檔名；實際入庫交付為同名 `.webp`（q82 壓縮，透明保留）。

| 檔名              | 內容                                        | 備註                                                 |
| ----------------- | ------------------------------------------- | ---------------------------------------------------- |
| hero-idle.png     | 噗噗待機：圓潤微笑、星星呆毛                | 薄荷奶油 #BFF3E0、腮紅 #FFB7A0                       |
| hero-inhale.png   | 噗噗張大嘴吸入                              | 嘴佔臉 40%                                           |
| hero-puffed.png   | 噗噗雙頰鼓滿                                | 含住星星微光                                         |
| hero-hurt.png     | 噗噗受傷 >\_<                               | 淚珠                                                 |
| minion-jelly.png  | 果凍丁                                      | 草莓粉 #FFB3C7                                       |
| minion-floaty.png | 飄飄鳥                                      | 薰衣草 #CBB7F0、小翅                                 |
| minion-spiky.png  | 刺刺瓜                                      | 萊姆 #D9F29B、短刺                                   |
| boss-idle.png     | 果凍王+金皇冠                               | 葡萄紫 #9B7BD8、跋扈眉                               |
| boss-enraged.png  | 果凍王憤怒紅化                              | 紅暈 #FF6B6B、怒目                                   |
| fx-star.png       | 五角星彈+光暈                               | 金黃 #FFD966                                         |
| bg-arena.png      | 直向粉彩天空果凍島戰場（1024×1536，不去背） | 底部 1/3 乾淨平台區、上 2/3 雲朵漸層 #FDEFF6→#D6ECFF |

走路/跳躍動畫一律用程式 tween（squash/stretch/bob/rotate）實現，不生成逐幀序列。PWA icon 由 hero-idle 裁切導出。

### 素材基準朝向慣例（facing hotfix 定案，全素材恆成立）

- **有左右朝向的角色素材（主角、方向性小怪）基準一律朝右**；面向左由程式 `setFlipX(true)` 鏡像呈現，嚴禁交付朝左素材再於程式端加負號補償。
- 新素材入庫前必須目視確認朝向；朝左的生成結果以水平翻轉（flop）規範化後才可交付。
- 程式端面向決策唯一出口為 `src/game/systems/enemyFacing.ts`（主角為 `player.ts` 既有 `facing` 通道）；方向性品種清單 `DIRECTIONAL_ENEMY_KINDS` 由表驅動測試與型別完整性守門雙重把關，新增品種必須顯式歸類。
- 正面或對稱構圖素材（如 magno、splatta——臉正面、僅持物不對稱）歸非方向性，不做 flip。

## 18. 動畫流暢度打磨清單（全實體）

走路彈跳（玩家移動時 y 微幅 bob + 輕微傾斜）、落地塵埃圈（著地速度 >300 觸發）、所有敵人生成 popIn（scale 0→1 back.out）、死亡 squash 消失、星星門吸入過關演出（玩家縮小旋轉飛入）、轉場卡緩動（slide+fade）、鏡頭剛性跟隨 lerp(1,1)（v3 定案；lerp×roundPixels 逐幀往返跳動的根因修復見 §25 抖動修復定案）。

## 19. v2 美術資產增補（codex 專用；生成尺寸同 §10 規範）

| 檔名              | 內容                                                                     | 備註                               |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| bg-meadow.png     | 直向果凍草原：粉綠草丘、果凍花、奶油雲（1024×1536 不透明）               | 底 1/3 乾淨地面                    |
| bg-heights.png    | 直向雲朵高台：高空粉藍雲海、遠景漂浮果凍島（1024×1536 不透明）           | 底 1/3 乾淨、中段留平台視覺空間    |
| bg-throne.png     | 直向魔王城王座廳：葡萄紫果凍城、金冠紋飾、戲劇但可愛（1024×1536 不透明） | 底 1/3 乾淨、頂部王座剪影          |
| minion-puffy.png  | 氣球魨（2048 透明）                                                      | 珊瑚粉 #FFA8A0、短圓刺、驚訝圓眼   |
| minion-chompy.png | 咬咬花（2048 透明）                                                      | 鵝黃 #F5E6A8、花瓣嘴微張、莖葉底座 |

## 25. 背景連續感與視覺升級

- 每關背景改「橫向無縫平鋪」新資產（§27），tileSprite 雙層視差：遠景 scrollFactor 0.25、近景 0.6；接縫若可見改鏡像平鋪。
- 共用漂浮雲層（透明平鋪帶）恆速漂移；每關主題 ambience 粒子（草原花瓣/高台雲絮/回廊星塵/王座金塵，密度低於 8 顆同屏）。
- 色彩分級：每關極輕 tint overlay（alpha 0.06）統一色調。
- 動作抖動修復定案（US-022 調查結論）：根因為 camera lerp 次像素捲動 × roundPixels 量化的逐幀往返跳動——修法為剛性跟隨 `lerp(1,1)` + `roundPixels: false`（非 pixel-art 美術）；walk bob 改 PRE/POST_UPDATE 視覺偏移掛鉤不污染物理；全實體動作平滑化（tween ease 統一 Sine 系）。

## 27. v3 美術資產（codex 專用；橫向平鋪）

| 檔名             | 內容         | 規格                                    |
| ---------------- | ------------ | --------------------------------------- |
| bg-meadow-l.png  | 果凍草原橫景 | 1536×512、水平無縫平鋪、底 1/4 乾淨地帶 |
| bg-heights-l.png | 雲朵高台橫景 | 同上、中段留平台空間                    |
| bg-arena-l.png   | 星空回廊橫景 | 同上、星塵粉紫調                        |
| bg-throne-l.png  | 魔王城橫景   | 同上、紫金王座廳                        |
| fx-clouds.png    | 共用漂浮雲層 | 1024×256、透明、水平無縫平鋪            |

## 31. v4 美術資產（codex 專用）

| 檔名              | 內容                                             | 規格          |
| ----------------- | ------------------------------------------------ | ------------- |
| minion-shelly.png | 殼殼：藍綠 #7FD8C8 硬殼龜果凍、圓殼紋、憨笑      | 2048 透明     |
| minion-zappy.png  | 雷雷：薰衣草黃 #E8D88A 電氣水母、火花觸鬚、瞇眼  | 2048 透明     |
| props-meadow.png  | 草原道具條：果凍蘑菇/花叢/小石/木牌 4 件橫排等距 | 2048×512 透明 |
| props-heights.png | 高台道具條：氣球/雲絮/風向旗/星星燈 4 件         | 2048×512 透明 |
| props-arena.png   | 回廊道具條：水晶簇/星柱/光苔/浮石 4 件           | 2048×512 透明 |
| props-throne.png  | 王座道具條：旗幟/燭台/王冠雕像/寶箱 4 件         | 2048×512 透明 |

道具條以固定 4 等分切割（512×512/件），佈景密度規範見 §32。表列 `.png` 為生成源檔名（§10 慣例）；實際入庫交付為切割後之 `prop-{meadow,heights,arena,throne}-1..4.webp` 與 `minion-*.webp`（q82、透明保留），資產鍵與檔名對齊 `core/assets.ts` 註冊表。

## 32. 場景裝飾密度規範

- 每關地面帶每 400-600px 佈置 1-2 件主題道具（levels.ts decor 資料驅動、隨機微縮放 0.9-1.1 與 y 抖動）；深度在玩家後、平台前。
- 道具純裝飾無碰撞（KISS）；可破壞磚除外（§29）。
- 同屏道具上限 6 件防雜訊；與 ambience 粒子總量合併預算（同屏繪製物 ≤14）。

## 55. v8 美術資產（codex imagegen 專用；配額 6/6 用滿）

| 檔名             | 內容                                        | 規格                |
| ---------------- | ------------------------------------------- | ------------------- |
| minion-spora.png | 孢子菇：鼠尾草綠 #A8D8A0 圓菇、奶油斑點     | 2048 透明 → 512webp |
| minion-gusty.png | 風飄鳥：淡天藍 #A8CBF0 圓鳥、後掠翼、風渦   | 2048 透明 → 512webp |
| minion-boomy.png | 迴力殼：暖陶土橘 #E8A878 犰狳、舉新月殼刃   | 2048 透明 → 512webp |
| boss-noctra.png  | 暗月蝠王：暮光紫 #7A6FD8 蝙蝠、銀月冠、星翼 | 2048 透明 → 512webp |
| bg-canyon-l.png  | 翔風峽谷橫景：暖杏糖霜峽谷、風痕絲帶        | 1536×512 無縫平鋪   |
| bg-eclipse-l.png | 蝕月王座橫景：薰衣草夜空、金月、紫塔剪影    | 1536×512 無縫平鋪   |

重用評估結論：L6 迴聲石廊重用 `bg-arena-l`（同族星空回廊）＋grade/ambience 變化；三關
道具條全數重用既有主題（heights/arena/throne），不另生成。素材 ticket 與生成腳本存
epic 資料夾（art-v8-ticket.md / run-art-v8.sh）。

## 61. v9 美術資產（codex imagegen 專用；配額 5/5）

| 檔名             | 內容                                         | 規格                |
| ---------------- | -------------------------------------------- | ------------------- |
| hero-volt.png    | 噗噗雷化：電黃電弧環身、閃電呆毛、自信笑     | 2048 透明 → 512webp |
| hero-gale.png    | 噗噗風化：風藍渦紋、氣流小翼、飄浮姿         | 2048 透明 → 512webp |
| hero-shell.png   | 噗噗殼化：青綠圓甲殼片、殼紋高光、壯站姿     | 2048 透明 → 512webp |
| minion-magno.png | 磁極獸：鋼藍灰圓胖獸、馬蹄磁鐵角（紅藍極點） | 2048 透明 → 512webp |
| minion-mirri.png | 鏡面蟲：珍珠銀紫圓甲蟲、拋光鏡面背甲高光帶   | 2048 透明 → 512webp |

背景不生成：L8/L9 重用既有橫景＋grade/ambience 變化（§60）。素材 ticket 與生成腳本
存 epic 資料夾（art-v9-ticket.md / run-art-v9.sh）。
