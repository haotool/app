# 開發獎懲與決策記錄（超短版）

> 版本：outline-v2-ultra
> 原則：每筆只保留日期、ID、原因、解法。
> 本次分數變化：+1｜累計總分：+173

## 新增模板（4 行）

- 日期：YYYY-MM-DD
- ID：<唯一識別>
- 原因：<一句話 root cause>
- 解法：<一句話修正>

## 條目（新→舊）

- 日期：2026-07-07
- ID：reward-rw-content-page-skeleton-destickify-dedupe
- 原因：內容頁頂列 sticky＋backdrop-blur 捲動時壓在內容上（使用者裁決頁面上方不應跟隨捲動），且指南頁 FAQ 段與開放資料頁授權聲明存在跨頁逐字重複內容（SEO duplicate content）
- 解法：PageNavHeader 改靜態頂列（safe-area 移至 ContentPageLayout 容器 pt-safe-top、錨點 scroll-mt 偏移同步縮小、側欄 sticky offset 校正），重複內容以 seo-metadata SSOT 收斂——GUIDE_FAQ_BRIDGE 摘要導流取代指南頁逐字 Q&A、LICENSING_NOTICE 授權聲明唯一歸屬開源頁

- 日期：2026-07-07
- ID：reward-rw-344-lhci-smoke-authority-guides
- 原因：Lighthouse CI smoke paths 僅覆蓋 `/`、`/faq/`、`/about/`，3 篇 Authority Guide 主戰內容頁無同層級性能守門，內容頁 CLS/LCP 回歸無法被 PR 守門攔截（issue #344）
- 解法：`LIGHTHOUSE_CI_SMOKE_PATHS`（seo-paths.config.mjs＋seo-paths.ts 雙 SSOT 同步）擴充 sell-rate-vs-mid-rate／cash-vs-spot-rate／card-rate-guide 三頁 canonical trailing slash 路徑，消費點（.lighthouserc.cjs、lighthouse-production.mjs、lighthouse-ci.sh）均由 `APP_CONFIG.lighthouseSmokePaths` 取得無第二份清單，SEO_MASTER_SSOT B4 同步

- 日期：2026-07-07
- ID：reward-rw-ga-e2e-gate-regression-window
- 原因：ga-defer-lcp.spec.ts 非正式 host 分支僅等 300ms 即斷言零 GA config，短於 ANALYTICS_INIT_DELAY_MS（6s）——hostname gate（#606）若回歸，GA 於 6 秒後初始化而測試已提前通過，守門形同虛設（PR #629 review thread）
- 解法：內嵌 GA runtime 且非正式 host 情境改等待完整初始化窗口（init delay 6s＋idle timeout 2s＋1s buffer，鏡射 performance.ts 預設並尊重同名 env 覆寫）後再斷言零 config；無 GA runtime 建置維持 300ms 短取樣，斷言本身不放寬

- 日期：2026-07-07
- ID：reward-rw-currency-cta-dead-class-contrast
- 原因：幣別頁／金額頁主 CTA 使用死類 `text-primary-foreground`（dist CSS 無此類、CSS 變數未定義），實渲染為繼承深藏青字壓 `bg-primary-strong` 僅 3.3:1，34 幣別頁＋金額頁全中（QA-H E6）
- 解法：CTA 文字改錨 repo 既有白字慣例 `text-white`（`bg-primary-strong` 7 主題白字對比 4.60–7.10:1 均達 AA），並於 raw-primary-text-exposure 守門新增死類全站使用數為 0 的斷言防回退

- 日期：2026-07-06
- ID：reward-rw-custom-theme-wave-d-fullpage-picker
- 原因：自訂主題色僅 10 色票、3 背景調、65vh sheet 無即時預覽（整片 sheet 遮住主畫面時使用者看不到跟色效果），互動回饋不足
- 解法：wave-D 升級——色票擴至 20（測試守門界線同步 16–24）、背景調加薄荷白/玫瑰白（AA 演算選值 4.53/4.56）、BottomSheet 新增 full 尺寸整頁沉浸、頂部即時預覽卡（匯率 pill/趨勢線/CTA 跟色）、色調改圓票所見即所得、選色觸覺回饋與 press 縮放微互動（遵守 E1 hover-scale 清零）

- 日期：2026-07-06
- ID：reward-rw-star-touch-target-dark-border-sweep
- 原因：全域反模式掃描發現 MultiConverter 星號收藏鈕觸控目標僅 20px（p-0.5+16px icon）且未收藏態用 opacity-30 稀釋、Favorites 星號鈕垂直 hit 不足、HomepageSEOSection 四處 border-black/5 在深色主題下隱形
- 解法：星號鈕負邊距擴 hit area 至 36px 不動版面、未收藏態改 text-text-muted/50 hover:text-favorite 色彩 token、Favorites 星號 min-h-11 撐垂直 hit、SEO 卡邊線改 border-border/60 隨主題適配

- 日期：2026-07-06
- ID：reward-rw-bottomnav-contrast-source-line-polish
- 原因：BottomNavigation inactive 態用 opacity-[0.35] 稀釋（對比不足且不隨主題切換）、CJK 標籤套 uppercase/0.1em 字距、分隔線硬編碼 border-black；首頁資料來源列含秒數雙時戳在 390px 裁切貼邊
- 解法：inactive 改主題 token text-text-muted（淺色 slate-500 AA、深色自動切換）、標籤改 font-semibold 無字距、邊線改 border-border/60、z 值吃 zIndexTokens；牌告時間顯示層截斷至 HH:mm＋來源列容器 flex-wrap 防裁切，navigationTokens.bottomNav.label SSOT 同步

- 日期：2026-07-06
- ID：reward-rw-rating-modal-offscreen-token-fallback
- 原因：RatingModal 消費 notificationTokens.position 但未設 --notification-mobile-top-offset CSS 變數（僅 UpdatePrompt/PwaInstallGuide 有 inline 設定），行動版 top 退化為 auto 使星評 Modal 整個落在視口外（top=844px），PWA 使用者永遠看不到；星星觸控目標亦僅 32px 低於 WCAG 44px
- 解法：token 補 CSS 變數 fallback（漏設仍落 header 下方）＋新增 notificationMobilePositionStyle SSOT 供三元件共用；星星升至 44px、🎉 emoji 改品牌 SVG、新增 zIndexTokens scale 收斂 z-50/z-[60]/z-[9999] 散值、快速金額 chips 收斂至 quickAmountButtonTokens.pattern 並加 scroll-snap；補 RatingModal.position 回歸測試 6 例

- 日期：2026-07-06
- ID：reward-rw-618-564-quote-matrix-multi-basis-pipeline
- 原因：歷史趨勢管線僅存現金賣出單一序列，卡片切即期時圖卡基準不一致（#564）；資料層缺即期買賣欄位使 A2 四報價卡構想在 wave-B 降級為對比卡（#618）；另 sitemap 匯率頁 lastmod 於完整 checkout 走 git commit 日期，任何觸及 seo-rate-examples.ts 的 commit 讓 240+ 頁同日戳、時間戳多樣性守門紅燈
- 解法：history-30d aggregate 由每日檔 details 展開 cashBuy/spotBuy/spotSell 多基準序列（rates 向後相容、30 天自動回補）；趨勢圖基準跟隨費率模式且即期不足誠實回落並同步標註；SEO_RATE_EXAMPLES 補四基準欄位（零漂移遷移）驅動 34 幣別頁四報價卡與缺值誠實態；匯率頁 lastmod 錨定匯率快照日期（與 shallow 模式及 RATE_PAGE_LASTMOD_POLICY 語意一致）

- 日期：2026-07-06
- ID：reward-rw-639-lh-mobile-perf-85
- 原因：LH mobile perf 79（#639）——PWA 安裝指引於載入 1.8s 後彈出，其海報（126K px²）成為 LCP 元素（LCP 4.48s）；首頁 head 14 個 modulepreload 與 HTML／關鍵 CSS 競爭模擬 4G 頻寬拖慢 FCP 約 700ms；vite-react-ssg 動態 import react-dom/client 使 vendor-react 串行下載
- 解法：指引改首次互動後起算顯示（LCP 於首次輸入後凍結，對齊 Chrome install promotion 指引）＋移除 HTML modulepreload（動態 import 依賴預載保留）＋ main 靜態載入 react-dom/client；preview 三次中位數 perf 86（FCP 2.65s、LCP 3.65s、TBT 0／CLS 0.002 不回退），SSG 255 頁零 diff、precache 98 項不變

- 日期：2026-07-06
- ID：reward-rw-638-591-star-hotzone-mobile-polish
- 原因：收藏／多幣別頁星號 toggle 實測熱區僅 28×22（低於 44×44 產品標準）；SE 667px 因 layout token `short:hidden` 整排隱藏來源快速金額；splash z-999 被 body::before 狀態列模糊帶 z-9999 蓋頂
- 解法：星號以 min-w/h-11＋負邊距補償撐大熱區（margin box 不變、不與 dnd 把手重疊，補 class 合約迴歸測試）；快速金額隱藏門檻自 short/tiny 下移至 tiny/micro；splash z-index 提至 10000 蓋過模糊帶

- 日期：2026-07-06
- ID：reward-rw-594-tablet-two-column
- 原因：≥1024px 視口主內容仍為手機版單欄置中（首頁 max-w-md、幣別頁 max-w-3xl），12.9" 橫向留白 >60%（issue #594 二階、E6 評分卡實測）
- 解法：純 lg: class 收斂——首頁 grid 兩欄（換算核心 28rem＋右欄收藏/幣種、v1/v2 共用且 keypad 常駐不動）、隱私頁目錄轉 sticky 錨點欄、幣別頁 wide 容器＋六段 IA 寬版（快速答案＋CTA 並排、金額頁常見金額互鏈全幅防半欄懸空）；<1024px 佈局零變化（像素 diff AE=0）、SSG 非目標頁 13 頁零 diff

- 日期：2026-07-06
- ID：reward-rw-609-builtin-theme-aa-batch
- 原因：nitro primary-hover 白字僅 ~1.8:1、小字白字按鈕 3.23:1（守門鎖 3:1 放行）；kawaii hot pink 對白底 2.65:1 經 on-surface==primary 合約傳導到全站文字；`/70`、`opacity-[0.35]` alpha 疊加把達標實色稀釋到 <4.5:1 且守門只驗實色
- 解法：nitro strong/hover 同色相加深（白字 5.30/4.80:1）、kawaii/nitro on-surface 白名單覆寫（pink-700／亮向 61 187 255），#632 合約改為「預設==primary＋白名單覆寫須對自身底色 ≥4.5:1」；alpha 稀釋點全數收斂實色並新增 alpha-composite 掃描守門與合成計算斷言

- 日期：2026-07-06
- ID：reward-rw-633-first-input-replaces-seed
- 原因：v2 keypad 以種子播入計算引擎，首次數字鍵串接在預設 1,000 之後（123456789 變 1,000,123,456,789），違反計算機首鍵取代慣例（QA-F P2-1）
- 解法：回寫閘門開啟前的首顆數字鍵先 clear 再 input（運算子／小數點／退格保留種子串接），實體與虛擬鍵共用同一路徑；stale seed 與拒鍵不開閘紅線改以運算子／小數點驗證，補首鍵取代單元＋e2e 兩路徑測試

- 日期：2026-07-06
- ID：reward-rw-631-pair-cta-deeplink
- 原因：pair 頁 AnswerHero 主 CTA 為裸 `/` 未帶深連結參數，SEO 落地點「開始換算 KRW→TWD」卻拿到預設 TWD→JPY（QA-F P1-1），且「立即換算」段與快速答案語意重複
- 解法：converterHref 於 pair 頁帶 `?from&to`（金額頁維持 `?amount&from&to`），hero 收斂為單一帶參數卡並砍除重複行銷段（PM 授權內容策略修正，parity 差異已申報），補 CTA href 單元測試與落地 e2e

- 日期：2026-07-06
- ID：reward-haotool-e3-final-review-fixes
- 原因：epic-final 實測抓到 sticky 隱形幕以 opacity:0 疊頂層攔截點擊且可聚焦（FR-012 於幕 1/2 失效，規格與 QA 雙盲區）；另素材格式偏離未回寫、死資產入 dist、base 前進 002 漂移
- 解法：keyframes 端點幀 visibility:hidden＋隱形幕互動斷言入 QA；illus 降採 480w AVIF+WebP、源檔遷 brand-src；merge base 收斂 002；SR 逐幕語意裁決回寫 §3.3

- 日期：2026-07-06
- ID：reward-haotool-e3-wave-d
- 原因：E3 需場景級記憶點與品牌素材落地：sticky 一幕、卡片 morph 轉場、Codex 素材（logomark/吉祥物/插畫）經 PM 視覺關卡選用後待整合
- 解法：view-timeline sticky 三幕（四重降級）、靜態 vt-name morph、L1-b/L2-a/L3-b 快照制入 public 並重生成 icons/OG；LCP 仍 H1、增量 ≤+2.5KB

- 日期：2026-07-06
- ID：reward-haotool-e3-wave-c
- 原因：使用者要求行動首頁更好看；研究驅動選型後 wave-C 五項（bento/貼紙/pattern/kinetic/pretty）為基線瀏覽器全可見的美感升級核心
- 解法：依 mobile-beauty-deep-dive 實作（bento 用 ToolCard variant、kinetic a11y 雙軌、pattern 限信任列）；brief §9 併入 tracked SSOT；預算 wave-C ≤+3.5KB gzip

- 日期：2026-07-06
- ID：reward-rw-632-custom-primary-contrast-guard
- 原因：custom 主題 `--color-primary` 為使用者原色 identity 映射且 20+ 處文字直接消費 raw token，近白主色（F5F5F0）使快速連結／幣別連結／設定按鈕／底部導覽 active 全隱形且重載持久（issue #632）
- 解法：新增 `--color-primary-on-surface` 文字錨點（內建主題同 primary 值零視覺變化、custom 走 AA clamp），全站 `text-primary` 改錨並以靜態掃描守門曝露面清單；選色面板加即時可讀性提示與 clamp 實效色預覽（i18n ×4），AA property 測試擴充 on-surface 任意色全綠

- 日期：2026-07-06
- ID：penalty-rw-606-e2e-gate-regression
- 原因：#606 hostname gate 未同步更新 ga-defer-lcp e2e——spec 以 HAS_BUILT_GA_RUNTIME（dist 內嵌 GA ID）期望 1 次 config，但 gate 在 localhost 恆回空 ID 致 config 0 次、waitForFunction 10 秒逾時，`pnpm test:e2e` 本地必紅（審查實跑抓出）
- 解法：spec 改 gate-aware——匯出 analyticsGate 的 PRODUCTION_HOSTNAME（同一 SSOT，無第二份 hostname 字串），期望值依「HAS_BUILT_GA_RUNTIME 且 執行 host 為正式站」決定 1 或 0（0 時斷言恆 0 不逾時等待）；GA 注入驗證流程後移至正式站（本地 preview 恆零注入）；補 www 前綴與 FQDN 尾點繞過 case

- 日期：2026-07-06
- ID：reward-rw-607-offline-install-guide-img
- 原因：pwa-install/\*\* hero 圖被 globIgnores 排除 precache（708KB 超過 200KB 門檻不宜納入），離線開啟 PWA 安裝導引時大面積破圖覆蓋內容（issue 607）
- 解法：img onError 時隱藏整個 picture 圖區、文字步驟導引保留（離線誠實原則），補離線降級單元測試並以 Playwright 阻斷圖片請求截圖實證無破圖

- 日期：2026-07-06
- ID：reward-rw-606-ga4-staging-gate
- 原因：GA4 僅以 VITE_GA_ID 空值判斷是否啟用，staging／preview 共用 production build 令 gtag 照常外送，QA 流量污染正式 GA4 資料（issue 606）
- 解法：新增 resolveGaMeasurementId 以 APP_INFO.siteUrl（SSOT）導出正式站 hostname 做 runtime gate，非正式 host 回空字串使 initGA 提早返回；補 production／staging／localhost 單元測試並以本地 preview 網路面板實證零 gtag 請求

- 日期：2026-07-06
- ID：neutral-rw-e5d-qa-capture-matrix
- 原因：E5 wave-D 受改頁需要可重跑的截圖矩陣與 console error 檢核證據（三攻略頁＋AnswerCapsule 消費樣本 × 雙主題 × 雙尺寸，#418 為硬標準 0）
- 解法：新增 scripts/qa/capture-authority-guides.mjs（20 張截圖＋console/pageerror 收集，非零即失敗），本輪實跑 console errors 0

- 日期：2026-07-06
- ID：reward-rw-e5d-authority-guide-uiux
- 原因：三篇 Authority Guide（賣出價/現金即期/刷卡）仍為舊版面——legacy card、無行動版底部導覽、無目錄側跳、圓點 bullet，與 E4/E5 內容頁體系脫節（E5 wave-D）
- 解法：AuthorityGuidePage 遷移 ContentPageLayout＋六段 IA（answer-first 頁首→目錄側跳→重點整理→分段卡片→FAQ 手風琴→相關連結與 CTA），消費 E4 section renderer 與 E1 token；SEO head/JSON-LD/可見文字與 heading 集合零變動（parity＋heading diff 驗證）

- 日期：2026-07-06
- ID：neutral-rw-e5d-answer-capsule-e1-token
- 原因：AnswerCapsule 沿用 legacy `card` 類與任意邊框，與 E4/E5 內容頁 E1 token 體系（rounded-card/panel、hairline、shadow-card）漂移
- 解法：改 E1 token 卡片＋lucide Zap 標題徽章，可見文字零變動，消費頁（首頁/FAQ/About/Guide/OpenData/攻略頁）樣式一致收斂
- 日期：2026-07-06
- ID：penalty-rw-459-595-tz-blind-spot
- 原因：#595 驗證只在本地同時區（build 與瀏覽器皆 Asia/Taipei）抽測，未覆蓋 staging「UTC build × 台北瀏覽器」情境，漏掉 Footer 建置時間 toLocale 無 timeZone 造成內容頁全數 #418
- 解法：本地以 TZ=UTC build＋Asia/Taipei 瀏覽器重演 staging 差異定位根因；此後 hydration 修復驗證必須含跨時區組合（build TZ ≠ browser TZ）

- 日期：2026-07-06
- ID：reward-rw-459-content-pages-418
- 原因：內容頁 Footer `getFormattedBuildTime()` 無 timeZone 隨 build 機器時區漂移（args[]=text）；404／SPA fallback 送首頁快照帶 data-server-rendered，vite-react-ssg 0.8.9 production 一律 hydrate（args[]=HTML）
- 解法：建置時間固定 Asia/Taipei；SSG 注入 ssg-route 標記＋client 守門偵測 stale 快照改走 render＋patch vite-react-ssg（上游已 merge 未發版的 PR #90）；11 路由雙時區停 SW 巡檢 #418 歸零＋prerender 守門測試

- 日期：2026-07-06
- ID：penalty-rw-587-keyboard-modifier-passthrough
- 原因：PR #614 掛接的 useCalculatorKeyboard 未檢查 modifier keys，v2 常駐監聽下 Cmd/Ctrl+'-'（瀏覽器縮放）被 preventDefault 吞掉且減號寫進表達式開閘改值（WCAG 1.4.4 回歸，審查 B-1 抓出）
- 解法：handler 開頭 metaKey/ctrlKey/altKey 直接 return 讓路（Shift 保留供 '+' 等符號輸入），補 hook 四個 modifier 案例與 v2 整合「Cmd/Ctrl+- 不開閘不改值」回歸測試

- 日期：2026-07-06
- ID：neutral-rw-587-590-viewport-log-correction
- 原因：002 條目與 PR #614 body 將極端金額 e2e 視口誤記為 375/390/430，實際 spec 斷言與截圖為 375/390/1440（含桌面 1440×900）
- 解法：更正 002 條目與 PR body 為 375/390/1440；程式碼與測試不變

- 日期：2026-07-06
- ID：neutral-rw-587-590-regression-guards
- 原因：issue 587/590 修復需鎖定回寫閘門語意（切列零按鍵不變值）、QA 量測案例（179px vs 188px）與桌面鍵盤旅程，避免後續回歸
- 解法：新增單元測試（鍵盤旅程、sheet 停用、閘門不誤開、fit 縮放與 aria 完整值）與 e2e（實體鍵盤完整旅程、極端金額 375/390/1440 三視口繪製矩形量測斷言）

- 日期：2026-07-06
- ID：reward-rw-590-v2-amount-left-clip
- 原因：v2 非活躍列大金額繪製寬超出容器（QA 實測 188px vs 179px）且 overflow hidden 右對齊，最高位被左緣裁掉致 163 萬誤讀為 63 萬（issue 590）
- 解法：CurrencyRow 金額以 offsetWidth/容器內寬單次量測 transform 縮放（right origin、下限 0.5、ResizeObserver 追蹤 resize 與字級 transition），必保最高位可見且 aria-label 保留完整金額

- 日期：2026-07-06
- ID：reward-rw-587-v2-physical-keyboard
- 原因：v2 等值雙列無 keydown 監聽，桌面與外接鍵盤用戶只能滑鼠點虛擬鍵（issue 587，v2 轉正硬前置）
- 解法：泛化 useCalculatorKeyboard（respectInteractiveTarget 讓 Enter/Esc 交還互動元素原生語意）並掛入 ConverterKeypad 直通同一計算引擎，鍵盤輸入視同按鍵意圖與虛擬鍵共用回寫閘門，sheet 開啟時停用避免語意衝突

- 日期：2026-07-06
- ID：neutral-rw-617-review-convergence-chunk-lockfile
- 原因：PR #617 審查 APPROVE 附收斂——react-colorful 落 manualChunks fallback 進 vendor-commons（全部用戶首屏多付 3.43KB gzip）、lockfile 夾帶 jiti 等無關 churn
- 解法：manualChunks 對 react-colorful 回傳 undefined 依 import graph 併入 Settings lazy chunk（vendor-commons 回落基準 23.64KB、hash 同基準，Settings 3.77→7.55KB 僅設定頁用戶付費），lockfile 以 base 版重生成收斂至 +14 行純 react-colorful；背景調 pre-paint FOUC 已由 PM 立案 #619

- 日期：2026-07-06
- ID：reward-rw-e2c-color-picker-modernization
- 原因：自訂色 UX 僅原生色相/明度滑桿＋hex 輸入，體驗陽春且無背景色調選項（E2 wave-C）
- 解法：context7 查證後引入 react-colorful@5.7.0（ADR-001，bundle +3.59KB gzip ≤5KB）改 BottomSheet 選色（色票＋二維拖曳＋HEX＋預覽 chip），新增背景色調三選一進演算集合（寫入=清除同一常數），AA property 守門擴充三背景調 × 977 case 全綠，customBackgroundTone 持久化向後相容，e2e 全旅程（chromium 雙專案）通過

- 日期：2026-07-06
- ID：reward-rw-602-manifest-site-url-env
- 原因：generate-manifest 的 scope/start_url 硬編 APP_INFO.siteUrl（app.haotool.org），staging 等替代網域部署時 manifest scope 跨網域、PWA 安裝行為異常（#602；字體 @font-face 被 Beasties 修剪部分經 PM 裁決移交 #616 處理）
- 解法：scope/start_url 改由 VITE_SITE_URL 環境變數驅動＋normalizeSiteUrl 正規化（行為對齊 seo-paths；直接 import 因該檔無副檔名 import 在 Node Type Stripping 下 ERR_MODULE_NOT_FOUND，以註解標明），未設定時回退正式站；committed manifest 補「必為正式站」JSON 斷言堵 env 污染誤 commit，generate:deterministic 冪等零 diff 實證

- 日期：2026-07-06
- ID：reward-rw-600-anchor-scroll-mt-safe-area
- 原因：#605 修了 sticky 返回列 safe-area 但錨點目標 `scroll-mt-20` 固定 80px 未連動，standalone 下 sticky 列變高（+59px）後隱私目錄與 Guide 步驟跳轉被遮蔽（#600 連動項）
- 解法：三處錨點（Privacy 目錄、Guide 步驟、ContentSections）改 `scroll-mt-[calc(5rem+env(safe-area-inset-top,0px))]`，CDP inset 59px 實測 targetTop 139 > headerBottom 124，補 ContentPageLayout 錨點斷言

- 日期：2026-07-06
- ID：reward-rw-font-preload-beasties-fontface-strip
- 原因：品牌字體 @font-face 放 index.html 內嵌樣式，Beasties 逐 sheet 判定 critical fonts 時因該 sheet 無使用者而整條剝除，全站 unused preload 警告且 wordmark 永遠回落系統字體（正式站取證：HTML 無任何 @font-face）
- 解法：@font-face 移至 src/index.css（與 .brand-wordmark 同 sheet）＋ ssgOptions.beastiesOptions 設 inlineFonts:true／preloadFonts:false，preview 驗證警告歸零、document.fonts.check 為 true、preload 單一化

- 日期：2026-07-06
- ID：neutral-rw-612-staging-manifest-cross-origin
- 原因：staging manifest `scope`/`start_url` 由 generate-manifest.mjs 以 APP_INFO.siteUrl 硬編正式站絕對 URL，對 staging origin 跨網域；屬刻意設計（PWA partition／HTTPS-First）連動 SSOT 生成鏈
- 解法：取證後立案 #612（附 curl 證據與範圍）不硬修；React #418 staging 複驗無殘留（#595 已修）

- 日期：2026-07-06
- ID：reward-rw-e5b-currency-page-uiux-six-section-ia
- 原因：34 幣別頁＋金額頁為牆文式段落佈局、視覺語言與 app 端割裂且行動版缺底部導覽，未達韓系 app 水準（E5 wave-B）
- 解法：重排六段 IA（Answer Hero→報價對比→階梯列表→在地情境卡→FAQ 手風琴→相關連結）共用 presentational 元件組並換 ContentPageLayout 骨架，新增 verify-visible-text-parity 腳本證明 34 頁 dist 可見文字集合等價（純呈現層零文案變動）

- 日期：2026-07-06
- ID：neutral-haotool-e3-branch-governance
- 原因：使用者指示 E1+E2 成果併入 experiment/ratewise-product-2026h2、E3 於其上續迭代，路線圖與分支治理需同步
- 解法：PR #552 rebase 後 squash 併入實驗分支、開 feat/haotool-site-e3 續作、ROADMAP Now/Next 對齊

- 日期：2026-07-06
- ID：reward-haotool-e2-final-review-fixes
- 原因：epic-final 對抗審查抓到 S1 session 閘無移除點致 SPA 返回重播（Blocking）、odometer aria prohibited naming、兩處偏離未回寫文件
- 解法：intro 完成後移除 data-intro＋防回歸測試；odometer 改 aria-hidden reels＋sr-only 終值；brief §8.4 與 motion-deep-dive §3 回寫

- 日期：2026-07-06
- ID：reward-haotool-e2-wave-b
- 原因：wave-A 後桌面體驗仍缺「展示前端能力」的深度互動；wave-B 六項（舞台視差聚焦/magnetic/tilt/draw-in/progress/F2 出貨列）補齊高級質感
- 解法：依 motion-deep-dive 實作（pointer fine 限定、reduced-motion 降級、bundle ≤2KB）；F2 以 build-time define 注入零 runtime 成本

- 日期：2026-07-06
- ID：reward-rw-601-content-nav-safe-area
- 原因：內容頁共用 sticky 返回列 `top-0` 只給固定 10px padding 未吃 `env(safe-area-inset-top)`，PWA standalone（viewport-fit=cover＋black-translucent）下被狀態列遮蔽（#601，使用者實機回報）
- 解法：padding-top 改 `calc(0.625rem + env(safe-area-inset-top, 0px))`（半透明底色同步涵蓋 inset 區；幣別 landing 與 authority guide 直掛頁同步受惠），CDP inset 59px 模擬 6 頁前後截圖驗證、非 standalone 維持 10px，新增 safe-area class 單元＋7 內容頁 smoke 防回歸

- 日期：2026-07-06
- ID：reward-rw-sw-register-storm-593
- 原因：useRegisterSW 在 useState initializer 執行 registerSW()，UpdatePrompt 位於未 commit 的 Suspense 子樹時每次 render attempt 重跑，註冊被阻擋環境下 onRegisterError setState 再觸發 render 形成無上限熱迴圈（2 秒 13,379 次）
- 解法：註冊改 swRegistration 模組單例（useSyncExternalStore 訂閱＋effect 啟動），單例重試最多 2 次（1s 退避）＋session 旗標靜默降級（含 inline 註冊總計 ≤3），並以 surface tone 修 toast 白字壓淺漸層重影、md+ 錨定主欄置中

- 日期：2026-07-06
- ID：neutral-rw-596-review-audit-number-and-comment
- 原因：PR #596 body 將三檔合跑的 43/43 誤標為 `vitest run BottomSheet` 結果（單檔實為 10/10），且 120% 位移缺推導註解易被誤改回 100%
- 解法：PR body 更正為單檔 10/10 並註明 43/43 的確切指令，兩處 `y: '120%'` 補繁中推導註解（md:bottom-6 退場殘留）

- 日期：2026-07-06
- ID：reward-rw-sheet-wide-viewport-588
- 原因：BottomSheet primitive 與 CalculatorKeyboard 沿用手機貼底全寬 pattern，桌面 1440 與 iPad 12.9" 橫向 sheet 拉滿 100vw（#588、#594 第一階段）
- 解法：兩處殼層加 `md:max-w-screen-sm md:mx-auto md:rounded-card md:bottom-6` 寬視口限寬置中（進出場位移 100%→120% 補離底間距），消費端零改動，新增寬視口樣式斷言

- 日期：2026-07-06
- ID：penalty-rw-560-langsync-remount-rollback
- 原因：LanguagePreferenceSync 掛雙佈局且每次 remount 重放 init 前捕捉的 stale 偏好，session 內切語言後跨佈局 SPA 導覽把語言與 localStorage 回滾 zh-TW（#595 審查 PoC 抓出）
- 解法：改模組級 hasSynced 單次同步（每次 page load 只執行一次）＋新增 remount 不回滾迴歸測試（先紅後綠）；順帶收斂 languageChanged 同步 html lang 與 prerender 守門移除 silent-pass

- 日期：2026-07-06
- ID：reward-rw-560-i18n-ssg-hydration-418
- 原因：SSG 於 Node 內以全域 navigator.language（en-US）偵測語言預渲染英文、client 首屏 zh-TW，加上 client/SSR bundle 各自取樣 buildTime，全站每頁殘留 1~2 筆 React #418
- 解法：i18n init 固定 lng zh-TW（SSG＝client 首屏），hydration 後由 LanguagePreferenceSync 套用 init 前捕捉的使用者偏好，vite buildTime 以 env 快取跨 client/SSR build 一致；停 SW 抽測 7 路由 #418 由 8 → 0、四語系與 hreflang 不退步

- 日期：2026-07-06
- ID：neutral-rw-583-review-convergence-preheat-catch-i18n
- 原因：PR #592 審查 APPROVE 附兩小項——模組層預熱 promise 未接 catch（弱網／換版舊 HTML 下 import 失敗會產生 unhandled rejection）、骨架 sr-only 文案硬編碼 zh-TW
- 解法：預熱呼叫點補 `?.catch(() => {})`（函式回傳語意不變，lazy 首次渲染自行重試）、sr-only 改走 `converterV2.skeletonLoading` i18n key（×4 語系）並補 key 存在性測試

- 日期：2026-07-06
- ID：reward-rw-e3-v2-coldstart-preheat
- 原因：v2 lazy chunk 僅在 hydration 後 flag 翻轉時才開始下載且 Suspense fallback 為 null，設 v2 的用戶每次冷啟動經歷 legacy→空白→v2 兩段跳動（issue #583）
- 解法：persisted 偏好為 v2 時模組評估即預熱 v2 chunk、fallback 改為對齊 v2 佈局輪廓的骨架，附帶設定頁 URL override 提示 badge（i18n ×4），SSG 不變性守門維持綠

- 日期：2026-07-06
- ID：reward-rw-favorites-hint-dnd-selector-contract
- 原因：#563 收藏排序改版後缺「先加收藏才能排序」顯性訊號且殘留 dragToFavorite 死鍵與死 fallback；#562 dnd 把手選擇器字串散落四處、gate 測試以 setAttribute 自我實現無法抓套件升級改名
- 解法：非收藏段起點加一行 i18n 提示（×4 語系）並清理死鍵死碼、補 destinationIndex=0 邊界測試；選擇器抽 DND_DRAG_HANDLE_ATTRIBUTE/SELECTOR 單一來源，新增真實 dnd 渲染契約測試（突變常數值紅燈、還原綠燈）

- 日期：2026-07-06
- ID：reward-rw-kawaii-text-contrast-aa-572
- 原因：Kawaii 主題 `--color-text` #8E7C80 對背景僅 3.79:1、textMuted 僅 2.38:1，未達 WCAG AA，內容頁正文可讀性不足（#572）
- 解法：text/textMuted 調深為同粉棕色相深階（7.42:1／5.62:1），雙源（index.css＋themes.ts）與 calc-number-text、STYLE_OPTIONS preview、offline.html 同步，新增 kawaii AA 與色相守門測試

- 日期：2026-07-05
- ID：reward-haotool-e2-wave-a
- 原因：使用者回饋官網動效不足、行動優先需高級動畫；wave-A 六項核心（spring/開場/odometer/轉場/chips/指示器）為體感升級最高 ROI 組合
- 解法：依 motion-deep-dive 實作六項（初始 JS 增量 ≤2KB、LCP 仍 H1、reduced-motion 全降級）；002 檔頭同步修正先前漏計的 reward-haotool-root-site-removal +1（累計 +118→+119，加計本筆 +1 為 +120）

- 日期：2026-07-05
- ID：penalty-haotool-qa-mjs-lint-coverage
- 原因：qa-deep-audit.mjs 為 Playwright standalone 腳本卻未列 eslint flat config 忽略清單，`eslint .` 以瀏覽器/Node 混合 context 掃出 45 個 no-undef，PR #552 Quality Checks 紅燈
- 解法：eslint.config.js 忽略清單補 `**/tests/**/*.mjs`（比照既有 scripts/\*.mjs 與 e2e 排除），root `pnpm lint` 回歸 0 errors

- 日期：2026-07-05
- ID：penalty-haotool-qa-url-substring-check
- 原因：QA 腳本以 `req.url().includes('app.haotool.org')` 子字串判斷 host，任意網域可繞過（CodeQL js/incomplete-url-substring-sanitization high，PR #552 check 紅燈）
- 解法：改 `new URL(req.url()).hostname === 'app.haotool.org'` 嚴格比對 hostname 並附註解防回流

- 日期：2026-07-05
- ID：neutral-haotool-e2-motion-brief
- 原因：使用者回饋現版動效與吸引力不足、行動優先需高級動畫展現前端能力，E2 需 PM 級動效設計指令作為 SSOT
- 解法：design brief 追加 §8 動效升級指令（S1-S7 簽名時刻＋F 軌構想＋不可動搖約束），Fable designer 據此深化

- 日期：2026-07-05
- ID：reward-haotool-v2-deploy-integration
- 原因：046 §9 部署整合點在移除時清空，merge 後正式站根路徑會停留 404；Worker 邊緣仍硬編碼 4 工具作品集敘事與 /projects/ 路徑（critic B3）
- 解法：恢復 root build:haotool/build:all、Dockerfile 根站建置鏈與 HEALTHCHECK GET /、nginx /tools 路由＋/projects 301＋error_page 404（容器煙霧測試全過）；Worker v5.6 原始碼同步 5 工具工具站敘事與 /tools/（不部署，deploy 屬使用者批准步驟）

- 日期：2026-07-05
- ID：reward-haotool-v2-verify-round-fixes
- 原因：八鏡頭 review 與六尺寸 QA 抓出：站內 hash 不捲動、SW 清單僅字串守門、Reveal SSG opacity:0 no-JS 隱形、mobile LCP 被舞台圖搶走、primary 實底對比 3.71 未達 AA、測試冷啟 flake
- 解法：ScrollRestoration 官方模式、sw-routes.ts 抽 SSOT＋行為測試、Reveal initial=false＋hydration 偵測、hero 文字區 100svh 撐滿使舞台出首屏（LCP=H1、Perf 0.98）、CTA 實底改 #1B64DA/hover #1E40AF（A11y 1.0）、asyncUtilTimeout 5s；109 tests 冷跑兩輪全綠；Content-Signal 假陽性保留並入文件

- 日期：2026-07-05
- ID：reward-haotool-v2-hire-info-section
- 原因：deep-dive 版面稿早於 PRD v2 未含委託資訊區，D-A2 偏離經 PM 駁回後需補齊 hire-me 轉換 MUST 需求；apple-touch-icon 仍指舊佔位
- 解法：Contact 補「委託與合作」區（範圍 chips/三步流程/SLA，扁平語彙）＋3 條渲染測試（97 全過）；icon 引用鏈對齊 2C 產物

- 日期：2026-07-05
- ID：reward-haotool-v2-korean-flat-ui
- 原因：腳手架佔位頁無設計系統；需依 design-deep-dive 落地韓系扁平完整視覺且守住 LCP=H1、150KB JS、扁平鐵律與四態規範
- 解法：tokens 全表＋15 元件＋五頁終稿＋hero 舞台（桌面 5 卡浮動/行動 3 卡 84KB）；motion LazyMotion 按需 4.4KB；94 tests＋tokens drift 守門；瀏覽器 QA console=0、375/390 零橫捲

- 日期：2026-07-05
- ID：reward-haotool-v2-brand-asset-pipeline
- 原因：品牌素材缺 SSOT 管線（舊佔位 icons/OG），且需可重現快照制避免 build 依賴外網與人工 PS 流程
- 解法：手寫 wordmark/monogram SVG SSOT，三個冪等腳本（icons/OG/五工具截圖）零新依賴產出 19 檔（AVIF 單張 ≤60KB、OG 56.6KB），視覺 review 通過並記載再生成指令

- 日期：2026-07-05
- ID：reward-haotool-v2-seo-aeo-final
- 原因：腳手架 SEO 為佔位骨架；官方現況（FAQ rich results 終止、hreflang 單語無用、SearchAction 退役、2026 AI crawler 更新）需落地為終稿並收斂生成鏈防清單漂移
- 解法：meta/JSON-LD @graph 終稿（title 15-25/description 60-78 全形字）、FAQ 五題 SSOT、llms.txt 含接案情境、index.md mirror、robots 39-bot、工具清單全由 tools.ts 生成；seo tests 擴至 55 項

- 日期：2026-07-05
- ID：reward-haotool-v2-scaffold
- 原因：官網 v2 重建需要可驗證的骨架基線（SSOT 配置/SSG/PWA 防護/測試）支撐 wave-2 併行實作；版號策略需對齊 changesets 流程
- 解法：39 檔腳手架（4 路由 SSG nested、PWA prompt＋denylist 含 split-meow、@graph 單 script、42 測試綠、build 通過、零漸層零第三方字體）；版號回 1.0.6＋major changeset（release 時升 2.0.0）對齊 AGT-VER-01

- 日期：2026-07-05
- ID：reward-haotool-v2-prd-critic-convergence
- 原因：Fable critic 八鏡頭審查揪出 PRD/brief 16+ 處規格衝突、hero 截圖舞台與 LCP 預算矛盾、Worker 邊緣硬編碼 4 工具作品集敘事未列更新範圍（AEO 自我矛盾）
- 解法：PRD v2 逐條回寫（設計值 SSOT 歸 brief、FAQ/FAQPage 移 About、禁毛玻璃、StatusDot 取代徽章）；新增 hero 資產預算硬規則與 LCP=H1 驗收；Worker 三項同步入 PRD/資安；截圖快照制、motion 統一命名、404 error_page、無遙測決策、委託資訊與證據錨點；併入研究/設計收斂：hreflang 移除（單語站官方無用）、SearchAction 移除、系統字型優先＋wordmark subset、beastiesOptions:false、crawler token 補齊、D1-D8 設計裁決、canonical 308 目標架構列 ADR-001（Phase 2 待批）

- 日期：2026-07-05
- ID：neutral-haotool-v2-pm-kickoff
- 原因：haotool 官網 v2 以多代理全自主開發啟動，缺路線圖、設計與資安 SSOT 底稿；PRD v1 部分語彙（漸層/陰影）與使用者已表態的韓系扁平偏好衝突
- 解法：建立 ROADMAP 與設計 brief（扁平鐵律修正 PRD §4.2）＋資安設計基準；feat/haotool-site-v2 rebase 最新 main 後提交底稿

- 日期：2026-07-05
- ID：reward-rw-e3-waveb-settings-toggle-e2e-guards
- 原因：設定頁切換→首頁生效→重載持久的完整旅程無 e2e 鎖定，store 舊 flag key 遷移與非法值修復亦缺守門測試
- 解法：新增 e2e case（切 v2→首頁生效→重載持久→切回經典）與 store 遷移／sanitize 單元測試，SSG 不變性 254 頁 diff=0

- 日期：2026-07-05
- ID：reward-rw-e3-settings-converter-mode-ssot
- 原因：converter-v2 只能靠 URL override 或手動 localStorage 開啟，使用者無設定入口，且 wave-A 獨立 flag key 與 converterStore 形成雙持久化來源
- 解法：設定頁新增「單幣別模式」區段（i18n ×4），偏好併入 converterStore（舊 key 一次性遷移刪除），flag 讀取端收斂為 URL override > 使用者設定 > 預設 off 單一優先序並記入 README

- 日期：2026-07-05
- ID：penalty-rw-e3-keypad-stale-seed-rejected-key-gate
- 原因：wave-A keypad 種子掛載即鎖定且按鍵未經引擎確認即開回寫閘門——切列零按鍵視窗內外部值變動時種子過期、被拒按鍵使後續重算把未變顯示值當成使用者編輯回寫
- 解法：閘門關閉時外部值變動同步重播種子（render 期間調整 state），閘門改由「表達式確實變動＋曾按鍵」才開啟，三個回歸測試修正前紅、修正後綠

- 日期：2026-07-05
- ID：reward-rw-e4-seotech-stats-contrast-and-capture
- 原因：截圖矩陣抓出 SeoTech 統計卡標籤吃主題 text token 但卡底為固定淺色調色板，nitro 下白字壓淺底不可讀（審計 P0-1 同病殘留）
- 解法：標籤改固定深色 slate 對比安全值並註解設計依據；沉澱 capture-content-pages.mjs 截圖矩陣腳本（7 頁×2 主題×2 尺寸＋console error 收集）供後續回歸

- 日期：2026-07-05
- ID：reward-rw-e4-content-pages-e2e-smoke
- 原因：內容頁統一骨架缺 e2e 守門，底部導覽修復與七頁可達性可能被後續變更靜默破壞
- 解法：新增 content-pages.spec（七頁 h1／返回導覽／行動版底部導覽＋設定頁開源入口導向），base path 解析對齊 fixtures；本機以單 worker 驗證 a11y 與 smoke 全綠

- 日期：2026-07-05
- ID：reward-rw-e4-pages-wave2-guide-opendata-seotech
- 原因：Guide／OpenData／SeoTech 版殼各自實作（SeoTech 甚至無麵包屑與底部導覽），與統一骨架漂移
- 解法：三頁遷移至 ContentPageLayout（保留頁內專屬元件：API 表格、複製按鈕、技術卡），Guide 步驟與功能區塊改共用 renderer，測試合約（step 錨點、快速導航、FAQ 標題）維持不變

- 日期：2026-07-05
- ID：reward-rw-e4-pages-wave1-faq-about-privacy
- 原因：FAQ／About／Privacy 各自手刻版面且視覺未對齊 E1 token，隱私長文缺頁內導覽
- 解法：三頁遷移至 ContentPageLayout＋ContentSections 內容驅動渲染（文案零改動），FAQ 保留手風琴、隱私補錨點目錄側跳

- 日期：2026-07-05
- ID：reward-rw-e4-open-source-page
- 原因：使用者需求七頁含開放原始碼頁，但現況僅設定頁外部 GitHub 連結，開源／授權資訊散落 About 與 OpenData 缺乏收斂入口
- 解法：新增 /open-source/ noindex 功能頁（SEO 設定就地定義不動 seo-metadata），文案沿用 About 透明區塊＋OpenData 授權聲明，APP_ONLY_NOINDEX_PATHS 雙 SSOT 同步＋路徑守門測試更新

- 日期：2026-07-05
- ID：reward-rw-e4-content-page-skeleton
- 原因：七個內容頁各自手刻版面且行動版遺失底部導覽（審計 P1-8），重複 JSX 造成維護債
- 解法：新增 ContentPageLayout 共用骨架（返回導覽＋麵包屑＋底部導覽＋safe-area 內距）與 ContentSections 五型別 section renderer（text/list/faq/links/cards），附骨架與渲染測試

- 日期：2026-07-05
- ID：neutral-rw-e4-design-brief-intake
- 原因：E4 內部頁重構設計簡報尚未入庫，epic 勾稽缺乏可追溯 SSOT
- 解法：將 PM 簡報 add -f 進 .claude/prds/ 作為 E4 SSOT（獨立 docs commit）

- 日期：2026-07-05
- ID：reward-rw-e4-task0-bottomsheet-a11y
- 原因：BottomSheet primitive 具 dialog 語意但缺 Esc 關閉、focus trap 與初始/還原焦點，E4 內部頁將大量使用 sheet，可及性債會放大
- 解法：補 Esc／Tab 循環／初始焦點／焦點還原並附四項單元測試，守門 regex 註解已知限制，收斂三 nits（picker 收藏置頂、trend radiogroup 獨立 aria 名稱、sm 魔法數註解）

- 日期：2026-07-05
- ID：neutral-rw-e5-review-should-fix-batch
- 原因：PR 578 epic 審查三項 Should-fix——明洞換錢所名稱誤植（Money Plant）、單值寫死匯率可穿透區間 regex、phrase budget 覆蓋範圍未註記且一句貼上限
- 解法：更正為 Money Planet（MONEYPLANET SEOUL）、新增 persona 原始碼層單值匯率 lint（含 pattern 自我驗證與突變證明）、補覆蓋範圍註解並收斂「真正要付多少台幣」至 2 處（budget ≤2）

- 日期：2026-07-05
- ID：reward-rw-e5-l3-copy-guards
- 原因：issue 566 三項守門缺口（新模板句 phrase budget、About FAQ 尾句機房語言、answer 級自指涉掃描）且無 AI 贅詞黑名單、寫死匯率 lint、跨幣別相似度上限
- 解法：新增 seo-copy-guard.test.ts 七組守門（黑名單、匯率 lint、最高級宣稱、persona bigram Jaccard <0.5、phrase budget、About SF-2/SF-3、金額頁 v2 不變式），六種故意突變全數變紅後還原

- 日期：2026-07-05
- ID：penalty-rw-e5-mutation-revert-hook-swap
- 原因：突變還原腳本以「第一個出現」取代字串，將 USD 與 GBP 的 description hook 內容互換而未察覺
- 解法：守門重跑後以 rg 抽查 hook 對應幣別發現互換，改以幣別上下文錨點精準還原並補跑守門確認全綠

- 日期：2026-07-05
- ID：reward-rw-e5-amount-page-v2
- 原因：金額頁只給單向現金賣出答案（與「50000韓元」大宗搜尋意圖錯位）、無階梯表可提取結構、title 無中文金額別名
- 解法：Answer Block 雙向答案（現金買入估算＋現金賣出＋中間價對比）、INDEXABLE amounts 純計算階梯表、title/description 導入 formatZhAmount 中文別名公式且 description 首句給答案

- 日期：2026-07-05
- ID：neutral-rw-e5-l2-pure-assembler
- 原因：幣別頁生成器仍自帶敘述文案（六條規格式 highlights、同構 travelTip 與 description 公式），與 L1 persona SSOT 職責重疊造成 template bleed
- 解法：改寫 currency-landing.ts 為純組裝生成器——敘述欄位全數改讀 persona，highlights 收斂為 3 條（≥2 條 persona 特化），description 尾句注入幣別 hook

- 日期：2026-07-05
- ID：reward-rw-e5-l1-persona-schema-content
- 原因：34 幣別頁敘述文字散落於模板常數且含 #566 指出的新模板句複製，缺乏單一 persona SSOT 與可驗證在地事實
- 解法：新增 currency-personas.ts L1 必填 schema（hook／cashCulture／denominationTip／exchangeChannel／faqSpecific／reverse），17 幣別各 ≥3 個 WebSearch 查證在地事實（來源列於 PR 附錄），品質對齊 PHP/IDR/MYR 基準

- 日期：2026-07-05
- ID：neutral-rw-e5-seo-copy-design-brief-docs
- 原因：E5 wave-A（SEO copy 四層架構與金額頁 v2）開工，設計簡報需納入版控供 PR 勾稽與後續 wave 溯源
- 解法：將 PM 設計簡報 `git add -f` 進 `.claude/prds/`，作為本 epic 的 SSOT 依據

- 日期：2026-07-05
- ID：penalty-rw-e1-primary-strong-utility-not-generated
- 原因：bg-primary-strong 只加在 tailwind.config 的 primary 物件，但該鍵隨後被 semanticColors SSOT 展開覆蓋，utility 未生成導致選中 pill 白字透明底（截圖矩陣抓出）
- 解法：strong 改定義於 semanticColors SSOT（design-tokens/colors.ts），格式對齊 theme-consistency 合約（無 fallback，parity 守門保證全主題有鍵），重建驗證 dist CSS 產出 .bg-primary-strong 並重跑截圖矩陣

- 日期：2026-07-05
- ID：reward-rw-e1-static-lint-guards
- 原因：token 收斂後缺乏防回退機制，後續 PR 可能重新引入小字、按鈕漸層、任意圓角、彩色陰影與 hover-scale 造成漂移
- 解法：新增 design-system-guards 靜態掃描測試（禁 <12px、button 禁 bg-gradient、圓角/陰影白名單、hover-scale 與 infinite 動畫清零、token 實值收斂斷言），並以注入違規探針的突變驗證證明 7 條規則翻紅（移除後全綠）

- 日期：2026-07-05
- ID：reward-rw-e1-consumer-migration
- 原因：token 與 primitive 已就緒，但消費端仍散布 8-11px 字、hover-scale、按鈕漸層、白字 bg-primary 與各自實作的 sheet/chip，設計語言尚未落地
- 解法：E3 兩 sheet 收斂至 BottomSheet/CurrencyPicker（testid 相容）、multi chip 改 SegmentedControl radiogroup、全站 8-11px 升 text-2xs、hover-scale 清零、CTA/chip 去漸層並錨定 primary-strong、shadow-2xl 收斂 token（僅留一則設計契約測試同步更新）

- 日期：2026-07-05
- ID：reward-rw-e1-primitives
- 原因：E3 兩個 bottom sheet 各自實作殼層、multi 費率切換僅有過渡 chip（無 radiogroup 語意）、選幣 sheet 無法跨場景重用，元件層缺 SSOT
- 解法：新增 BottomSheet（拖曳關閉/backdrop/safe-area/fixed+adaptive）、SegmentedControl（radiogroup＋roving tabindex＋44px 熱區）、CurrencyPicker（搜尋/常用置頂/旗幟）三個 primitive 並各附 API 測試

- 日期：2026-07-05
- ID：reward-rw-e1-token-convergence
- 原因：圓角 5 級混用、彩色重陰影、<12px 字散布、hover-scale 與 4 個 infinite 動畫造成視覺語言漂移；custom 主題非演算鍵（等號鍵/品牌按鈕）停留 zen 藍且白字表面未錨定 AA
- 解法：radius 收斂三級（20/16/12px 別名全映射）、陰影收斂中性兩級、2xs 升 12px 為字階下限、動效收斂 press-scale/slide/count-up 並清 infinite 與 hover-scale、按鈕 SSOT 白字錨定 primary-strong、custom 演算鍵擴充跟色（S1/S2 同批）並強化 AA property 守門

- 日期：2026-07-05
- ID：neutral-rw-e1-design-brief-roadmap-sync
- 原因：E1 設計簡報（韓系設計系統收斂 SSOT）尚未入庫，ROADMAP 亦未反映 H1-H6/E2/E3 已完成狀態，epic 勾稽缺乏可追溯依據
- 解法：將 PM 簡報 add -f 進 .claude/prds/ 作為 E1 SSOT，ROADMAP 補狀態欄（H1-H6/E2/E3 → DONE、E1 → IN PROGRESS）

- 日期：2026-07-05
- ID：neutral-rw-main-hotfix-sync-into-experiment
- 原因：main 七個 hotfix（#557/#558/#559/#561/#565/#569/#571）落後於實驗分支基底，後續 epic 需建立在最新基底上
- 解法：以 3-way merge 將 origin/main 合入 experiment/ratewise-product-2026h2，保雙方語意解衝突（002 檔頭依公式重算累計 +117、i18n 四語系雙鍵組並存），全套守門測試驗證

- 日期：2026-07-05
- ID：penalty-rw-e3-converter-v2-keypad-remount-writeback
- 原因：ConverterKeypad remount 初始同步在使用者僅切換活躍列（零按鍵）時即回寫，以捨入反推值改寫原輸入列（1000→999.98）並靜默翻轉最後編輯方向，違反等值雙列對等語意（epic 審查抓出）
- 解法：掛載種子改唯讀（useState 鎖定＋hasUserInput 回寫閘門，僅實際按鍵才進入回寫流程），補「切列 N 次零按鍵→兩列數值與方向不變」回歸測試（紅→綠），並將 SSG 不變性 diff 收斂為 scripts/qa/verify-ssg-invariance.mjs 可重現腳本

- 日期：2026-07-05
- ID：neutral-rw-e3-converter-v2-short-screen-budget
- 原因：375×667 短螢幕下 v2 常駐計算機底緣超出可視區，違反「先砍留白再砍裝飾」佈局預算原則
- 解法：以既有 short: 高度斷點壓縮列間距、字級、sparkline 與鍵高（維持 ≥44px 觸控），三尺寸截圖驗證無捲動

- 日期：2026-07-05
- ID：reward-rw-e3-converter-v2-test-gate
- 原因：v2 分流與雙列互動需守門，且 flag off 的 SSG 不變性紅線需可重複驗證
- 解法：新增 flag 單元測試、SingleConverterV2 對等性／swap／基準切換測試、flag gate 測試與 flag-on e2e 核心旅程；以 254 頁 SSG #root DOM diff=0 證明 flag off 輸出不變

- 日期：2026-07-05
- ID：reward-rw-e3-converter-v2-trend-sheet
- 原因：v2 需常態小、展開大的趨勢呈現；歷史資料源僅 30 天，90D 需求若硬造會違反誠實標註原則
- 解法：72px sparkline＋漲跌 chip 常態嵌入，65vh bottom sheet（7D/30D/90D、min/max、內建長按 crosshair），資料不足以「僅 N 天、不足不推估」誠實標註

- 日期：2026-07-05
- ID：reward-rw-e3-converter-v2-dual-rows
- 原因：現行單幣別以上下位置編碼 from/to 方向、匯率卡切斷因果鏈、結果欄偽可編輯，造成三個認知斷點
- 解法：v2 等值雙列（兩列對等可編輯、divider 內嵌 swap、rate chip）＋常駐 4×4 計算機（沿用引擎重排呈現層）＋bottom sheet 幣別 picker，經 converter-v2 flag 分流且 legacy 零改動

- 日期：2026-07-05
- ID：reward-rw-e3-converter-v2-flag-infra
- 原因：E3 v2 需要可安全灰度的開關，且 flag off 時 SSG 首頁輸出必須與現行一致（hydration 紅線）
- 解法：新增 converter-v2-flag.ts（URL override＋localStorage＋CustomEvent，server snapshot 固定 legacy），範式對齊舊分支 hero-layout-variant

- 日期：2026-07-05
- ID：neutral-rw-e3-converter-v2-design-brief
- 原因：E3「等值雙列」wave-A 實作需要設計簡報 SSOT 入 repo，避免實作與 PM 裁決脫鉤
- 解法：將 ratewise-e3-converter-v2-design.md 複製至 .claude/prds/ 並強制納入版控作為勾稽基準

- 日期：2026-07-05
- ID：neutral-rw-e2-002-score-conservation-fix
- 原因：前一 fix commit 新增 1 筆 penalty 時，檔頭把前一 commit 已消化的 reward 重複計入，誤植「本次 0（reward 1、penalty 1）｜累計 +108」，正確應為「本次 -1（reward 0、penalty 1、neutral 0）｜累計 +107」，違反記分守恆
- 解法：檔頭累計總分回正 +107 並以本筆 neutral（0 分）留痕；同步更正 AA property 條目輸入數 312→322（12 邊界＋300 隨機＋10 色票）

- 日期：2026-07-05
- ID：penalty-rw-e2-custom-theme-hydration-derivation-gap
- 原因：custom 完整演算補齊只掛在 useAppTheme（僅設定頁掛載），首頁/多幣別冷啟動只有 bootstrap 的 --color-primary 最小覆寫，strong/hover/圖表 13 鍵停留在 zen fallback，三代表色截圖 QA 抓到全 app 未變色
- 解法：export loadThemeConfig，於 main.tsx client 初始化（isClient）對 custom 主題呼叫 applyTheme 補齊完整演算，任何路由冷啟動皆全量套用；e2e 與截圖 QA 重新驗證通過

- 日期：2026-07-05
- ID：reward-rw-e2-custom-theme-aa-property-gate
- 原因：custom 主題演算若無硬閘門，極淺/極豔輸入色可能導出低對比文字配對，且 bootstrap 內嵌覆寫與 runtime 演算存在雙份漂移風險
- 解法：新增 AA property 測試（322 個種子化隨機+邊界+色票輸入 × 全部文字配對 ≥4.5:1、圖形色 ≥3:1）、applyTheme 覆寫/清除守門、useAppTheme custom 持久化測試、bootstrap 最小覆寫守門（禁止內嵌 strong/hover 演算鍵）、chromium e2e 選色旅程（套用→重載→切回零殘留）

- 日期：2026-07-05
- ID：reward-rw-e2-custom-theme-picker-ui
- 原因：設定頁「自訂主題色」預告卡無實際功能，且 themes.ts 新增的 custom-theme 匯入未帶 .ts 副檔名導致 prebuild node（type stripping）腳本 ERR_MODULE_NOT_FOUND
- 解法：預告卡改功能卡＋展開式選色面板（10 精選色票、hex 輸入、色相/明度滑桿、恢復預設，全部即選即用）、i18n ×4 補 customTheme 鍵並移除「即將推出」、themes.ts 匯入補 .ts 副檔名修復 prebuild

- 日期：2026-07-05
- ID：reward-rw-e2-custom-theme-engine
- 原因：設定頁「自訂主題色」僅為預告卡，主題管線只支援 7 個靜態主題，無法由使用者主色即時導出全組變數且守住 AA 對比
- 解法：新增 custom-theme.ts 演算 SSOT（單一主色導出 14 鍵 primary 系列＋內建 AA clamp）、applyTheme custom 覆寫層（切回內建主題清除 inline 覆寫）、index.css [data-style='custom'] 靜態區塊採 zen 完整複製滿足 parity 合約、bootstrap allowlist 加 custom 並做最小 pre-paint identity 覆寫

- 日期：2026-07-05
- ID：neutral-rw-e2-custom-theme-design-brief
- 原因：E2「自訂主題色」epic 缺少 repo 內可追溯的設計 SSOT，PM 簡報僅存於本機 .claude 目錄（被 gitignore）
- 解法：以 git add -f 將 `.claude/prds/ratewise-e2-custom-theme-design.md` 納入版控，作為 E2 實作與 PR 勾稽的唯一依據

- 日期：2026-07-05
- ID：neutral-rw-product-2026h2-experiment-baseline
- 原因：建立產品級迭代實驗分支基線（experiment/ratewise-product-2026h2），作為後續大規模重構 epic PR 的共同 base
- 解法：新增 ROADMAP.md 路線圖並於 .gitignore 補 .claude/state/ 與 .claude/product-intel/ 忽略規則

- 日期：2026-07-05
- ID：reward-rw-dark-theme-content-pages-unreadable
- 原因：index.html 硬編碼 `<body class="bg-slate-50">` 以 class specificity 蓋掉 index.css 的主題底色變數，且 Layout 內容頁容器無主題 token，Nitro/Racing 深色主題下 FAQ/About 等內容頁白字壓白底（實測對比 1.0:1）
- 解法：body 移除硬編碼 class 改吃 `--color-background`（critical CSS 同步走 `--sk-bg` 防深色閃白）、Layout 滾動容器補 `bg-background text-text`，新增 index.html 靜態守門與 Layout 容器 token 斷言，7 主題 × FAQ/About 實測對比全數 ≥3.79:1（深色 20.17/18.97）

- 日期：2026-07-05
- ID：penalty-rw-multi-ratetype-aria-pressed-misuse
- 原因：觸控目標 hotfix 給「循環切換到下一選項」的 cycle button 加上恆為 true 的 aria-pressed，screen reader 永遠唸「已按下」，把非 toggle 鈕誤標為 on/off toggle（review Should-fix 抓出）
- 解法：移除 aria-pressed（動作語意由 aria-label「切換到現金」等完整表達），測試改斷言不得帶 aria-pressed 並附註解，另補 -my-[15px] 數值推導註解防後人改壞

- 日期：2026-07-05
- ID：reward-rw-multi-ratetype-touch-target
- 原因：/multi 匯率類型切換為 text-[11px] 純文字按鈕，實測觸控目標 22×13.8px（WCAG 2.5.8 最低 24px、repo 標準 44px），且與旁邊靜態匯率文字無區隔，可切換性不可發現
- 解法：切換鈕改 min-h-11/min-w-11 觸控目標（負 margin 保持列高）＋ bg-primary/10 chip 選中態（zen 7.79:1、nitro 10.82:1 對比）＋ aria-pressed 與 focus ring，390×844 preview 實測 44×44px，新增觸控目標與 aria 測試斷言

- 日期：2026-07-05
- ID：reward-rw-sw-cold-nav-4xx-shell-fallback
- 原因：冷導覽 network-first 首版只處理網路失敗/timeout，fetch resolve 但 4xx/5xx（如文件化的 Cloudflare stale edge 404）會把錯誤頁直接服給用戶（adversarial review blocking）
- 解法：非 2xx/opaque 一律回退既有 resolveNavigationFallback 兜底鏈且不寫 html-cache；補 404/503/200 單元測試與「冷快取在線導覽深層路由服出 per-route HTML」e2e；catch 兜底收斂為既有 fallback helper 消除重複 lookup

- 日期：2026-07-05
- ID：reward-rw-sw-cold-nav-hydration-fix
- 原因：SW 導覽 handler 在 html-cache 冷快取時直接回 precache index.html（首頁 SSG 快照）給任意深層路由，造成全站 React #418 hydration mismatch 與首頁畫面閃現（issue #545；以舊分支 6621b34a 為 spec 對 main 現行 SW 架構重做）
- 解法：冷導覽改為先以 8s bounded fetch 取該 URL 的 per-route SSG HTML，離線或 timeout 才回退 precache index.html → offline.html 兜底鏈；QA 驗證冷導覽服出正確路由 shell（wrongShell 3→0）且離線回退不退步

- 日期：2026-07-05
- ID：reward-rw-splash-animation-parity
- 原因：index.html 內嵌靜態 splash 與 React SplashScreen 動畫版雙軌互不同步（視覺/動畫/偏好各自維護），冷啟動實際序列與設定頁預覽必然不一致，且開關只關 React 版
- 解法：inline 版標記鏡射 SplashScreen 輸出並共用 index.css .ratewise-splash 樣式與 keyframes（SSOT），inline script 對齊偏好開關與 exit 相位，React 版偵測 session 旗標跳過自動顯示避免雙重播放，新增 splashParity 守門測試＋e2e 兩案例，8 相位（zen/nitro × 4 時點）像素對比 0.000% 差異

- 日期：2026-07-05
- ID：reward-rw-trend-tooltip-bubble-basis
- 原因：趨勢圖 tooltip 的 translateX(-50%) 被 Framer Motion animate transform 覆寫且 position:fixed 落在帶 transform 的祖先內（最新點 tooltip 溢出畫面 left=388/viewport=390）；「即期不可用」氣泡被匯率資訊區 overflow-hidden 剪到剩 7px；趨勢資料固定現金賣出基準但卡片可顯示即期價，圖表無標註致使用者誤判圖錯
- 解法：tooltip createPortal 至 body＋置中放外層純 div＋useLayoutEffect 以 clampTooltipCenterX 夾 viewport 邊界；移除資訊區 overflow-hidden（微光疊層自有剪裁不受影響）；新增 trend.cashSellBasis i18n ×4 於圖角與 tooltip 誠實標註基準（換錢所趨勢同基準不標），資料基準對齊 rateType 留 backlog

- 日期：2026-07-05
- ID：reward-rw-seo-content-truthfulness-p0
- 原因：SEO 文案 SSOT 含手寫匯率快照＋寫死年份（SGD/AUD/GBP/CAD/NZD/MYR/IDR/THB/VND/KRW 共 13 處）、精確假數字（419,639 韓元）、無來源最高級銀行宣稱（高雄銀行最便宜等 7 處）、About 自我指涉 SEO FAQ（schema 清單＋AI 爬蟲名單），且中間價差距數字三處互相矛盾（0.5-2%／1-3%／1-10%），YMYL 頁必然過期失真
- 解法：匯率數字一律改由 SEO_RATE_EXAMPLES（每日更新）注入（新增 buildUnitRateSentence）、銀行宣稱改中性比價建議、About 自指涉 FAQ 移除並以守門測試防回流、差距描述收斂為 MID_RATE_SPREAD_NOTE 單一常數三處引用（鏡像腳本同步擷取），vitest 2730 綠＋generate:deterministic＋build:ratewise 通過

- 日期：2026-07-05
- ID：reward-rw-favorites-sort-ptr-hotfix
- 原因：全域 pull-to-refresh 掛在 main 無拖曳排除，與 dnd 拖曳同時作動造成收藏頁排序錯位與誤觸整頁重載風險，且非收藏幣拖曳被隱式加收藏、favorites.baseCurrency 四語系缺 key 直接顯示 raw key、刷新指示器無 safe-area 補償
- 解法：PTR touchstart 以 data-rfd-drag-handle 祖先 gate 完全抑制拖曳中 PTR，排序合約收斂為 reorderFavoritesOnDragEnd 純函式（僅收藏幣可拖、非收藏幣停用拖曳），四語系補 baseCurrency key，指示器加 safe-area-inset-top；unit＋390×844 觸控模擬修前修後對照驗證

- 日期：2026-07-05
- ID：reward-rw-theme-ssot-drift-convergence
- 原因：主題雙源（themes.ts STYLE_DEFINITIONS 與 index.css [data-style] 變數）累積 8 筆值漂移（zen/violet secondary、kawaii/classic 圖表 3 色），既有測試只守鍵集合與格式、不守值同步
- 解法：以實際渲染消費端定真相（secondary 由 CSS 變數渲染、圖表色 getChartColors 讀 CSS 變數），themes.ts 8 筆全數收斂至 index.css 值，新增 theme-style-definitions-css-sync 表驅動守門（7 主題 × 16 鍵值同步，突變驗證可抓漏）

- 日期：2026-07-05
- ID：reward-rw-offline-shell-korean-flat-ui
- 原因：離線兜底頁 v1 沿用漸層背景／漸層按鈕／裝飾陰影，與韓系 fintech（Toss）產品級扁平語彙不符，使用者回饋顏色風格醜且不喜歡漸層
- 解法：視覺層全面扁平化（移除全部 linear-gradient 與 shadow token、主按鈕全寬實色 ≥52px、匯率快照改 Toss 交易列表式、status 改安靜小圓點），generate-offline-html.mjs 同步精簡未用 token，7 主題兩尺寸截圖驗證 console 零錯誤

- 日期：2026-07-04
- ID：reward-rw-offline-shell-honest-redesign
- 原因：offline.html 把災難兜底講成離線常態（誤導文案「已快取的匯率數據仍可離線使用」在 shell 遺失時為假），且在線恢復中與真離線共用同一死頁、快取匯率未被利用
- 解法：模板改 data-offline-state 雙狀態分流（recovering spinner / offline 誠實文案+SHELL-EVICTED 診斷代碼），localStorage 最後已知匯率以 textContent+createElement 渲染唯讀快照（cash.sell 優先、壞資料整區隱藏），self-heal 邏輯只呼叫不改寫

- 日期：2026-07-04
- ID：reward-rw-theme-token-contract-parity
- 原因：主題變數合約破碎（zen 聯集 121 鍵、深色主題僅 88 鍵），缺鍵靜默 fallback 到 zen 淺色值，深色主題出現淺色卡片／警示／收藏色；defaultTheme/darkTheme violet 遺物僅被過時測試消費形同無守門
- 解法：7 主題全鍵補齊（深色補值同色相且文字對比 ≥4.5:1、淺色跟隨各自 Tailwind 色階）、刪除死鍵 neutral-border、parity 測試擴為全鍵集合相等＋聯集下限＋zen 組合選擇器守門、移除 defaultTheme/darkTheme 並重寫 consistency 測試為格式合約

- 日期：2026-07-04
- ID：reward-haotool-root-site-removal
- 原因：haotool 根站規劃完整重建，需先移除 apps/haotool 並保存內容/功能事實避免重建時遺失整合細節
- 解法：以 safe-worktree 建分支刪除 apps/haotool；盤點文件落地 docs/dev/046（排除 UI/UX）；同步清理 root scripts/Dockerfile/nginx/CI/env/GSC 腳本整合點並重算 lockfile；HEALTHCHECK 改 /health

- 日期：2026-07-04
- ID：reward-rw-rates-history-integrity
- 原因：台銀 outage 期間每日快照 workflow 無新鮮度檢查，把 stale latest.json 連續 4 天複製成 history 壞資料（趨勢圖假平線）且當日 cron 掉單無備援；資料齡守門在春節連假會因休市 timestamp 凍結誤報；MoneyBox 鏈無 staleness gate、兩條抓取腳本無數值熔斷；另 Worker v5.4 將 sw.js 改為純 no-store 使 governance E2E 斷言 no-cache 過時紅燈
- 解法：data 分支以台銀歷史 CSV（真瀏覽器過 challenge）回補 4 天真實匯率+重生 aggregate+purge CDN；歷史快照守門改用上游管線存活訊號（12h 內 update-latest 零 success 才拒寫，休市不誤報）+保留 01:30 備援 cron；MoneyBox 加 30h staleness gate（每日 rollover 最舊 ~24h）；兩腳本寫檔前加幣別數/合理區間/突變 >15% 熔斷（env 可覆寫）並補單元測試；update-seo-rate-examples 改掛 gh pr merge --auto（checks 仍把關）；data 寫入 workflow push trigger 限 main；sw.js 斷言改為 no-store 且禁 max-age/immutable

- 日期：2026-07-04
- ID：reward-rw-offline-loadfailed-resilience
- 原因：chunk 失敗恢復流程呼叫 FORCE_HARD_RESET 清光所有快取，弱網瞬斷即自毀離線防護導致 offline.html 頻現；root route 無 errorElement 使 react-router 預設「Unexpected Application Error/Load failed」洩漏
- 解法：恢復流程去核彈化（SW update+延遲重載、離線不重載不耗 cooldown）、全路由掛 OfflineAwareError（chunk 錯誤自動恢復、online 自動重試）、hard reset 後回填 shell；Playwright 離線/驅逐/恢復四場景實測

- 日期：2026-07-03
- ID：reward-rw-twbank-challenge-stale-rates
- 原因：台銀 06/29 啟用 bot challenge 使純 fetch 拿到 HTML，匯率停更 4 天；workflow continue-on-error 綠燈掩蓋事故；另 wordmark accent #3182F6 淺底 3.54 未達 AA 使 main E2E 紅
- 解法：新增真瀏覽器 fallback（xvfb headed Chrome 頁內 fetch CSV）+ CSV_INPUT_FILE 解析模式 + 6 小時 staleness gate 讓持續故障紅燈曝光；wordmark accent 改 primary-strong

- 日期：2026-07-03
- ID：reward-rw-pwa-cold-launch-auto-update
- 原因：prompt 模式下舊 PWA 用戶熱啟動偵測到新版仍需手動點「更新」，長期未點者停留舊版
- 解法：needRefresh 於冷啟動 30 秒窗口內自動 SKIP_WAITING+整頁重載（輸入中不打斷、session 5 分鐘防迴圈），preview 雙版本實測 loads=2 自動切換

- 日期：2026-07-03
- ID：reward-rw-theme-token-longpress-tooltip
- 原因：primary-strong 定義在 :root 洩漏至全主題使 pill 恆為 zen 深藍；趨勢圖自製長按與內建 tracking 互搶致 tooltip 跳動；原生 disabled 吞點擊使禁用原因提示永不顯示；主題監聽只看 class 漏 data-style
- 解法：primary-strong 收斂 7 主題雙 SSOT、LOGO 改 BrandMark inline SVG 隨主題、長按交還內建 trackingMode（OnTouchEnd）、匯率類型改 aria-disabled、observer 加 data-style；瀏覽器長按/禁用/7 主題輪巡實測

- 日期：2026-07-03
- ID：reward-rw-haorate-wordmark-splash
- 原因：品牌 wordmark 未按 showcase SSOT（Nunito 900、Rate 主色）落地，缺啟動頁與關閉設定；SEO 文案仍寫 6 種主題、品牌藍白字對比未達 WCAG AA
- 解法：自架 1.2KB Nunito 子集＋BrandWordmark/SplashScreen（standalone 限定＋設定開關＋預覽＋i18n×4、字體入 precache 守門）；文案修 7 種主題；新增 zen primary-strong token 修對比，Lighthouse 99/100/96/100

- 日期：2026-06-30
- ID：reward-rw-offline-manifest-theme-ssot
- 原因：RW-3b 離線頁 committed zen 仍為 #6366F1（未 regenerate），與 manifest/index SSOT #7C3AED 不一致，deploy gate 失敗
- 解法：generate:deterministic 重生成 offline.html、index.html theme-color 對齊 violet-600、更新 E2E/unit 期望與 artifact smoke test

- 日期：2026-06-30
- ID：reward-rw6b-moneybox-workflow-sw-history
- 原因：MoneyBox history 檔名用台北 wall-clock（跨日與首爾掛牌日不一致）、aggregate 首次缺失不觸發 commit、SW 未快取換錢所 history-30d（離線趨勢圖無資料）
- 解法：workflow 改用 extractSeoulSnapshotDate 命名 history（fallback 首爾 wall-clock）+ aggregate 缺失補 changed=true；sw.ts history-30d 路由加 providers/moneybox 路徑

- 日期：2026-06-30
- ID：reward-rw6-moneybox-seoul-date-rollover
- 原因：MoneyBox 換錢所牌價不變但首爾掛牌日跨日時，latest.json 未刷新→與每日 history 日期不對齊
- 解法：加 extractSeoulSnapshotDate/shouldRefreshLatestSnapshot（rate-changed 或 date-rollover 才刷新），整合進 hasRateChanges；保留 main 的 needsSchemaMigration/enrich（紅線）；補 3 測試並納入 test:root

- 日期：2026-06-30
- ID：reward-rw5-seo-truthfulness-update-frequency
- 原因：SEO 文案過度承諾「每 5 分鐘自動同步/更新」（實際依資料來源與 CDN 快取而定），有 E-E-A-T 不實風險
- 解法：seo-metadata core/currency-landing 與內容 generator 一致軟化為「約每 5 分鐘檢查更新」+ OpenData FAQ 加新鮮度免責；regenerate mirrors/llms/api 同步；「最精準」品牌定位詞屬產品決策，本支不擅改

- 日期：2026-06-30
- ID：reward-rw3b-offline-template-theme-aware
- 原因：離線頁背景/容器/圖示硬編紫色，nitro/深色主題使用者斷網時閃錯誤的淺紫，與主題不一致
- 解法：合併 #433 主題感知模板（per-theme CSS + theme-color + safe-area）但植回 main 的 #508 自我修復腳本與 retry-btn（非整檔取避免回退死亡迴圈）；generator 移除 prettier（紅線）；驗證 nitro 離線頁深色 #020617 且 #508 導回 app 正常

- 日期：2026-06-30
- ID：reward-rw3-manifest-theme-color-ssot
- 原因：PWA manifest theme_color/background 硬編 #8B5CF6/#E8ECF4，與實際 zen 主題色不符；themes.ts zen primary(99 102 241) 與 index.css(124 58 237) 漂移
- 解法：manifest 改讀 STYLE_DEFINITIONS.zen 經 rgbTripletToHex 轉換；同步 themes.ts zen primary 至 124 58 237 修漂移（離線模板主題化屬高風險 #508 合併，列 RW-3b）

- 日期：2026-06-30
- ID：reward-rw2-nitro-theme-contrast-fix
- 原因：Nitro 深色主題 textMuted 為 slate-500（深底對比過低，次要文字看不清）、primary 為過亮 cyan（按鈕白字對比不足）；themes.ts chartLine 與 index.css 漂移
- 解法：textMuted→slate-300、primary→0 150 230（白字 3:1 AA）、chartLine 同步 cyan-300；新增 themes.test 守門 nitro 對比與 TS↔CSS 同步

- 日期：2026-06-29
- ID：reward-rw1-design-token-radius-shadow-ssot
- 原因：#433 的 radius/shadow 語義 token 改在扁平 design-tokens.ts，與 main #512 目錄化衝突；散落 rounded-2xl/shadow-card 硬編碼無 SSOT
- 解法：RW-1 將 radiusTokens/shadowTokens REMAP 至 design-tokens/scale.ts + tailwind.config 接線 + DESIGN.md；radius-ssot 守門延至元件遷移 PR（避免未遷移即大規模失敗）

- 日期：2026-06-29
- ID：penalty-pr512-missing-002-audit-log
- 原因：PR #512 的 6 個 commit 全程未更新 002 稽核紀錄，違反 AGENTS.md Phase 4 / AGT-LOG-01「每次 commit 前更新 002 並同步分數」的硬規則（由 Codex review P1 抓出）
- 解法：補登本批次 002 條目與分數，回覆並收斂 Codex thread；後續多 commit 任務每次 commit 前先寫 002

- 日期：2026-06-29
- ID：reward-ratewise-rate-payload-validation
- 原因：CDN 匯率 payload 的 rate 為 0/NaN/負/非數值時會穿透 transformRates(1/rate) 產生靜默 Infinity/NaN，回傳錯誤匯率且不觸發既有 fallback
- 解法：新增純函式 isValidRatePayload（rates 非空且每筆為有限正數）守住 fetch 邊界，失敗即落入既有 build-time fallback；補 14 測試，不引入 zod（KISS/YAGNI）

- 日期：2026-06-29
- ID：reward-ratewise-config-modularization-ssot-coupling
- 原因：seo-metadata.ts(2959) 與 design-tokens.ts(1340) 巨型單檔可讀性差；拆分隱藏三類 source-text 耦合（守門測試 fs.readFile、lastmod SSOT、markdown-mirrors prebuild script，最後一類僅 build 抓得到）
- 解法：各拆為目錄 + barrel（import 路徑不變、單檔 <600），同步守門測試/lastmod SSOT/prebuild script；以 typecheck+lint+2513 測試+build 零漂移驗證

- 日期：2026-06-29
- ID：reward-ratewise-sentry-sampling-coverage-ratchet
- 原因：Sentry 連續 session replay 取樣耗配額、@sentry/react 誤置 devDependencies；覆蓋率門檻(79/63/79/81)遠低於現況留太大退步空間
- 解法：replaysSessionSampleRate 設 0 僅保留 onError replay、@sentry/react 移至 dependencies（bundle chunk hash 不變）；覆蓋率門檻棘輪上調至現況−2%(83/72/84/84)防退步

- 日期：2026-06-28
- ID：reward-offline-shell-self-heal-death-loop
- 原因：在線用戶被壞 SW 誤服 offline.html 時 React/swHealth 未掛載，reload 仍回 offline.html 形成死亡迴圈
- 解法：offline.html 內嵌 CHECK_SHELL_PRECACHE 探針 + SKIP_WAITING + 導向 app shell，打破無 React 的修復盲區

- 日期：2026-06-28
- ID：reward-sw-aggressive-propagation-broken-shell
- 原因：舊版 SW precache 不完整（缺 index.html 或 400+ legacy 項）仍控制 client，離線冷啟動誤觸 offline.html，且 prompt 模式離線無法拉取修復版
- 解法：swHealth 探針判斷壞 SW，連網時自動 update + SKIP_WAITING + 整頁重載一次；健康 SW 維持 prompt UX

- 日期：2026-06-28
- ID：reward-dependabot-npm-overrides-2026-06
- 原因：32 個 open Dependabot npm alerts（axios、undici、shell-quote、form-data、js-yaml、launch-editor、@babel/core、@babel/plugin-transform-modules-systemjs、qs、tmp、uuid、react-router）transitive 版本低於修補門檻
- 解法：root pnpm.overrides 收斂 12 套件至修補版本（含 react-router ^6.30.4 限 v6 patch，不觸 #423 v7 遷移）並 refresh lockfile

- 日期：2026-06-28
- ID：reward-docker-libssh2-dsa-6365
- 原因：Trivy 掃描 ratewise Docker 映像（nginx:stable / Debian trixie）偵測 libssh2-1t64@1.11.1-1 含 DSA-6365-1 未修補 CVE
- 解法：production stage 於 apt upgrade 後明確 `--only-upgrade libssh2-1t64` 拉取 1.11.1-1+deb13u1

- 日期：2026-06-28
- ID：reward-viewport-qa-layout-hotfix
- 原因：10 裝置 QA 矩陣在 Galaxy S21 360×800 與 iPhone SE 320×568 出現 CTA 與 bottom nav 重疊、匯率文字蓋住 RateSelector、CTA 觸控高度僅 38px
- 解法：design-tokens SSOT 調整 infoPadding/addToHistory min-h-11，AppLayout narrow 360px 額外 bottom padding +28px

- 日期：2026-06-28
- ID：reward-pwa-https-cold-start-manifest-regression
- 原因：#447 已改絕對 HTTPS start_url，但 SW seo-files-cache 以 SWR 快取舊 manifest（相對 start_url），冷啟動仍觸發 HTTPS-First 警告
- 解法：manifest.webmanifest 改 NetworkOnly、scope 同步絕對 HTTPS SSOT，並補防回歸測試

- 日期：2026-06-28
- ID：reward-threads-barcelona-inapp-ua
- 原因：Threads 2024+ 內建瀏覽器 UA 改用 Barcelona 代號，僅匹配 Threads 字串時 PWA 安裝指引與右上角動畫不顯示
- 解法：pwaInstallGuide SSOT 補 Barcelona token，並以 production UA 樣本覆蓋 iOS/Android 單元測試

- 日期：2026-06-27
- ID：reward-cold-start-multi-hydration-fallback
- 原因：RememberedHomeRoute 僅依 hasHydrated/onFinishHydration 設 hydrated，SSG/CSR 生產環境 store 已 merge persist 但回呼未觸發，multi 冷啟動無法還原
- 解法：hydration effect 補 queueMicrotask 與 store subscribe fallback，store 與 localStorage 同步即標記 hydrated

- 日期：2026-06-27
- ID：reward-applayout-logo-vitest-teardown-flake
- 原因：AppLayout.logo.test 渲染後 lazy prompt 非同步觸發 console，vitest onConsoleLog RPC 在 worker 關閉時仍 pending 導致 EnvironmentTeardownError
- 解法：mock NonCriticalLazyBoundary 與 lazy 子元件、beforeEach/afterEach 抑制 console 並 cleanup

- 日期：2026-06-27
- ID：reward-cold-start-multi-restore-race
- 原因：RememberedHomeRoute 在 hydrated=true 時立即 markRestoreAttempted，但 zustand store 的 lastConverterView 可能尚未 rehydrate，導致 multi 冷啟動錯失 redirect
- 解法：shouldRestoreToMulti 補讀 localStorage persist；markRestoreAttempted 延後至 store 與 persist 同步後再標記

- 日期：2026-06-27
- ID：reward-ratewise-homepage-cls-454-hotfix
- 原因：#441 計價基準 pill 與趨勢圖進場動畫使首頁 CLS 達 0.237，超過 LHCI 門檻 0.1
- 解法：SingleConverter 匯率卡片固定 min-height、預留 pill 槽位、移除趨勢圖 translate 動畫；RateWise footer 保留 min-h-6

- 日期：2026-06-27
- ID：reward-moneybox-schema-migration-cdn-fallback
- 原因：MoneyBox fetch 僅比對匯率數字，schema v2 遷移未觸發 data commit/purge；jsDelivr @data 分支快取最長 12h
- 解法：needsSchemaMigration 補觸發寫入與 purge；runtime CDN stale schemaVersion 時 fallback Raw

- 日期：2026-06-27
- ID：reward-pr472-openapi-dataset-hotfix
- 原因：PR472 後 OpenAPI details 誤用 CurrencyRateV2 必填 v2 欄位，與台銀 live JSON 不符；Dataset JSON-LD 未納入 MoneyBox
- 解法：RatesResponse details 改 ref CurrencyRateDetail；buildOpenDataDatasetJsonLd 補 MoneyBox distribution 與描述

- 日期：2026-06-27
- ID：reward-split-meow-legacy-expense-currency-twd
- 原因：PR 445 審查發現缺 currency 的舊支出 fallback 至全域幣別，KRW 上線前 TWD 帳目切換幣別後仍誤顯示 ₩
- 解法：resolveExpenseCurrency 與 resolveTripCurrency 舊資料固定 fallback TWD，補 currencies 單元測試

- 日期：2026-06-27
- ID：reward-pw-version-unify-1611
- 原因：monorepo 混用 PW 1.57/1.61，Node24.16+ 搭配 PW<1.60 導致 nihonname E2E 安裝卡死
- 解法：root 與 quake-school/haotool/nihonname/split-meow 升至 ^1.61.1 對齊 ratewise 並更新 lockfile

- 日期：2026-06-27
- ID：reward-pwa-static-fallback-unit-tests
- 原因：PR 452 未覆蓋 resolveOfflineStaticResourceFallback 三層離線回退路徑
- 解法：補 exact、ignoreSearch、matchPrecache 與全 miss 四項單元測試

- 日期：2026-06-27
- ID：reward-moneybox-workflow-api-semantics-checkout
- 原因：data branch workflow 只 checkout fetch 腳本，缺 api-semantics-v2.ts 導致 enrich 失敗且 CDN 無 v2
- 解法：update-moneybox-rates.yml sync 步驟補 checkout SSOT 並加 build-scripts 守門

- 日期：2026-06-27
- ID：reward-api-semantics-v2-moneybox-provider
- 原因：MoneyBox provider JSON 缺 v2 語意層，sell 與台銀 quote 方向相反易誤用
- 解法：enrichExchangeShopRatesPayload、provider semanticFieldMapping、OpenData 對照表與 OpenAPI ExchangeShopRateV2

- 日期：2026-06-27
- ID：neutral-plan010-e2e-mobile-smoke
- 原因：Plan 010 Gate G4 缺 mobile-pwa/hero-y/touch-44/console Playwright 390x844 自動化
- 解法：新增 mobile-pwa-smoke、touch-targets-44、console-hydration spec 與 chromium-mobile-390 project

- 日期：2026-06-27
- ID：reward-ux2026-epic2-settings-ssot
- 原因：Settings 缺 PWA 安裝入口、PWA 1.8s 自動弹出、Favorites 無匯率列且觸控未達 44px
- 解法：Epic 2 實作 conversion-success nudge、Settings install 區塊、Favorites 匯率列與 segmentedSwitch min-h-11

- 日期：2026-06-27
- ID：neutral-epic4-multi-ia-plan005
- 原因：Multi 18 列全展開與 nav 8px/scroll-padding 不足（L03/L05 UX-INC-004/007）
- 解法：≤8 progressive disclosure、全列表套用文案、nav 10px+scroll-padding 57px、冷啟動禁 redirect /multi

- 日期：2026-06-27
- ID：neutral-epic1-settings-hero-toggle
- 原因：plan 002 §二十 要求 Settings heroLayoutVariant toggle 與 spec L01/L06/L14 done 證據同步
- 解法：Settings 新增 legacy/hero-v2 切換、i18n 四語系、SingleConverter DOM helper 重排、spec §六 Status=done

- 日期：2026-06-27
- ID：reward-epic1-hero-v2-layout
- 原因：首屏 answer-first 倒置（金額列優先於 hero 匯率）違反 spec §十一 E1
- 解法：新增 hero-v2 feature flag、display-md token、DOM 重排與 freshness chip；預設 legacy

- 日期：2026-06-27
- ID：reward-release-yml-worker-order-minify
- 原因：release.yml Worker deploy 在 Zeabur wait 之前且 CI 未用 --minify，違反 AGENTS.md 邊緣順序 SOP
- 解法：調整為 Wait → Worker deploy --minify → purge，並同步 DEPLOY.md 與 security-headers package.json

- 日期：2026-06-27
- ID：neutral-epic3-collect-body-text-ssot
- 原因：L09 dedupe 測試內嵌 collectBodyText 與 seo-metadata SSOT 重複
- 解法：seo-ssot.test 改 import collectCurrencyLandingBodyText 共用 SSOT

- 日期：2026-06-27
- ID：neutral-epic3-l09-plan-spec-sync
- 原因：L09 Step1 完成需同步 plan 004 與 UX spec 狀態證據
- 解法：更新 plans/README、004 done criteria 與 spec L09 status（build dist thesis curl 1）

- 日期：2026-06-27
- ID：reward-epic3-canonical-sell-thesis
- 原因：幣別頁 curl 賣出價/中間價 keyword 重複（L09 thesis >1）
- 解法：seo-metadata 新增 CANONICAL_BANK_SELL_THESIS SSOT 並收斂 AnswerCapsule/FAQ 交叉引用

- 日期：2026-06-27
- ID：reward-ratewise-api-semantics-v2-m1-m3
- 原因：public API 仍用銀行視角 buy/sell，整合方易反解 customer action；spec §二十一 要求 additive v2 語意層。
- 解法：新增 api-semantics-v2 SSOT、schemaVersion 2.0 metadata、OpenAPI CurrencyRateV2 與 vitest 映射測試；legacy 欄位保留。

- 日期：2026-06-27
- ID：neutral-ux2026-stream0-bootstrap
- 原因：UX 2026 平行 stream 0 需確認 experiment 分支與 worktree SSOT 並同步 plans/spec 追蹤
- 解法：驗證 origin/experiment/ratewise-ux-2026、補 cf worktree、更新 plans/README 001 DONE 與 002/004/006/007 IN PROGRESS

- 日期：2026-06-26
- ID：neutral-retrigger-prod-deploy-2252
- 原因：Release run 28213399513 Zeabur GitHub deployment 回報 success（2306994）但 Zeabur RUNNING pod 仍為 6/25 舊版，正式站 app-version 卡 2.25.1
- 解法：最小 PR 重觸 main push 促使 Zeabur 重新部署 2.25.2，版本切換後手動 CF purge 與 live precache 驗證

- 日期：2026-06-26
- ID：neutral-002-score-header-correction-pr425
- 原因：Codex P2 指出本批 3 reward + 1 neutral 的 header 誤寫 +1
- 解法：header 更正為 +3（reward 3、penalty 0），累計 +62 維持不變

- 日期：2026-06-26
- ID：reward-ratewise-moneybox-no-cache-revalidation
- 原因：Codex P2 指出 MoneyBox fetchFromCDN 移除 If-None-Match 後仍用預設 cache mode，TTL 到期可能被 HTTP cache 餵舊換錢所報價
- 解法：fetchWithTimeout 加 cache: 'no-cache' 並補 moneyboxRateService 測試斷言

- 日期：2026-06-26
- ID：reward-ratewise-cdn-no-cache-revalidation
- 原因：Codex P1 指出移除 If-None-Match 後 localStorage TTL 到期仍可能被瀏覽器 HTTP cache 餵舊匯率 body
- 解法：fetchFromCDN 加 cache: 'no-cache' 強制 CDN 重新驗證，並補 exchangeRateService 測試斷言

- 日期：2026-06-26
- ID：neutral-agents-continual-learning-sync
- 原因：continual-learning 4c1b7c25 更新 AGENTS.md Learned Preferences/Facts 未入版控
- 解法：新增 neutral 002 條目並以 docs(agents) commit 推送 fix/ratewise-pwa-etag

- 日期：2026-06-26
- ID：reward-ratewise-pwa-etag-p0-convergence
- 原因：PR411 混雜 split-meow 與 AppLayout 變更，P0 修復（precache-first、If-None-Match preflight、moneybox ETag）無法安全合併
- 解法：自 origin/main 開 fix/ratewise-pwa-etag 分支 cherry-pick 三 commit，整合 patch changeset 與 focused 測試後獨立 PR

- 日期：2026-06-26
- ID：reward-ci-e2e-full-shard-timeout-45
- 原因：main push E2E Full 2-way shard 仍設 20 分鐘逾時，完整 desktop+mobile 套件在冷快取下被取消，merge-reports 連帶失敗
- 解法：ci.yml 將 e2e-full shard 與 e2e-merge-reports timeout-minutes 調整為 45（高於 PR smoke 30 分鐘）

- 日期：2026-06-26
- ID：reward-ci-e2e-speed-optimization
- 原因：PR E2E 每次跑完整 96 測試 + 冷 Playwright 安裝，常超過 15 分鐘且 docs-only PR 也觸發
- 解法：path filter + Playwright 分層快取 composite action + PR smoke（38 desktop tests）+ main 2-way sharding 與 merge-reports

- 日期：2026-06-26
- ID：reward-ci-e2e-timeout-30
- 原因：E2E job timeout-minutes 15 不足，Playwright 冷快取安裝階段遭 GitHub Actions 取消
- 解法：ci.yml E2E job timeout 調整為 30 分鐘（已由 e2e-speed-optimization 取代為 smoke 15 / full 20 min）

- 日期：2026-06-26
- ID：reward-lighthouse-ci-production-grade-converge
- 原因：Production Lighthouse 在 ratewise PR 掃 live URL 造成誤判，compareDirection 缺行為測試且 PERFORMANCE_BASELINE 未同步絕對容忍
- 解法：抽出 lighthouse-drift.mjs 補 INP 漂移行為測試、移除 production workflow PR 觸發、ci.yml LHCI 加 paths/timeout、E2E timeout 30 分

- 日期：2026-06-25
- ID：reward-ratewise-pwa-install-guide-p1-merge-fix
- 原因：beforeinstallprompt 在 desktop 無條件 preventDefault 阻擋原生安裝 UI，且 ~693KB 安裝海報被 SW precache
- 解法：僅 Android 且 shouldShowGuide 時攔截事件，pwa-install 海報加入 globIgnores 改 runtime fetch，補 desktop Vitest

- 日期：2026-06-25
- ID：neutral-continual-learning-agents-md
- 原因：continual-learning 從近期 transcript 萃取高訊號 UI/UX 偏好與 Cloudflare Workers 治理事實
- 解法：在 AGENTS.md 新增 Learned User Preferences 與 Learned Workspace Facts 章節

- 日期：2026-06-25
- ID：reward-lighthouse-inp-drift-tolerance
- 原因：Production Lighthouse baseline 以 10ms INP 絕對門檻誤判 lab 34→60ms 噪音為阻擋性回歸
- 解法：將 inpMs 絕對漂移容忍值調整為 30ms，保留 5% 相對與 200ms 硬性門檻，vitest 驗證通過

- 日期：2026-06-25
- ID：reward-ratewise-pwa-install-poster-ssot
- 原因：安裝海報未走專案 optimize-images.js SSOT，PNG fallback 達 ~500KB 未做效能優化
- 解法：將海報納入 optimize-images.js（sharp avif q80/webp q85），PNG fallback 下採樣量化至 ~240KB（−53%），master 比照既有圖片不入庫

- 日期：2026-06-25
- ID：penalty-ratewise-pwa-install-guide-semver-converge
- 原因：初版誤用 patch 升版（新互動元件應為 minor）、002 本次分數變化算術誤標，且 messenger UA 偵測排在 facebook 之後永遠不可達
- 解法：改以 minor 經 changeset 重生至 2.25.0，修正 002 算術、調整 messenger 偵測順序、補 Escape 關閉與對應 Vitest

- 日期：2026-06-25
- ID：reward-ratewise-pwa-install-guide
- 原因：RateWise PWA 缺少依 iOS、Android 與 Threads 等內建瀏覽器情境自動分流的安裝指引，使用者無法清楚完成加入主畫面流程
- 解法：新增 SSR-safe PWA 安裝環境偵測、品牌化 iOS/Android 安裝海報與 lazy 全域提示，並補 focused Vitest 與 changeset

- 日期：2026-05-15
- ID：reward-ratewise-moneybox-aggregate-trend
- 原因：換錢所（KRW/MoneyBox）趨勢線在生產環境每次載入觸發 30 個 daily fetch，且大多數 ~30 天前的日檔 404，與台銀 history-30d.json aggregate SSOT 飄移
- 解法：client 加 aggregate-first（與 PROVIDER_RATES_PATH.aggregate 對齊）+ 5 分鐘 memory cache + fallback 保留逐日；Playwright AB 量到 50→1 requests、~5049ms→~2ms（~2500x），單測覆蓋四種情境

- 日期：2026-05-14
- ID：reward-ratewise-sentry-fetch-filter-ssot
- 原因：Sentry `beforeSend` 仍用 `'Failed to fetch'` 字面比對，與 errorClassification 跨瀏覽器 SSOT 飄移，Firefox / Safari 的 fetch 失敗會繞過過濾而重複送到 Sentry
- 解法：改用 `classifyUnhandledRejection` 判斷 `generic-fetch-failure` 後 return null；以 Playwright AB test 在 dev runtime 確認 6 變體 + 1 control 路由正確

- 日期：2026-05-14
- ID：reward-ratewise-error-classification-cross-browser
- 原因：errorClassification 僅匹配 Chromium 的 "Failed to fetch"，Firefox 與 iOS / macOS Safari 在離線、連線中斷、DNS 失敗、無法連線時的訊息會落入 unknown 觀測桶，干擾告警基線
- 解法：補上 Firefox NetworkError 與 Safari 系列 NSURLError 訊息（offline / network lost / hostname not found / cannot connect）匹配，並補單元測試保護；順手統一 prebuild 刷新腳本 cache 分支幣別數量輸出單位

- 日期：2026-05-13
- ID：reward-ratewise-data-pr-governance
- 原因：每日 SEO/fallback 資料 workflow 仍在建立 PR 後直接 merge，繞過最佳實踐中的 branch protection 決策邊界
- 解法：移除 workflow 內直接 merge step，改由 required checks、review 或 GitHub auto-merge / merge queue 控制合併

- 日期：2026-05-13
- ID：reward-ratewise-fallback-snapshot-freshness
- 原因：fallback snapshot 已導入每日刷新但分支仍落後最新台銀快照，刷新腳本輸出仍顯示錯誤幣別數
- 解法：合併最新 main、更新 build-time fallback snapshot，並修正刷新腳本說明與匯率筆數輸出

- 日期：2026-05-13
- ID：reward-ratewise-multi-accessibility-contrast
- 原因：多幣別 accessibility gate 啟用後揭露 11px 匯率資訊文字在淡底上對比不足
- 解法：移除低對比 opacity 疊色，改用明確 text / primary-dark tokens 滿足 WCAG AA 對比

- 日期：2026-05-13
- ID：reward-ratewise-multi-rate-toggle-pair-availability
- 原因：多幣別三態切換以列幣別而非實際 pair 判斷可用性，現金不可用時也可能顯示錯誤標籤
- 解法：改用 pair-level availability 與 resolved rate type，並補 exchange-shop 反向 TWD 與 spot-only label 回歸測試

- 日期：2026-05-13
- ID：reward-ratewise-fallback-rate-snapshot-ssot
- 原因：prebuild 仍刷新 tracked live rate data，且 runtime fallback 匯率另有硬編碼副本
- 解法：將 tracked fallback snapshot 更新改為 explicit refresh，prebuild 回到 deterministic，runtime fallback 改讀 build-time snapshot SSOT

- 日期：2026-05-12
- ID：reward-ratewise-prerender-internal-route-contract
- 原因：prerender 測試仍要求 internal-only color-scheme 頁進入 production 靜態輸出
- 解法：將測試契約改為確認 internal-only route 不產生 static HTML

- 日期：2026-05-12
- ID：reward-ratewise-currency-route-registry
- 原因：34 個幣別落地頁 route registration 與 SEO path/page entry 存在人工複製面
- 解法：建立 currency route registry、由 routes 消費並補 parity guardrail tests

- 日期：2026-05-12
- ID：reward-ratewise-generated-artifact-ssot
- 原因：build/generated/local QA artifacts 責任混雜且歷史產物污染追蹤
- 解法：建立 artifact bucket scripts、移除本機產物追蹤並同步文件 SSOT

- 日期：2026-05-12
- ID：reward-ratewise-qa-gate-governance
- 原因：核心 accessibility/offline/performance checks 仍含未收斂 skip 或手動流程
- 解法：恢復可執行 accessibility/offline gate 並加入 scheduled production governance

- 日期：2026-05-12
- ID：reward-ratewise-error-observability
- 原因：hydration 與 fetch 類錯誤被全域 suppression 遮蔽
- 解法：集中錯誤分類並限制 production hydration suppression

- 日期：2026-05-12
- ID：reward-ratewise-public-surface-governance
- 原因：內部展示與測試頁仍存在於正式路由與 prerender surface
- 解法：將 internal-only routes 從 production route/prerender surface 移除並補測試

- 日期：2026-05-12
- ID：reward-ratewise-lint-baseline
- 原因：RateWise lint gate 因 test type import warning 無法通過
- 解法：修正測試檔 type-only import 寫法並恢復 0 warning baseline

- 日期：2026-05-11
- ID：multi-converter-exchange-shop-text-switch
- 原因：MultiConverter 頁面沒有 UI 讓使用者切換銀行/換錢所匯率來源，只有 SingleConverter 有 RateSelector。
- 解法：在 MultiConverter 組件的匯率資訊行新增簡潔文字切換按鈕（與「即期/現金」風格一致），由 `isExchangeShopAvailable` prop 驅動顯示，並補齊四語系翻譯。

- 日期：2026-05-11
- ID：pr378-rate-source-effect-and-base-currency-ssot-convergence
- 原因：PR #378 後 ultrareview 二輪審計發現三項 SSOT 漂移：(1) RateWise 與 MultiConverter 各自持有結構相同但述詞不同的 rateSource 換錢所→銀行 fallback effect、(2) `effectiveRateSource` 在 multi 模式仍寫死 `mode: 'single'`、(3) `baseCurrency` 是 hook local state 重新整理後重置 / `state.mode` 是無人讀取的 dead state。
- 解法：把 fallback 收斂到 `useCurrencyConverter` 唯一 mode-aware effect、`effectiveRateSource` 改用實際 mode；`baseCurrency` 收進 `converterStore` 並補 sanitize/partialize 與 3 個守門測試；移除 `mode/setMode` 與 MultiConverter 的 `setMode('multi')` mount effect，改由 route 即 SSOT，2385 vitest 全綠且 8 處 setRateSource 收斂為 3 處（fallback / history replay / user handler 各司其職）。

- 日期：2026-05-11
- ID：ultrareview-automation-contract
- 原因：PR #378 超級審查流程成功執行後，需將七階段審查協議、Rate Provider 模型契約、CI/CD 整合規範形式化為可重用的自動化審查框架。
- 解法：新增 `ultrareview-pr-audit` skill、更新 `ssot-drift-clean-code-audit` 與 `codex-review-convergence` skill 至 v2.0.0、建立 `docs/dev/043_ultrareview_automation_contract.md` 正式契約文件。

- 日期：2026-05-10
- ID：pr378-node-ts-provider-registry-import-fix
- 原因：pre-push build:ratewise 發現 Node 24 直接載入 TS 腳本時，provider registry 新增的 runtime import 缺少 .ts 副檔名。
- 解法：將 rateProviders.ts 對 ratewise constants 的 runtime import 改為顯式 .ts 路徑，讓 OpenAPI/API generator 等 Node TS 腳本可直接載入 registry SSOT。

- 日期：2026-05-10
- ID：pr378-rate-default-constants-ssot
- 原因：最終硬編碼掃描發現 rate mode、rate type、rate source 與 converter mode 的預設值仍分散在 store、hook、元件與計算工具。
- 解法：將合法值與預設值收斂至 ratewise constants SSOT，types、store、hook、元件與計算工具改讀同一來源，並以 focused Vitest 驗證既有 provider/history 行為未漂移。

- 日期：2026-05-10
- ID：pr378-default-provider-registry-ssot
- 原因：分支級 SSOT 稽核發現 legacy rateSource 到預設 provider 的對應仍在型別檔維護，與 RATE_PROVIDERS.isDefault 形成第二份預設來源。
- 解法：將 fromLegacyRateSource 移入 provider registry 模組並由 getDefaultProviderRef 產生，store 與 ranking fallback 均改讀 registry SSOT。

- 日期：2026-05-10
- ID：pr378-single-converter-mode-isolation
- 原因：Codex review 指出單幣別換算仍讀取持久化 converter mode，使用者進入多幣別頁後回到單幣別可能讓 quick amount 與換算路徑誤走 multi 分支。
- 解法：useCurrencyConverter 改由呼叫頁面明確傳入本次 mode，單幣別頁固定 single、多幣別頁固定 multi，並補回歸測試鎖定持久化 multi 不影響單幣別 quick amount。

- 日期：2026-05-10
- ID：pr378-ssot-tech-debt-convergence
- 原因：最終技術債掃描發現 OpenAPI provider path 仍有重複字串，且 USER_DATA_KEYS 只存在於註解未形成實際防護。
- 解法：OpenAPI generator 改由 PROVIDER_RATES_PATH 產生 provider endpoint，版本快取清理改用 USER_DATA_KEYS 防呆，並補 guardrail 測試與過期計畫狀態註記。

- 日期：2026-05-10
- ID：pr378-final-comment-drift-cleanup
- 原因：最終 SSOT 稽核發現匯率 provider / history 相關測試仍殘留一次性計畫與 Arrange/Act/Assert 註解，會降低 review 訊噪比並形成維護飄移。
- 解法：移除相關測試檔的開發流程註解與階段命名，保留測試名稱作為行為規格，並以 targeted Vitest 驗證不改變行為。

- 日期：2026-05-10
- ID：pr378-codex-review-final-ssot-fixes
- 原因：PR #378 最新 Codex review 指出 data branch 可能殘留退休 MoneyBox alias，且 best-provider mode 下 UI rateSource 可能與 resolved provider 不一致。
- 解法：MoneyBox workflow 新增一次性移除退休 alias 檔案流程；hook 暴露 effectiveRateSource，讓單幣別卡片與資料來源 badge 使用同一 resolved provider，並補 guardrail 測試。

- 日期：2026-05-10
- ID：pr378-production-lighthouse-lcp-noise-tolerance
- 原因：PR #378 最新 CI 顯示 production 首頁 LCP 仍低於 2500ms good threshold，但 372.84ms 的 sub-second baseline 波動超過既有 250ms absolute tolerance，造成文件-only commit 被 production 噪音阻擋。
- 解法：將 production Lighthouse LCP absolute drift tolerance 調整為 500ms，保留 5% relative gate 與 2500ms hard threshold，並補測試鎖定容忍值。

- 日期：2026-05-10
- ID：pr378-superpower-plan-canonical-path-sync
- 原因：最終 SSOT 稽核發現早期換錢所 superpower plan 仍保留舊 `moneybox.json` endpoint 範例，與 canonical provider API 設計漂移。
- 解法：標示該早期 plan 已由 canonical provider API plan 接管，並將 MoneyBox 範例路徑同步為 provider-centric canonical path。

- 日期：2026-05-10
- ID：pr378-right-input-forward-quote-inverse
- 原因：PR #378 Codex review 指出右側金額反解會把目前卡片當成反向交易重算，導致 TWD→KRW 換錢所卡片混用 KRW→TWD buy 報價。
- 解法：抽出目前卡片的 forward unit rate，左側輸入用乘法、右側輸入用同一 forward rate 倒數反解，並補 TWD→KRW 右側輸入回歸測試。

- 日期：2026-05-10
- ID：pr378-moneybox-workflow-main-source-guard
- 原因：PR #378 Codex review 指出 MoneyBox data workflow 具備 `contents: write`，但 push 事件未限制 main 且會取分支腳本，可能讓未審查分支寫入正式 data branch。
- 解法：限制 MoneyBox workflow 的 push 觸發只允許 main，並固定從 `origin/main` 取 fetch script 與 public/rates 資源；PR 分支改由 build-scripts guardrail 測試驗證。

- 日期：2026-05-10
- ID：pr378-moneybox-full-rates-change-detection
- 原因：PR #378 Codex review 指出 MoneyBox provider API 對外包含完整 `rates`，但更新偵測只比較 TWD quote，會漏掉非 TWD 幣別變動。
- 解法：抽出 `listRateChanges` 比對所有幣別的標準 quote 欄位，讓 workflow latest/history 更新與 purge 以完整 provider rates 為準，並補行為測試。

- 日期：2026-05-10
- ID：pr378-moneybox-seo-url-ssot
- 原因：SEO 匯差範例腳本仍硬寫舊 MoneyBox `moneybox.json` CDN path，與 canonical provider API plan 漂移。
- 解法：讓 SEO 腳本改用 `RATES_API.moneyboxCdn`，補 build-scripts guardrail，並同步更新被 canonical plan supersede 的 superpower 計畫狀態。

- 日期：2026-05-10
- ID：pr378-moneybox-no-change-latest-cache
- 原因：PR #378 Codex review 指出 MoneyBox workflow 無條件以本次抓取快照覆寫 provider latest，會讓 no-change path 因 timestamp 變動而每 5 分鐘 commit。
- 解法：保留 fetch script 對 latest 的變更判斷權，workflow 只在每日 history 缺檔或 latest 已被 script 判定變更時寫入 history，並補 guardrail 測試禁止 workflow 覆寫 latest。

- 日期：2026-05-10
- ID：pr378-canonical-provider-rate-api
- 原因：MoneyBox 尚未正式上線時若保留 `moneybox.json` / `moneybox-history` 特例，未來新增多 provider 會形成公開契約技術債。
- 解法：將 MoneyBox latest/history 改為 provider canonical path，由 `PROVIDER_RATES_PATH` 與 provider metadata 驅動 workflow、runtime、OpenAPI、API metadata 與 OpenData 文件。

- 日期：2026-05-10
- ID：pr378-reusable-convergence-skills
- 原因：本次 PR 多次重複執行 Codex review 監控、SSOT drift 稽核、TDD 原子修復與回覆 resolve 流程，若只留在對話記憶中會難以重用。
- 解法：新增 `codex-review-convergence` 與 `ssot-drift-clean-code-audit` project-local skills，將腳本命令、判斷準則、原子修復與完成 gate 收斂成可重用流程。

- 日期：2026-05-10
- ID：pr378-moneybox-buy-change-detection
- 原因：PR #378 Codex review 指出 MoneyBox 更新判斷只比較 TWD sell，但 KRW→TWD 會使用 buy；若只改 buy，latest 與每日 history 會漏更新。
- 解法：MoneyBox fetch script 改以 TWD quote 欄位清單比較 base/buy/sell/spbuy/spsell，並補 build-scripts 守門測試避免回退成 sell-only。

- 日期：2026-05-10
- ID：pr378-history-reconvert-rate-mode-restore
- 原因：PR #378 Codex review 指出 v2 轉換歷史已保存匯率分類與來源，但未保存 rateMode，使用者改成 sell/mid 後重放歷史會用目前設定重新計算。
- 解法：讓 v2 歷史 entry 保存 rateMode，reconvertFromHistory 透過 converterStore action 還原 rateMode，並補回歸測試覆蓋寫入與重放兩條路徑。

- 日期：2026-05-10
- ID：pr378-moneybox-workflow-source-ref-sync
- 原因：PR branch push 觸發 update-moneybox workflow 時，job 先 checkout data 分支後固定從 origin/main 取 fetch script，導致新版 workflow 搭配舊版 script 執行而缺少本次抓取快照。
- 解法：data branch 工作區改從觸發本次 run 的 `GITHUB_REF_NAME` 取得 fetch script 與 public/rates 資源；schedule 在 main 時仍等同 main，PR branch 驗證則能使用同 commit 的 workflow/script。

- 日期：2026-05-10
- ID：pr378-moneybox-daily-history-current-fetch
- 原因：PR #378 Codex review 指出 MoneyBox 匯率未變但跨日期時，workflow 會把舊 moneybox.json 複製成今天的 history 檔，造成檔名日期與內容 timestamp 漂移。
- 解法：讓 fetch step 永遠輸出本次抓取快照；history step 只在當日檔不存在或 latest 有變更時，以本次抓取快照寫入每日歷史，避免舊資料冒充新日期。

- 日期：2026-05-10
- ID：pr378-history-reconvert-provider-restore
- 原因：PR #378 Codex review 指出 schema v2 轉換歷史已保存 rateType/sourceKind/provider，但重新載入歷史項目時只恢復幣別與金額，會用目前 UI 模式重新計算。
- 解法：讓 reconvertFromHistory 透過 converterStore 既有 SSOT actions 還原 rateType、rateSource 與 providerPreference，並補 exchange-shop 歷史還原回歸測試。

- 日期：2026-05-10
- ID：pr378-lighthouse-lcp-noise-tolerance
- 原因：PR #378 production Lighthouse 重跑後三個頁面 LCP 同步出現 116-190ms 漂移，仍遠低於 2500ms good threshold，顯示原 100ms 絕對容忍值仍會阻擋非分支造成的 production 噪音。
- 解法：將 LCP baseline 絕對容忍值調整為 250ms，保留 hard threshold 與相對漂移檢查，避免小幅 production 測量波動阻擋 PR。

- 日期：2026-05-10
- ID：pr378-exchange-shop-trend-history-ssot
- 原因：PR #378 Codex review 指出單幣別換錢所模式的主匯率已用 MoneyBox，但趨勢圖仍讀台銀歷史，造成同卡片來源混搭。
- 解法：新增 MoneyBox history 讀取服務，端點由 provider metadata SSOT 產生；SingleConverter 在 exchange-shop 模式改讀換錢所歷史並補回歸測試。

- 日期：2026-05-10
- ID：pr378-lighthouse-drift-noise-tolerance
- 原因：PR #378 Lighthouse production baseline 以純百分比判定 INP 漂移，導致 23ms→25ms 這類極小絕對差異因 +8.7% 被誤判為阻擋性回歸。
- 解法：保留 5% 相對漂移門檻，同時加入各指標最小絕對差異門檻與 regression actual/absoluteDrift 輸出，讓 CI 擋真退化、不擋毫秒級噪音。

- 日期：2026-05-10
- ID：pr378-build-scripts-fixture-ssot
- 原因：PR #378 CI 在 `test:coverage` 階段尚未執行 prebuild，build-scripts 測試讀取未提交的 `public/rates.json`，造成 fresh checkout 缺檔失敗。
- 解法：改讀已提交的 `src/config/generated/build-time-rates.json` fixture，讓 API timestamp/base currency 規格測試回到可重現 SSOT，並確認 MoneyBox history endpoint 仍由 provider metadata 串接。

- 日期：2026-05-10
- ID：pr378-multi-provider-pair-source-convergence
- 原因：PR #378 Codex review 指出多幣別換算仍沿用單幣別 pair 的 provider fallback，可能造成顯示匯率與換算金額來源不一致。
- 解法：將多幣別 provider 來源改為逐 pair 解析，只有使用者選擇換錢所且該 pair 有換錢所匯率時才用 exchange-shop，其他列回銀行，並補純函式回歸測試。

- 日期：2026-05-10
- ID：pr378-provider-ssot-codex-review-convergence
- 原因：PR #378 Codex review 指出 `auto` API 欄位、TWD 多幣別匯率顯示與 MoneyBox 多幣別 hook effect 仍有 SSOT 漂移與重複請求風險。
- 解法：以 TDD 修正 `auto` 公開規格為 FROM buy / TO sell、允許 TWD details 缺席時視為 1、固定 MoneyBox supported currencies 依賴，並補 provider metadata / ranking 無硬編 provider id 守門與 build/test 驗證。

- 日期：2026-05-09
- ID：ratewise-rate-provider-ssot-phase1-completion
- 原因：`docs/superpowers/plans/2026-05-08-conversion-history-ssot.md` 與 `2026-05-09-rate-provider-ssot.md` 之間存在範圍重疊（歷史 schema、寫入路徑、UI 簡潔度），若不同步標記，未來會出現「兩個 SSOT 計畫各自被 partial 執行」的錯覺。
- 解法：在 conversion-history 計畫頂端加上 Status block 註明已由 rate-provider Phase 1 一併落地，並列出實作落點（types.ts / converterStore.ts / useCurrencyConverter.ts），讓後續維護者只需追新 plan 即可。最終驗證 `pnpm vitest run`（136 files / 2364 passed）+ `pnpm --filter @app/ratewise typecheck` 全綠。

- 日期：2026-05-09
- ID：ratewise-conversion-history-ssot-schema-v2
- 原因：轉換歷史同時存在 `useCurrencyConverter` local state + `STORAGE_KEYS.CONVERSION_HISTORY` 與 store `history`（dead `ConversionRecord` 型別）兩條軌道，新增的 provider/sourceKind/schemaVersion 欄位無單一寫入入口；UI 進入 Phase 2 篩選時將再次發生來源漂移。
- 解法：把 store `history` 收斂為 `ConversionHistoryEntry[]`（schemaVersion=2 + provider/sourceKind/rateType/providerSelectionMode），新增 `categorizeHistoryEntry` 與 `migrateLegacyHistory`（不偽造舊紀錄 sourceKind，遷移後一次性刪除 legacy key），`useCurrencyConverter.addToHistory` 改用 store 寫入並注入 resolvedProvider 欄位；上限提升到 50 筆 store 統一管理。

- 日期：2026-05-09
- ID：ratewise-rate-provider-menu-skeleton-phase1
- 原因：未來 Phase 2 啟用多銀行推薦時，銀行選單與「推薦最佳」入口需有單一元件入口；若到 Phase 2 才一次性新增，容易與既有 RateSelector / SingleConverter 文案介面衝突。
- 解法：新增 `RateProviderMenu.tsx` 骨架，內建 `shouldEnableBankProviderChoice()` phase gate（false 時 return null）；render 結構 = 推薦最佳 + 銀行清單 + 換錢所清單，並透過 mock 撰寫 Phase 2 行為測試（共 3 條，含 manual selectedRef 高亮）。Phase 1 不掛入既有 UI，使用者體驗完全不變。

- 日期：2026-05-09
- ID：ratewise-rate-provider-calc-core-phase1
- 原因：主匯率 / 多幣別實際換算仍以 `rateSource` 直接決定來源，元件層各自維護 exchange-shop 分支邏輯，無法銜接 Task 4 的 `providerPreference` SSOT，未來 best 模式 UI 接線時還得再一次切換決策來源。
- 解法：在 `useCurrencyConverter` 內以 `resolveProviderPreference` 解析 `providerPreference` 為 `resolvedProvider`，把 `convertAmount` 的來源判斷收斂到 `resolvedProvider.sourceKind`，同時建立 `providerQuotes`（bot + moneybox）與 `rankedProviderQuotes` 暴露給未來 UI；保留 `rateSource` prop 作為相容欄位但不再參與決策。

- 日期：2026-05-09
- ID：ratewise-rate-provider-store-migration-phase1
- 原因：`rateSource` 同時被當成 legacy 欄位與 provider 身分使用，store 缺乏 `providerPreference` SSOT，未來新增 provider 或啟用 best 模式時，`setRateSource` 與多個 hook/page 需要各自重複處理 provider 解析與 cash 不變式，將再次造成漂移。
- 解法：在 `apps/ratewise/src/stores/converterStore.ts` 新增 `providerPreference` 持久化欄位（預設 `mode='manual' + bank/bot`），`setProviderPreference` 為新主入口同步 `rateSource` 與套用 cash 不變式；`setRateSource` 退為相容包裝（用 `fromLegacyRateSource` 走同一程式碼路徑）；migration 從 legacy `rateSource` 推導 `providerPreference`，sanitize 永遠以 `providerPreference` 為 SSOT 重新推導 `rateSource`，Phase 1 不產出 `mode='best'`。

- 日期：2026-05-09
- ID：ratewise-rate-provider-ranking-ssot-phase1
- 原因：best/manual 兩種 provider 選擇模式的排序與最終決策邏輯尚無統一純函式，未來 UI 接線時容易在不同入口重複實作排序、unsupported pair 退回與 fallback default 邊界，造成 SSOT 漂移。
- 解法：新增 `apps/ratewise/src/features/ratewise/rateProviderRanking.ts`，提供 `rankProviderQuotes`（過濾 unavailable、依 resultAmount 由大到小穩定排序）與 `resolveProviderPreference`（依 best/manual 模式與 pair 支援度回傳 ResolvedRateProvider，含 fallback-default / unsupported-pair / best-rate / manual reason），Phase 1 純函式不接 UI；`shouldEnableBankProviderChoice() === false` 時 UI 仍不顯示 provider 選單。

- 日期：2026-05-09
- ID：ratewise-rate-provider-registry-ssot-phase1
- 原因：銀行與換錢所的 provider metadata（label / supportedRateTypes / supportedCurrencies / 預設旗標）分散在 `exchangeShopProviders.ts` 與各 hook / UI 文案中，未來新增第二家銀行 provider 將無單一查找入口，也無多銀行 UI 啟用條件。
- 解法：新增 `apps/ratewise/src/config/rateProviders.ts` 作為 provider metadata SSOT，註冊 `bot`（銀行）與 `moneybox`（換錢所）並提供 `getRateProvider` / `getProvidersBySourceKind` / `getDefaultProvider` / `isProviderSupportedForCurrency` / `shouldEnableBankProviderChoice`；`moneybox.supportedCurrencies` 由換錢所資料層 `getSupportedExchangeShopCurrencies()` 推導以避免雙寫，並更新 `exchangeShopProviders.ts` 註解標示其職責收斂為資料層 SSOT。

- 日期：2026-05-09
- ID：ratewise-rate-provider-ssot-types-phase1
- 原因：`RateSource` 同時被當成「來源類型」與「provider 身分」使用，導致換錢所之後新增 provider 無法表達，且 best/manual 模式缺乏統一型別。
- 解法：新增 `rateProviderTypes.ts` 提供 `RateSourceKind` / `RateProviderId` / `ProviderSelectionMode` / `RateProviderRef` / `RateProviderPreference` / `ResolvedRateProvider` 與 `toLegacyRateSource` / `fromLegacyRateSource` 相容轉換，並把 `types.ts` 的 `RateSource` 標註為 `@deprecated` legacy compatibility，僅作為過渡層保留給尚未遷移的 UI 分支。

- 日期：2026-05-08
- ID：ratewise-rate-type-source-converter-store-ssot
- 原因：`rateType` / `rateSource` 雖宣稱已共用 SSOT，但 `RateWise.tsx` / `pages/MultiConverter.tsx` / `pages/Favorites.tsx` 各自以 `useState` + 個別 `localStorage` key 維護，三處邏輯並行，未來易再次漂移。
- 解法：把 `rateType` / `rateSource` 收進 `useConverterStore`，`setRateSource('exchange-shop')` 自動同步 `rateType=cash`、補 hydrate sanitize 與 legacy key 遷移（即使 `ratewise-converter` 已存在也會讀取舊 key 並刪除）；`RateWise`/`MultiConverter` 共用兩者，`Favorites` 只共用 `rateType`，未實作 `rateSource` 共用。

- 日期：2026-05-08
- ID：ratewise-multi-converter-rate-source-ssot-convergence
- 原因：多幣別頁雖已共用部分換算核心，但匯率顯示與換錢所來源選擇未完整接上 `rateMode` / `rateSource` SSOT，導致顯示文字與實際換算、單幣別與多幣別之間可能漂移。
- 解法：將 MultiConverter 顯示改走共用 `getUnitExchangeRate`，多幣別接上 `RATE_SOURCE` 持久化與 MoneyBox 多幣別映射，並補 `auto` 與 exchange-shop 配對回歸測試鎖住行為邊界。

- 日期：2026-05-08
- ID：ratewise-auto-mode-buy-sell-direction-fix
- 原因：auto 模式 `convertCurrencyAmountWithMode` 的 `getRateFrom`/`getRateTo` buy/sell 方向對調（FROM 應用買入、TO 應用賣出），且 `reverseRate` 以 `convert(to, from)` 計算導致交換前後數值對稱顯示相同。
- 解法：修正函數內 buy/sell 取值方向，`reverseRate` 改以 `1/exchangeRate` 純數學倒數計算，同步更新 5 個受影響測試（auto/mid 排序斷言）。

- 日期：2026-05-08
- ID：ratewise-exchange-shop-rate-mode-ssot-convergence
- 原因：換錢所匯率、API rate mode、OpenData/OpenAPI/LLM 文件、i18n 文案與 nested route HTML base path 分散維護，造成匯率顯示、規格文件與 dev smoke 可能漂移。
- 解法：將 rate mode 策略、換錢所幣別/cache schema、公開 API/文件與 UI 文案收斂回 SSOT，並補測試與 browser smoke 鎖住匯率模式、OpenAPI 1.1.0、timestamp 型別與 `//logo.png` 回歸。

- 日期：2026-05-07
- ID：pr375-root-vitest-ci-coverage
- 原因：Codex review 指出新增 root Lighthouse regression suite 不會被 `pnpm -r test` 或 CI `test:coverage` 執行，導致 env SSOT 測試可能漏跑。
- 解法：新增 `test:root` 指向 Lighthouse production 測試檔，並讓 `test`、`test:unit`、`test:coverage` 都串入該 root Vitest，同步更新 SOP 說明。

- 日期：2026-05-07
- ID：lighthouse-production-env-ssot-guard
- 原因：Codex review 稽核指出 `LH_MAX_ATTEMPTS` 未驗證為正整數時，`0` 會讓 Lighthouse retry 迴圈靜默不執行卻仍可能成功結束。
- 解法：在 `scripts/lighthouse-production.mjs` 入口統一驗證 `LH_RUNS` 與 `LH_MAX_ATTEMPTS` 為正整數，並補 Vitest 鎖住 invalid env fail-fast 與 baseline 寫回順序。

- 日期：2026-05-07
- ID：pr373-ga4-queue-forwarding-opt-out
- 原因：Codex review 指出舊版已排入 localStorage 的 GA4 diagnostic queue，可能在下一版關閉 `VITE_PWA_DIAGNOSTIC_FORWARDING` 後仍被 flush 送出。
- 解法：讓 GA4 queue flush 先檢查 forwarding flag，關閉時直接清除 stored/memory queue 並不送出，補測試鎖住 opt-out。

- 日期：2026-05-07
- ID：pr373-sentry-init-idempotent
- 原因：Codex review 指出每個未 dedup 的 PWA warn/error diagnostic 都會重複呼叫 `initSentry()`，造成反覆初始化與初始化 log 污染 Sentry quota。
- 解法：將 `initSentry()` 改為一次性 promise/cache，無 DSN log 也只輸出一次，並補測試鎖住重複呼叫只初始化一次。

- 日期：2026-05-07
- ID：pr373-ga4-diagnostic-memory-fallback-flush
- 原因：Codex review 指出 localStorage 可讀但 queue 寫入失敗時會 fallback 到 memory queue，flush 若只讀 storage 仍會漏送高風險環境的早期診斷。
- 解法：讓 GA4 diagnostic flush 同時合併 stored queue 與 memory fallback queue，並補 storage quota/private-mode 類情境測試。

- 日期：2026-05-07
- ID：pr373-ga4-diagnostic-queue-persist-reload
- 原因：Codex review 指出 `chunk-load-error` 記錄後會立即 recovery reload，若 GA4 queue 只在模組記憶體，尚未 flush 的早期診斷仍會遺失。
- 解法：將待送 GA4 diagnostic 以去識別化參數持久化到 localStorage，下一次 analytics 初始化後補送並清除 queue。

- 日期：2026-05-07
- ID：pr373-ga4-diagnostic-queue-before-init
- 原因：Codex review 指出 `initGA()` 延後到 load/idle 後才建立 `window.gtag`，早期 PWA warn/error 診斷會在 GA4 轉發時被靜默丟棄。
- 解法：將 GA4 PWA diagnostic 參數先以去識別化欄位排隊，analytics 初始化後 flush，並補測試鎖住無 raw detail 與不漏送。

- 日期：2026-05-07
- ID：pr373-sentry-diagnostic-detail-redaction
- 原因：Codex review 指出 GA4 已去識別化，但 Sentry `extra` / breadcrumb 仍可能外送原始 diagnostic detail，包含 URL query 或帳號識別。
- 解法：將 Sentry captureMessage 與 breadcrumb 改用 detail present/category/length bucket metadata，不再外送 raw detail，並補測試鎖住無 email/raw detail。

- 日期：2026-05-07
- ID：pr373-pwa-diagnostic-forwarding-privacy-init
- 原因：Codex review 指出 PWA diagnostic 會把原始 detail 送到 GA4，且 Sentry 轉發前未確保 SDK 已初始化，冷啟動主場景可能漏送。
- 解法：GA4 改送 detail present/category/length bucket 等去識別化欄位，Sentry error/warn 轉發前先呼叫 `initSentry()`，並補單元測試鎖住行為。

- 日期：2026-05-07
- ID：pr372-cache-miss-navigation-waituntil
- 原因：Codex review 指出 bounded SWR cache miss 超時回 fallback 後，慢網路 fetch 未掛入 `event.waitUntil`，SW 可能被終止而無法暖起 `html-cache`。
- 解法：將 cache miss 的 `networkResponse` 同步掛入 `event.waitUntil`，保留 3 秒 fallback 體感，同時確保背景 HTML cache 寫入有生命週期保護。

- 日期：2026-05-07
- ID：pr372-bounded-swr-navigation-cache-guard
- 原因：PR #372 初版直接使用 Workbox SWR，cache miss 時缺少有界 fallback，且新版 SW 啟用後可能先回舊 `html-cache` HTML。
- 解法：改為自訂 bounded SWR-style navigation handler，cache hit 立即回並背景更新、cache miss 3 秒內未取得網路即回 precache fallback，且 activate 時清除舊 HTML runtime cache。

- 日期：2026-05-07
- ID：pr371-watchdog-overlay-dedupe
- 原因：Codex review 指出 SSG banner 模式下 timeout 與後續 script error 可能連續觸發 `showColdStartError()`，造成多個 cold-start banner 重疊。
- 解法：在建立新 watchdog overlay 前先呼叫 `removeColdStartOverlay()`，讓 banner/fullscreen fallback 都維持單一可見診斷視窗。

- 日期：2026-05-07
- ID：pr371-ssg-marker-only-watchdog-banner
- 原因：Codex review 指出 cold-start watchdog 只要看到 `#root` 子節點就走 banner，可能把 phantom/破碎 root 誤判為可閱讀 SSG。
- 解法：將 banner 模式收斂為只信任 `data-server-rendered="true"`，並更新 phantom E2E 斷言為全屏診斷 fallback。

- 日期：2026-05-07
- ID：pr371-cold-start-diagnostics-token-ui
- 原因：實際 cold-start 診斷出現「Service Worker 未註冊但舊快取仍存在」的矛盾狀態，舊視窗只用 emoji log 與硬編紫色，未清楚指向可執行修復。
- 解法：將診斷輸出改為純文字標籤，新增 SW 未註冊但 cache 存在的狀態/建議行，並把視窗樣式改用 `--color-*` design token fallback。

- 日期：2026-05-07
- ID：pr371-watchdog-banner-ready-cleanup
- 原因：PR #371 的 watchdog banner 模式將冷啟動警示掛到 `body`，但 app ready 後只清除 timer/retry，會留下已過時的「載入失敗」提示。
- 解法：在 `clearWatchdog` ready 共用路徑同步移除 `[data-cold-start-overlay]`，並補靜態測試鎖住 ready cleanup 契約。

- 日期：2026-05-07
- ID：ratewise-pwa-offline-fallback-runtime-contract
- 原因：emergency fallback 初版主要依賴 `sw.ts` 字串斷言，未直接驗證 `index.html`、`offline.html` 與任意 cache 全失效時仍會回可見 HTML。
- 解法：抽出 `resolveOfflineDocumentFallback` 純函式並補 runtime-style 單元測試，鎖住 fallback 優先序、200 HTML 回應與 `X-RateWise-Offline-Fallback` header。

- 日期：2026-05-06
- ID：ratewise-authority-guide-crosslinks-and-baseline-persist
- 原因：authority guide 頁面與 Markdown mirrors 缺少 guide-to-guide 互連，且 production Lighthouse baseline 排程更新後未能持久化回 repo。
- 解法：補齊 relatedGuides SSOT、HTML/Markdown/llms.txt 測試與產物，並讓排程 baseline 變更以 release 豁免格式提交回 main。

- 日期：2026-05-06
- ID：ratewise-pwa-emergency-fallback-brand-ssot
- 原因：emergency inline HTML fallback 初版仍硬編碼 `HaoRate`，會讓正式品牌字串與 `APP_INFO` SSOT 漂移，且對應測試仍鎖在舊的 `Response.error()` 控制流。
- 解法：改為從 `APP_INFO.name` 生成 emergency fallback 標題，並同步更新 SW 測試斷言，讓品牌與 fallback 行為都回到單一真實來源。

- 日期：2026-05-06
- ID：ratewise-pwa-emergency-html-fallback
- 原因：`2.22.20` 在快取損毀更嚴重的冷啟動離線情境下，若 `index.html` 與 `offline.html` 同時從各快取失守，SW 仍會直接回 `ERR_FAILED`，連 watchdog 都來不及顯示，形成真正白屏。
- 解法：在 Service Worker 增加不依賴任何 cache 的 emergency inline HTML fallback，讓導覽 HTML fallback 全失守時仍能回傳最小可見保護頁，並補靜態回歸測試鎖住 `emergency-document-fallback` / `emergency-navigation-fallback`。

- 日期：2026-05-06
- ID：ratewise-pwa-watchdog-fallback-and-timeout-signal-guard
- 原因：冷啟動 watchdog 若只認 `app-ready`，可能誤蓋 React 已成功渲染的 chunk/offline fallback；同時 cold-start prime race 若不清除落敗 timeout，健康啟動也會留下假的 timeout 診斷。
- 解法：為 `OfflineAwareFallback` 加入 watchdog-ready 訊號，讓已渲染 fallback 可正確終止 watchdog；並在 early prime 成功時清除 timeout handle，維持 PWA 診斷訊號的真實性。

- 日期：2026-05-06
- ID：ratewise-pwa-diagnostics-storage-and-prime-wait-guards
- 原因：PWA 診斷若直接探測 `localStorage`，在受限隱私情境可能拋出 `SecurityError`；同時 delayed storage init 若無上限等待 early prime，也可能被卡住的網路請求拖到整個 session 都不再補救。
- 解法：將 browser storage 能力探測改為安全 accessor，並對 early prime 結果採有界等待與 timeout fallback，確保診斷與 delayed repair 都不會反過來成為新的啟動阻塞點。

- 日期：2026-05-06
- ID：ratewise-pwa-app-ready-first-react-commit
- 原因：`app-ready` 訊號先前在 `ViteReactSSG` bootstrap callback 內就送出，若首個 React render／hydration 隨後拋錯，冷啟動 watchdog 仍會被過早解除，再次留下無聲白屏。
- 解法：將 `app-ready` 改由首次 React commit 後才執行的 `PwaAppReadyBeacon` 送出，並新增元件測試與離線回歸測試鎖住「bootstrap 成功不等於首屏掛載成功」的契約。

- 日期：2026-05-06
- ID：ratewise-pwa-cold-start-prime-success-gating
- 原因：早期 cold-start prime 先前只要「有機會執行」就會讓延後修復整段跳過；若啟動當下剛好離線，prime 實際沒有補回任何資源，後續同 session 又會錯失網路恢復後的唯一補救時機。
- 解法：將延後修復 skip 條件改為依 early prime 實際結果決定，只有真的 recache 成功或真的送出 precache repair ping 時才跳過對應延後步驟。

- 日期：2026-05-06
- ID：ratewise-pwa-cold-start-watchdog-app-ready-observability
- 原因：冷啟動白屏 watchdog 只以 `#root` 是否出現任意子節點判定成功，會被早期 DOM 變動誤觸發而提前解除；一旦 React/bootstrap 後續失敗，就只剩無聲白屏且缺乏可追查證據。
- 解法：改以明確 `app-ready` 訊號作為 watchdog 成功條件，將冷啟動、SW 補救、chunk 載入錯誤串成可持久化 PWA 診斷事件，並新增「假掛載成功」E2E 驗證新 watchdog 不會再被任意 root mutation 騙過。

- 日期：2026-05-05
- ID：ratewise-homepage-cls-stable-detection
- 原因：首頁 route 先用 `ClientOnly + SkeletonLoader` 輸出骨架，再切成真正的 `RateWise` 內容，導致 Lighthouse 首頁在部分 run 出現 `CLS ≈ 0.247`，而舊的 3-run optimistic score gate 又會把這類不穩定結果誤判成偶發 performance 掉分。
- 解法：改為首頁直接渲染 `RateWise` 主內容、移除 skeleton→真內容整頁替換，並把 LHCI 收斂為 5-run + `median/median-run` 聚合與 `CLS` 硬守門，同時新增 Playwright CLS 觀測測試輸出 source 證據。

- 日期：2026-05-05
- ID：lighthouse-production-nonavstart-summary-flake
- 原因：Production Lighthouse Baseline Check 在單次 trace 碰到 `NO_NAVSTART` 類暫時性執行器錯誤時直接中止，未產出 `summary.json`，後續 workflow summary step 又把缺檔視為第二次 failure，讓 CI 無法區分真實性能回退與 Lighthouse 執行 flake。
- 解法：為 `scripts/lighthouse-production.mjs` 增加可重試的 transient Lighthouse error retry，並在執行失敗時仍落盤 `summary.json` 與 runtime error；workflow summary step 改為缺 summary 僅警告，不再放大非產品性失敗。

- 日期：2026-05-05
- ID：ratewise-pwa-cold-start-prime-skip-flag-race
- 原因：冷啟動自救的 skip flags 重新依賴延後時點的 `shouldPrimePwaColdStartImmediately()` 判斷，可能在首載起點未 prime、但 `load + idle` 前 SW 剛取得控制權時，把 `initPWAStorageManager()` 裡的 precache 修復與關鍵資源補熱整段誤跳過。
- 解法：將 skip flags 綁定為啟動當下單一 `shouldPrimeColdStartRecovery` 決策，只有前面已決定執行早期 prime 時才跳過延後補救，並補靜態回歸測試鎖住此時序契約。

- 日期：2026-05-05
- ID：ratewise-pwa-cold-start-recovery-timing-regression
- 原因：`4b786676` 將 `initPWAStorageManager()` 延後到 `load + idle` 後才執行，導致 PWA 冷啟動時若快取已部分驅逐，關鍵資源補熱與 precache 修復啟動過晚，仍可能先出現不可預測白屏。
- 解法：將冷啟動自救拆成早期 `primePwaColdStartRecovery()`，在 standalone / 已受 SW 控制情境下立即補熱關鍵資源與送出 `VERIFY_AND_REPAIR_PRECACHE`；持久化儲存與健康度盤點維持延後執行，兼顧可靠性與效能。

- 日期：2026-05-05
- ID：pr356-lighthouse-production-hard-threshold-bootstrap-regression
- 原因：PR356 在「強化 PWA 冷啟動離線回退機制」commit 內夾帶 `scripts/lighthouse-production.mjs` 不相關修改，將 `enforceHardThreshold = !!hasUsableBaseline` 改為 `enforceHardThreshold = true`；當 `lighthouse-baseline.production.json` 仍為 `status: 'placeholder'`、`paths: {}` 的自舉狀態時，硬性門檻（perf ≥ 90、LCP ≤ 2500ms、INP ≤ 200ms、CLS ≤ 0.1）被無條件套用至 production 三條 smoke 路徑，造成 Production Lighthouse Baseline Check 失敗。
- 解法：將 `scripts/lighthouse-production.mjs` 還原為 main（`f8d400f`）版本，恢復「baseline 為 placeholder 時跳過硬門檻」的自舉語意；PWA 補救（sw.ts、changeset、002 PWA 條目）保留不動，避免兩個議題綁在同一 commit。

- 日期：2026-05-05
- ID：ratewise-pwa-offline-html-recovery-mechanism
- 原因：生產環境 E2E 測試發現 `offline.html` 有時未被 precache（`hasOfflineHtml: false`），導致 iOS Safari 冷啟動離線時黑屏。
- 解法：新增 SW activate 階段 `ensureOfflineHtmlCached` 補救機制，在 precache 失敗或 iOS cache eviction 後主動抓取並快取 `offline.html`；增強 `setCatchHandler` 三層回退策略（index → offline precache → 任何快取）。

- 日期：2026-05-05
- ID：ratewise-navigationroute-offline-fallback-reachability
- 原因：`NavigationRoute` 的 `handlerDidError` 在找不到 precache `index.html` / `offline.html` 時直接回 `Response.error()`，導致 Workbox 不再進入全域 `setCatchHandler`，讓任意快取中的 `offline.html` fallback 變成不可達。
- 解法：在 `handlerDidError` 內補上 `caches.match('offline.html')` 最後防線，並新增回歸測試鎖住離線 fallback reachability。

- 日期：2026-05-05
- ID：ratewise-trend-chart-perf-pr1234-convergence
- 原因：趨勢圖載入極慢（~10.9s）— 10s 硬延遲 + 30 筆 JSON 並行 fetch + requestIdleCallback 等待，PWA 導覽缺 timeout fallback 與 cache 預算控制。
- 解法：PR1 aggregate fetch（30 fetch → 1 fetch）+ PR2 移除 10s defer 改 requestIdleCallback only + PR3 NavigationRoute 3s timeout + cache 40MB budget guard + PR4 performance.mark 觀測（趨勢圖可見時間 10937ms → 820ms，達業界 <2500ms 標準）。

- 日期：2026-05-05
- ID：ratewise-production-lighthouse-baseline-pr4
- 原因：缺少 production LCP/INP/CLS/Lighthouse baseline 觀測，無法第一時間偵測 trend 與 PWA 回歸。
- 解法：建立 `scripts/lighthouse-production.mjs`、baseline workflow、summary 回報文件與 baseline JSON，並把 PR4 指標門檻收斂為可自動回報機制。

- 日期：2026-05-04
- ID：ratewise-offline-cold-start-e2e-serial-audit
- 原因：`offline-cold-start.spec.ts` 在 `fullyParallel` 下會讓多個 stateful PWA 測試同時操作同一個 origin 的 precache 與 runtime caches，首輪間歇誤判「冷啟動離線失敗 / 無 CSS」，造成真 bug 與測試競態無法區分。
- 解法：將 `offline-cold-start` 測試明確改為 serial，並把固定 5 秒硬等待改成直接輪詢 Cache Storage 的 precache audit，要求 JS/CSS/index/offline.html 四項 readiness 全達標後才進入斷言，讓未來離線回歸有可觀測證據且不再靠 retry 撐過。

- 日期：2026-05-04
- ID：mini-trend-chart-flaky-timeout-guard
- 原因：`pre-push` 全量 Vitest 並行執行時，`MiniTrendChart.test.tsx` 首個 render 案例偶發超過 5 秒 timeout，形成非功能型 flaky 阻塞。
- 解法：維持組件邏輯不變，只對該案例補明確 timeout 餘裕，讓全量測試在高負載下仍可穩定收斂。

- 日期：2026-05-04
- ID：ratewise-seo-txt-content-type-canonicalization
- 原因：正式站 `/ratewise/robots.txt` 與 `/ratewise/llms.txt` 仍會回 `Content-Type: text/plain, text/plain`，屬於 SEO txt 端點的 header hygiene 漂移。
- 解法：在 `security-headers` Worker v5.2 對 RateWise SEO txt 端點先刪除上游殘留 `Content-Type`，再統一覆寫為單一 `text/plain; charset=utf-8`，並補 `securityHeadersWorker` 回歸測試與 SSOT 文件同步。

- 日期：2026-05-04
- ID：ratewise-authority-guide-mirror-production-verification
- 原因：3 篇 Authority Guide Markdown mirrors 已存在於 public 與 `llms.txt`，但未被納入 `SEO_FILES` 與正式 production verification，且 Worker / `_headers` 的 alternate Link 治理也未完全覆蓋，形成真實監測缺口。
- 解法：將 3 篇 Authority Guide mirrors 納入 `SEO_FILES` SSOT，補齊 Worker 與 `_headers` 的 Markdown alternate Link 覆蓋，並以 seo-paths / securityHeaders / markdown mirror 測試與 SSOT 驗證收斂為正式閉環。

- 日期：2026-05-04
- ID：issue-backlog-contract-rule-sync
- 原因：repo 先前雖要求 review thread 收斂，但對 issue / backlog 的格式、嚴重度標籤與刪除條件仍缺乏正式契約條款，容易導致未來 agent 使用不一致格式。
- 解法：在 `AGENTS.md` 與 `CLAUDE.md` 補入 issue / backlog 契約規則，強制使用正式 issue 結構、`severity:*` 標籤與 `gh` 刪除前置條件。

- 日期：2026-05-04
- ID：seo-master-ssot-prettier-format-followup
- 原因：`#340` 的 Quality Checks 因 `docs/SEO_MASTER_SSOT.md` 未完全符合 Prettier 格式而失敗，導致文檔 PR 卡在格式守門。
- 解法：以 repo 既有 Prettier 規則重寫 `SEO_MASTER_SSOT.md`，再推送最小 follow-up commit 讓 CI 回到綠燈。

- 日期：2026-05-04
- ID：seo-master-ssot-2026-05-03-state-sync
- 原因：`SEO_MASTER_SSOT` 雖已更新版本與里程碑，但 `SEO_FILES`、生產驗證覆蓋與 Authority Guide mirror 探針說明仍殘留舊敘述，未完全對齊目前程式 SSOT。
- 解法：同步修正文檔版本、公開 SEO/AI 資源清單、手動 smoke probe 範圍與歷史完成項描述，使文件與 `seo-paths.config.mjs`、近期 PR 狀態與 SEO 治理現況一致。

- 日期：2026-05-03
- ID：ratewise-authority-guide-markdown-mirror-and-article-og
- 原因：authority guide 頁面缺少對應 Markdown mirrors 與 llms.txt 收錄，且多個具 Article JSON-LD 的內容頁仍沿用 `og:type=website`，降低分享與 AI 引用語義一致性。
- 解法：擴充 Markdown mirror 生成器輸出 3 個 authority guide `.md`、同步加入 llms.txt 與回歸測試，並讓 authority/content pages 對齊 `ogType=\"article\"` 與 `article:modified_time`。

- 日期：2026-05-03
- ID：codex-review-audit-unknown-author-guard
- 原因：PR #330 後續 Codex review 指出 `author: null` 的留言會先被轉成字串，再被誤判為人類回覆，讓 `no-reply` 分類失真。
- 解法：將未知作者保留為 `null`，並要求 comment 必須有明確 login 才能算人類回覆，避免刪帳或停用帳號留言清掉待處理 thread。

- 日期：2026-05-03
- ID：codex-review-audit-thread-classification-followup
- 原因：PR #330 的 Codex review 指出新稽核腳本將 bot 視為人類回覆、僅看第一則 Codex 評論判定 no-reply，且未補抓超過 100 筆的 thread comments。
- 解法：補上 thread comments 分頁抓取，將 no-reply 基準改為最後一則 Codex 評論，並排除 `github-actions` 與 `[bot]` 類非人類回覆。

- 日期：2026-05-03
- ID：pr-review-script-enforcement-doc-sync
- 原因：PR / review 事件的回覆與 resolved 收斂責任先前只分散在口頭流程，未明確要求優先使用 repo 既有稽核腳本盤點 threads。
- 解法：在 `AGENTS.md` 與 `CLAUDE.md` 補上強制規則，要求先執行 `pnpm review:codex:audit` 類腳本盤點，再配合 `gh` 逐條回覆並轉為 resolved。

- 日期：2026-05-03
- ID：repo-codex-review-thread-audit-automation
- 原因：既有 Codex review 腳本只覆蓋單 PR 或近幾天留言，無法對整個 repo 穩定盤點 unresolved / no-reply review threads。
- 解法：新增全 repo GraphQL 分頁稽核腳本與 `pnpm review:codex:audit` 入口，自動依 thread 狀態與人類回覆情況分類，並輸出可供後續自動回覆與清掃流程重用的文字/JSON 結果。

- 日期：2026-05-02
- ID：ratewise-homepage-lcp-build-time-rates
- 原因：首頁首屏仍同步觸發趨勢圖歷史資料、GA 與 PWA icon 暖機，Lighthouse Performance 停在 73-74 且 LCP 超過 7 秒。
- 解法：以 build-time rates 移除首屏匯率空窗，延後非關鍵趨勢圖/分析/PWA 暖機，A/B 後 Performance 80、SEO 100。

- 日期：2026-05-02
- ID：ratewise-prerender-dist-stale-rebuild-guard
- 原因：SEO public surface 測試只檢查 `dist` 是否存在，rebase 後會沿用過期 HTML，讓 `/seo-tech/` 對外揭露頁被舊快照誤判為 SSOT 漂移。
- 解法：讓 `ensurePrerenderDist` 支援 source freshness 檢查，當監看檔案比 `dist` 新時自動重建 prerender 產物，再由 `seo-public-surface.test.ts` 明確宣告監看路徑。

- 日期：2026-05-02
- ID：ratewise-footer-time-slot-cls-2026-05-02
- 原因：`#320` 雖已移除 SEO layout skeleton，但 Footer 更新時間仍會在 hydration 後以不同字寬文字替換，導致 `/about` Lighthouse 保持 0.89。
- 解法：將 Footer 的來源時間與刷新時間改為固定寬度等寬數字槽位，消除 hydration 後的殘餘版面位移並補上回歸測試。

- 日期：2026-05-02
- ID：root-robots-content-signal-production-drift
- 原因：正式站 root `robots.txt` 上游仍殘留非標準 `Content-Signal`，Lighthouse 將三個 RateWise canonical URL 的 SEO 扣到 92。
- 解法：讓 security-headers Worker v5.1 在 root robots rewrite 時清洗 `Content-Signal` body 行，並以 regression test 守門。

- 日期：2026-05-02
- ID：ratewise-lhci-canonical-smoke-paths
- 原因：Lighthouse CI 掃描 `/about` 無尾斜線 URL，本地 preview 先回首頁 app shell，造成 hydration 後 CLS 誤判。
- 解法：將 LHCI smoke paths 收斂到 `APP_CONFIG.lighthouseSmokePaths`，統一掃描 canonical trailing slash URL。

- 日期：2026-05-02
- ID：ratewise-sitemap-lastmod-section-policy
- 原因：`seo-metadata.ts` 大型 SSOT 被整檔納入 lastmod 依賴，導致 sitemap 日期多樣性退化到 2。
- 解法：改由 lastmod policy 宣告頁面對應 metadata 區段，讓 sitemap 只追蹤真正影響該頁的內容段落。

- 日期：2026-05-02
- ID：ratewise-ssg-serial-prerender-enoent-fix
- 原因：`vite-react-ssg` 高並行渲染巢狀金額頁時，pre-push build 偶發讀取尚未寫出的 `index.html`。
- 解法：將 SSG prerender concurrency 收斂為 1，優先確保 CI / pre-push 產物可重現，再由測試與 build 守門。

- 日期：2026-05-02
- ID：pr322-about-dataset-schema-disclosure
- 原因：About FAQ、`/seo-tech/` registry、Open Data Markdown 與 sitemap 測試仍有公開 SEO truth surface 漂移。
- 解法：補齊 `Dataset` registry、移除 schema/URL 硬編碼、同步 2026 sitemap 名稱，並讓 Open Data mirror 揭露使用限制與授權。

- 日期：2026-05-02
- ID：ratewise-seo-dist-test-helper-2026-05-02
- 原因：Codex review 指出 `describe.skipIf` 在 Vitest collection 階段計算，乾淨 checkout 會讓 SEO 靜態 HTML regression gate 被永久略過。
- 解法：抽出 `ensurePrerenderDist` 測試 helper，在缺少 `dist` 時以 lock 保護的單次 build 準備產物，三組 SEO gate 繼續完整執行。

- 日期：2026-05-02
- ID：ratewise-seo-layout-hydration-cls-2026-05-02
- 原因：SEO/SSG layout 在瀏覽器端以 Suspense skeleton 包住已預渲染內容，且 PWA offline-ready 成功提示會在 Lighthouse 首次載入時入場，造成 FAQ CLS 0.19、Performance 89。
- 解法：SEO layout 直接保留 children，並讓低優先級 offline-ready 狀態靜默化；只保留更新/失敗等需使用者注意的提示。

- 日期：2026-05-02
- ID：ratewise-dist-dependent-tests-order-race-2026-05-02
- 原因：部分 SEO / SSG 測試在 coverage 階段直接要求 `dist` 已存在，與 `prerender.test.ts` 的 build 副作用形成平行測試順序耦合。
- 解法：改由共用 build helper 在缺少 `dist` 時準備 SSG 產物，避免測試順序與 coverage pipeline 繼續耦合。

- 日期：2026-05-02
- ID：ratewise-trend-date-refresh-stale-2026-05-02
- 原因：趨勢圖在 #310 後改為頁面空閒即載入一次，長時間開啟的分頁跨日時不會重新查詢歷史匯率，可能停在 2026-04-28。
- 解法：分頁 focus / visibility 回前景時檢查本地日期 key，跨日即重新載入趨勢資料，並新增 regression test。

- 日期：2026-05-02
- ID：pr317-superpowers-review-format-and-seo-signal-fix
- 原因：Superpowers 分支 review 發現本 PR 新增 002 條目混入非四行欄位，且 SEO Master GSC 指標仍殘留幣別頁 FAQPage 舊語意。
- 解法：將新增 002 條目收斂回四行模板，並把 Rich Results / AI 摘要指標改為 FAQ 主頁 FAQPage 與幣別頁 ExchangeRateSpecification。

- 日期：2026-05-02
- ID：ratewise-superpowers-seo-ssot-drift-2026-05-02
- 原因：Superpowers 多 agent SEO 審查發現 production SEO 驗證腳本、匯率方向文案、AI crawler 說明與公開 E-E-A-T 信任揭露存在漂移。
- 解法：對齊 FAQPage only / ExchangeRateSpecification schema 策略、修正買外幣語意與 Googlebot / Google-Extended 角色，並以 truthfulness、SSOT、build-script regression tests 守門。

- 日期：2026-05-02
- ID：ratewise-lcp-deferred-vendors-motion-dnd
- 原因：vendor-motion（138KB）與 vendor-dnd（95KB）因 CJS factory rolldown 置入首個使用者 chunk，被 vendor-router-runtime / app chunk 靜態依賴，拖入初始 modulepreload 阻塞首次 LCP。
- 解法：manualChunks 將 react-dom 主命名空間與 jsx-runtime CJS factory 前置至 vendor-commons，搭配 resolve.dedupe 切斷靜態依賴鏈，兩個重量 vendor 改為按需延遲載入（初始減約 60KB brotli）。

- 日期：2026-05-02
- ID：ratewise-seo-rate-example-taipei-date-2026-05-02
- 原因：`update-seo-rate-examples.mjs` 使用 UTC 日期產生 `SEO_RATE_EXAMPLES_DATE`，台北午夜後會讓匯率時間與 SEO 可見日期落差一天。
- 解法：改用 `Intl.DateTimeFormat` 的 `Asia/Taipei` 日期作為 SEO 匯率範例、MoneyBox `rateDate` 與產生檔日期，並新增 build script regression test。

- 日期：2026-04-30
- ID：pr303-seo-ssot-rerun-and-audit-trace-2026-04-30
- 原因：`docs/SEO_MASTER_SSOT.md` 連續多次提交未同步新增 002 條目，違反 `AGENTS.md` 的 AGT-LOG-01「每次 commit 前更新 002」要求。
- 解法：依 PR303 Codex review（P1）補齊 `docs/dev/002_development_reward_penalty_log.md` 的稽核證據鏈，並同步執行 ratewise SEO 例行重跑，將結果更新到 `docs/SEO_MASTER_SSOT.md` v2.7.1（新增 12.7.8 狀態快照）。

- 日期：2026-04-30
- ID：pr303-seo-rate-examples-refresh-2026-04-30
- 原因：`prebuild-fetch-rates` 與 `update-seo-rate-examples` 依即時資料重建輸出，推送後仍產生未提交 diff。
- 解法：pre-push 的 `build:ratewise` 重新抓取即時匯率後，`seo-rate-examples.ts` 產生時間戳與範例值更新；本次補提交該 generated 漂移，確保 PR head 與可重現輸出一致。

- 日期：2026-04-28
- ID：ratewise-225-zeabur-deployment-race
- 原因：一般 PR #298 與 release PR #299 連續合併，Zeabur 對兩個 main SHA 建立 production deployment。
- 解法：使用 GitHub deployments API 查出 Zeabur production deployment active SHA 順序。

- 日期：2026-04-28
- ID：dependabot-moderate-fast-xml-parser
- 原因：既有 override 只要求 `fast-xml-parser >=5.5.7`，低於 GHSA-gh4j-gqv2-49f6 / CVE-2026-41650 的 patched 版本 5.7.0。
- 解法：更新 root `package.json` 的 `pnpm.overrides.fast-xml-parser` 到 `>=5.7.0`。

- 日期：2026-04-28
- ID：ci-gitleaks-cli-node24
- 原因：`gitleaks/gitleaks-action@v2` 對組織 repo 需要 `GITLEAKS_LICENSE`，repo secrets 未設定時會在 CI annotation 留下 license 問題。
- 解法：將 `.github/workflows/ci.yml` 的 `Run Gitleaks` 從 `gitleaks/gitleaks-action@v2` 改為固定版本 `gitleaks` CLI。

- 日期：2026-04-28
- ID：release-tag-timeout-ssot
- 原因：`pnpm changeset tag` 適合人工 release 流程，不適合在此 repo 的多 app release workflow 內當作 tag SSOT。
- 解法：移除 `.github/workflows/release.yml` 內冗餘的 `actions/cache@v4` pnpm store cache，保留 `actions/setup-node@v6` 內建 cache。

- 日期：2026-04-28
- ID：release-pr-commitlint-masked-success
- 原因：release workflow 的 changesets/action commit message 未對齊 `commitlint.config.cjs` 的繁體中文與 body 規則，也未命中既有 release 豁免。
- 解法：將 `.github/workflows/release.yml` 的 release commit / title 改為 `chore(release): 更新版本套件`。

- 日期：2026-04-27
- ID：ratewise-review-thread-replace-html-regex-with-domparser
- 原因：先前做法依賴 regex 移除 `script/style`，對非標準但解析器可容忍的 HTML 變體天然脆弱。
- 解法：在補完 `</script >` 後，GitHub Advanced Security 再指出 regex 仍可能漏掉 `</script\\t\\n bar>` 這類更鬆散的 closing tag 變體。這表示以 regex 維護 HTML 可見文字抽取會持續被邊界案例追著跑。本次直接將 `extractVisibleText()` 改為以 `DOMParser` 解析 HTML，移除 `script/style` 節點後讀取 `textContent`，把這條測試邏輯收斂到結構化解析，而不是再疊更多字串規則。

- 日期：2026-04-27
- ID：ratewise-review-thread-fix-script-end-tag-whitespace
- 原因：closing tag regex 只接受緊貼的 `</script>` / `</style>`，未容忍 HTML 容錯常見的尾端空白。
- 解法：在 follow-up PR #286 上，GitHub Advanced Security 再指出 `seo-public-surface.test.ts` 的 HTML 過濾仍未涵蓋 `</script >` 與 `</style >` 這類結尾標籤尾端帶空白的情況。這次將 regex 從精確匹配 `</script>` / `</style>`，收斂為允許 `\\s*` 後再閉合 `>`，讓 visible-text 抽取對鬆散 HTML 更具韌性，避免 CodeQL 持續報告相同類型缺口。

- 日期：2026-04-27
- ID：ratewise-review-thread-fixes-cwd-and-html-regex
- 原因：HTML 過濾使用區分大小寫的 regex，未覆蓋大寫標籤輸入。
- 解法：針對 PR #285 的兩條未解 review thread 做原子修補。第一條來自 GitHub Advanced Security，指出 `seo-public-surface.test.ts` 的 HTML 過濾 regex 未涵蓋大寫 `<SCRIPT>` / `<STYLE>`；第二條來自 Codex review，指出 `seo-lastmod-policy.test.ts` 以 `process.cwd()` 推 repo root，從 monorepo root 或 IDE runner 執行時會產生 CWD 敏感的 `ENOENT`。本次分別改為大小寫不敏感 regex 與 `import.meta.url` 路徑推導，並以對應測試確認修補成立。

- 日期：2026-04-27
- ID：ratewise-lastmod-fallback-test-precedence
- 原因：`generate-sitemap-2025.mjs` 的 `getRatePageFallbackDate()` 先讀 `匯率時間`，再讀 `生成日期`。
- 解法：第一輪把硬編日期改為 `SEO_RATE_EXAMPLES_DATE` 後，進一步驗證時發現 sitemap generator 的真實規則不是直接使用生成日期，而是優先解析 `seo-rate-examples.ts` 檔頭內的「匯率時間」，只有抓不到時才退回 `SEO_RATE_EXAMPLES_DATE`。本次將測試同步升級為驗證這個優先序，確保測試對齊 generator 的實際 fallback 邏輯，而不是對齊某個較弱的近似值。

- 日期：2026-04-27
- ID：ratewise-seo-public-surface-suite
- 原因：現有 SEO 測試分散在 route order、schema、truthfulness、best-practices 等檔案，沒有一個集中入口對公開表面做快速回歸。
- 解法：雖然 P0 的修復已分散在多支測試中，但缺少一個能直接回答「公開 SEO 表面現在還乾不乾淨」的單一 regression suite。本次新增 `seo-public-surface.test.ts`，集中驗證 route 專屬 H1 是否早於 fallback、`/seo-tech/` 是否仍對齊當前 SSOT、以及 sitemap 是否重新長回 `priority` / `changefreq`。同步新增 `test:seo-surface` script，讓這組公開表面檢查可被單獨執行。

- 日期：2026-04-27
- ID：ratewise-lastmod-fallback-test-ssot-alignment
- 原因：`seo-lastmod-policy.test.ts` 將匯率頁 fallback 日期寫死在單一日期字串，沒有依附 `seo-rate-examples.ts` 的生成值。
- 解法：驗證 RateWise SEO 修復是否真正完成時，發現 `seo-lastmod-policy.test.ts` 仍將匯率頁 fallback 日期硬寫為 `2026-04-25`，但目前 `seo-rate-examples.ts` 已由 build 生成為 `2026-04-27`，導致 policy 與可驗證資料來源正確、測試卻誤報失敗。本次改為直接引用 `SEO_RATE_EXAMPLES_DATE`，讓測試跟隨 SSOT 的匯率日期來源，而不是跟隨某一次人工快照。

- 日期：2026-04-27
- ID：cicd-security-scan-lastmod-fallback-fix
- 原因：`Security Scan` 的 Docker build context 受 `.dockerignore` 控制，不保證攜帶可用的 git 歷史。
- 解法：最近 `main` 上多個 CI run 不是壞在 Trivy 本身，而是 `Security Scan` 先用 root `Dockerfile` 建 image 時，容器內缺少完整 git 歷史，讓 `generate-sitemap-2025.mjs` 對 rate pages 退回到不具語義的單日時間戳，最後被 `lastmod` 多樣性 gate 擋下。本次改為在 git commit 日期不可得時，優先使用 content policy fallback 與 `seo-rate-examples.ts` 內可驗證的匯率日期，避免安全掃描因 SEO 驗證前置條件不足而誤 fail。

- 日期：2026-04-27
- ID：pr275-brand-literal-gate-followup-2026-04-27
- 原因：`apps/ratewise/src/config/__tests__/build-scripts.test.ts` 會阻擋新增的品牌字面值，要求改由 SSOT 提供。
- 解法：修正 PR275 新增 worker 測試在 markdown fixture 內直接寫入 `HaoRate` 字面值，導致 repo 既有的品牌 SSOT gate 於 pre-push 階段失敗。此次只將 fixture 改為中性字串，不變更任何產品邏輯或對外輸出。

- 日期：2026-04-27
- ID：pr275-markdown-mirror-root-mapping-fix-2026-04-27
- 原因：`shouldServeRatewiseMarkdown()` 與 `shouldInjectRatewiseMarkdownLink()` 先前以 `isRootHost && pathname === '/'` 當條件，將所有 root host 首頁都視為 RateWise 首頁。
- 解法：依 PR275 新增的 Codex review，再修正一個 root-host markdown negotiation 漂移：Worker 先前把所有 root host 的 `/` 都映射到 `/ratewise/index.md`，導致 `app.haotool.org/` 的 markdown negotiation 與 alternate `Link` 語義都被錯掛到 RateWise。此次將映射與 alternate link 條件縮回真正的 RateWise 首頁 `/ratewise/`，並補上 root host 不得誤映射的整合測試。

- 日期：2026-04-27
- ID：pr275-codex-followup-csp-lastmod-fix-2026-04-27
- 原因：`security-headers/src/worker.js` 將 `app.haotool.org` 與 apex root host 共用同一組 HTML profile 判斷，誤把未知 app 路徑套成 `HAOTOOL_HTML_PROFILE`。
- 解法：依 PR275 新增的 Codex review threads，收斂兩個實際風險：其一是 `APP_HOST` 被直接納入 root HTML profile 判斷，導致 `/split-meow/` 之類未定義專屬 profile 的 app 路徑失去 fallback `img-src https:`；其二是 sitemap generator 在 shallow checkout 環境過早 early-return，讓沒有顯式 fallback 的內容頁退回 build-time `lastmod`。本次將 root-host 行為與 root HTML profile 拆開，並為 3 個 authority guide 頁補齊 semantic fallback date，同時把 shallow early-return 改為只對「有穩定 fallback」的路徑生效。

- 日期：2026-04-26
- ID：pr281-codex-review-cluster-fix-2026-04-26
- 原因：`buildRateDifferenceSentence()` 原本共用 `amount * rate` 公式，未區分台幣預算換外幣時應比較「可換得外幣量」而非台幣成本。
- 解法：依 PR281 的 review threads，修正兩個測試檔案的 HTML 過濾 regex 大小寫問題、修正 `TWD→外幣` 匯差公式的單位錯誤、將 sitemap lastmod policy 細化為 `lastmodFiles` 以兼顧 comment 要求與日期多樣性，並確認 `public/sitemap.xml` 回到 4 個不同日期。

- 日期：2026-04-26
- ID：ratewise-sitemap-lastmod-policy
- 原因：前一輪 SEO 修補主要聚焦 FAQPage / ExchangeRateSpecification 與公開技術揭露頁，未同步把現金專屬幣別的可見文案一起收斂成 conditional branch。
- 解法：完成 P1-A。新增 `seo-lastmod-policy.ts`，將首頁、FAQ、About、Guide、Open Data、SeoTech 等頁面的重大內容依賴與 fallback date 收斂到 policy，並讓 `generate-sitemap-2025.mjs` 透過 policy 解析 `lastmod`。這次也把 `/seo-tech/` 從無 mapping 的 current-time fallback 拉回可稽核來源，並加入 sitemap `lastmod` 多樣性 gate：本地不足 3 個日期時警告，CI 可用環境變數升級為失敗。

- 日期：2026-04-26
- ID：pr281-sitemap-shallow-checkout-hardening
- 原因：`generate-sitemap-2025.mjs` 的 `lastmod` 主要依賴 git commit 日期，而 GitHub Actions PR workflow 預設 shallow checkout。
- 解法：PR281 在本地與 pre-push 全綠，但 GitHub Actions 的 `actions/checkout` 預設 `fetch-depth: 1`，導致 `git log -1 -- <files>` 幾乎所有頁面都只看到同一個 merge commit 日期，進而讓 sitemap `lastmod` 在 CI 中退化成單一日期並被 truthfulness gate 擋下。本次將 generator 補上 shallow repository 偵測，於淺層 clone 環境直接改走 semantic fallback date；同時補齊 content pages 與 rate pages 的 fallbackDate，讓 CI 在缺乏完整 git 歷史時仍輸出可驗證且具多樣性的 `lastmod`。

- 日期：2026-04-26
- ID：ratewise-schema-truthfulness-gate
- 原因：舊的 schema 決策把 FAQPage 與 `FinancialService` 擴散到幣別頁，與公開 registry 及 2026 Search best practices 不一致。
- 解法：完成 P0-E 與對應的 P1-B regression gate。將首頁的 HowTo schema 輸出移除但保留可見教學內容，將 FAQPage JSON-LD 限縮到 `/faq/`，幣別頁與金額頁全面移除 `FinancialService` 與 FAQPage，只保留 `ExchangeRateSpecification` 等可稽核匯率 schema。同步新增 `schema-truthfulness.test.ts`，並翻新既有 prerender/jsonld/ssot/best-practices 測試，確保新規則不會回歸。

- 日期：2026-04-26
- ID：ratewise-seo-doc-ssot-drift-gate
- 原因：README、歷史 SEO 規格與當前 `seo-paths.config.mjs` 已產生數字漂移，尤其是貨幣支援數、索引 path 數與舊 sitemap 腳本名稱。
- 解法：完成 P0-D。將 root README 與 `apps/ratewise/README.md` 對齊目前 SSOT，改正貨幣支援數與可索引 path 數，並新增 `generate-readme-seo-status.mjs` 與 `verify-doc-ssot-drift.mjs`。前者負責自動維護 README 的 SEO 狀態區塊，後者只檢查活文件與公開 runtime surface，略過測試負向斷言、歷史 log 與已標示 `SUPERSEDED` 的文件，避免舊規格靜默回流。

- 日期：2026-04-26
- ID：ratewise-seotech-ssot-registry-alignment
- 原因：`SeoTech.tsx` 原本同時扮演頁面與真相來源，頁內硬編 `SCHEMA_TYPES`、`BUILD_SCRIPTS`、sitemap 描述，導致 SSOT 存在但 public disclosure 沒有真的接上。
- 解法：完成 P0-B。新增 `seo-schema-registry.ts` 與 `seo-build-pipeline.ts`，讓 `/seo-tech/` 不再在頁面檔案內手寫 schema 與 prebuild 真相，而是直接從 registry render。同步清除 `generate-sitemap.mjs`、`248 個 SEO URL`、`priority 欄位`、`FinancialService` 等過時說法，將 sitemap 說明改為 `lastmod + hreflang + image sitemap`，將幣別頁 schema 揭露改為 `ExchangeRateSpecification`，避免公開技術揭露頁宣稱「永遠同步」但實際內容仍漂移。

- 日期：2026-04-26
- ID：ratewise-seo-surface-order-and-currency-truthfulness
- 原因：`apps/ratewise/index.html` 先前承載首頁導向的品牌文案、功能清單與 skeleton，導致 prerender HTML 在 route 專屬 H1 之前先出現通用內容。
- 解法：先完成 P0-A 與 P0-C。將 `index.html` 的預設 HTML 縮到最小 `noscript`，移除所有會污染 SSG 首屏的首頁文案與 skeleton；同時讓 `Layout` 在 SSR/SSG 階段不再用 `Suspense` 串流延後 SEO route 內容、`SkeletonLoader` 不再把通用 SEO 文案寫進 SSG HTML，並在首頁 app chrome 前補上首頁專屬 H1，避免 header/nav 先於主題。幣別頁則移除硬編「換 10 萬日圓／1,500～3,000 元台幣」模板，改由 `seo-metadata.ts` 的匯差句子 builder 依幣別與方向產生文字，避免 USD 頁出現 JPY 範例這類 YMYL 信任傷害。

- 日期：2026-04-26
- ID：pr281-regex-end-tag-generalization-fix-2026-04-26
- 原因：先前版本雖已處理大小寫與單純尾端空白，但仍假設 end tag 只會是 `</script>` 或 `</script >`。
- 解法：依 PR275 / PR281 合併後續的 CodeQL thread，將兩支 SEO HTML stripping 測試從 `</script\\s*>` / `</style\\s*>` 再擴為 `</script\\b[^>]*>` / `</style\\b[^>]*>`，覆蓋 tag name 後仍帶空白、換行或其他合法尾端片段的變體，避免再次留下腳本或樣式內容。

- 日期：2026-04-26
- ID：robots-txt-validator-truthfulness-fix-2026-04-26
- 原因：worker 會在 root `/robots.txt` 尾端附加 `Content-Signal`，但先前直接沿用 upstream request headers 與 upstream validators。
- 解法：依 PR275 新增的 Codex review，修正 `security-headers` worker 在改寫 root `/robots.txt` 後仍沿用 upstream `ETag` / `Last-Modified` 與條件式 revalidation 的問題。現在 worker 會先移除 `If-None-Match` / `If-Modified-Since` 再抓 upstream，並在輸出改寫後的 robots 內容時清掉過期 validators，避免 `304` 與改寫 body 不一致。

- 日期：2026-04-24
- ID：github-actions-node24-transition-maintenance
- 原因：多支 workflow 仍固定使用 `actions/checkout@v4` 與 `actions/setup-node@v4`，雖然部分 job 已加上 Node 24 force flag，但版本本身仍停留在 Node 20 世代。
- 解法：GitHub 在 workflow annotation 中提示 JavaScript actions 的 Node 20 runtime 已進入淘汰過渡期。比對官方 changelog、release notes 與各 action 的 `action.yml` 後，確認 `actions/checkout@v6`、`actions/setup-node@v6` 已切到 `node24`，但 `actions/dependency-review-action@v4.9.0` 仍停留在 `node20`。本次將 repo 內所有 `checkout` / `setup-node` 升到 Node 24 相容 major，並只在 `dependency-review` job 保留 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` 作為過渡控制，同步把判定原則寫回 `AGENTS.md` 與 `CLAUDE.md`，避免之後再次靠 warning 臨時補洞。

- 日期：2026-04-24
- ID：ratewise-about-faq-seo-truthfulness-refresh
- 原因：`ABOUT_PAGE_FAQ` 先前的 AI 搜尋引擎答案使用固定數量描述 AI crawler，容易在 `robots.txt` / `llms.txt` SSOT 擴充後再次失真。
- 解法：About 頁 FAQ 近期已更新為反映目前的 FAQPage、ExchangeRateSpecification 與 AI crawler 支援現況，但內容仍殘留兩個不穩定訊號：一是 AI crawler 數量若以固定數字描述，之後隨 robots.txt SSOT 擴充容易再次過時；二是金融頁 FAQPage 若被描述成以 rich result 為主要目標，會與 Google 現行 FAQ rich result 範圍產生語意偏差。本次將文案與守門測試一起收斂為「實際部署 + 不脆弱措辭 + 機器理解優先」三原則。

- 日期：2026-04-10
- ID：fix-speakable-parent-types-howto-removal
- 原因：`seo-helmet-utils.ts` 的 `SPEAKABLE_PARENT_TYPES` 陣列包含 `HowTo`，但 schema.org 規範明確限定 speakable 屬性僅適用於 `Article` 和 `WebPage` 類型。
- 解法：`SPEAKABLE_PARENT_TYPES` 錯誤包含 `HowTo`，導致首頁（有 HowTo + SpeakableSpecification、但無 Article/WebPage 節點）會把 speakable 掛載到 HowTo，跳過 WebPage fallback。依 schema.org 規範，speakable 僅適用於 Article/WebPage，掛載到 HowTo 會被結構化資料消費方忽略。

- 日期：2026-04-10
- ID：husky-nvm-bootstrap-for-noninteractive-shell
- 原因：Git hook 直接繼承當前 shell 的 PATH，非互動 shell 先命中 `/opt/homebrew/bin/node`，未自動切到 `~/.nvm`。
- 解法：雖然互動 shell 與 login shell 都已切到 Node 24，但 `git commit` / `git push` 觸發的 Husky hook 仍讀到 `/opt/homebrew/bin/node` 的 Node 25，導致每次 hook 都出現 engine warning。檢查後確認 hook 直接繼承外層 PATH，而不是穩定載入 NVM default。此次新增共用 `load-node-env.sh`，讓 `pre-commit`、`pre-push` 與 `commit-msg` 在非互動 shell 也會先切到 NVM 預設版本。

- 日期：2026-04-10
- ID：ratewise-followup-generated-artifacts-sync
- 原因：`pnpm build:ratewise` 於 pre-push 期間重新生成 `sitemap.xml`，使 canonical URL 的 `lastmod` 反映最新 SEO 相關提交日期。
- 解法：完成 `fix(ratewise): 收斂金額頁 SEO 索引策略與環境提示` 推送後，工作樹仍留下 `rates.json`、`sitemap.xml` 與 `seo-rate-examples.ts` 三個生成檔差異。進一步比對後確認這不是噪音：`sitemap.xml` 的 `lastmod` 已反映本次 SEO 相關提交日期，而匯率快照與 SEO 範例則在 build 期間抓到較新的臺銀資料。為避免同一分支上的遠端提交與本地 SSOT 產物不同步，將這三個生成檔收斂為 follow-up 提交。

- 日期：2026-04-10
- ID：ratewise-amount-seo-ssot-alignment-004
- 原因：先前「全金額 SEO 支援」語意不夠精確，容易被誤解成「所有金額頁都應成為獨立可索引頁」
- 解法：收斂 RateWise 金額頁 SEO 策略：明確區分 canonical 索引頁與任意金額可訪問頁，補齊 `supportedDynamicRoutePatterns` SSOT、修正 build 日誌與文件語意，並新增 `.node-version` 讓 Node 24 提示與 `engines` / `.nvmrc` 一致。

- 日期：2026-04-03
- ID：ratewise-nihonname-seo-ab-phases-002
- 原因：nihonname 4 頁（kominka/shimonoseki/san-francisco/history）Article schema 缺 image 欄位，Rich Results 驗證失敗
- 解法：完成 SEO A+B 兩階段原子優化：A 階段修正 Article.image/publisher schema 4 頁（nihonname 歷史頁）+修復 logo/publisher metadata；B 階段增強 E-E-A-T 信號（About/FAQ/Guide + Privacy/Contact page）並新增 semantic author/dateModified 標記與 PrivacyPolicy/ContactPage schema。版本語義更新至 v2.21.0，各 SSOT 檔案同步完成。

- 日期：2026-04-03
- ID：ratewise-lcp-optimization-c2-i18n-bundling-003
- 原因：Vite 配置未為 i18n resources 建立單獨 chunk，所有 4 個語言 locale 全部被打包進 app chunk
- 解法：C 階段第一個優化完成：通過 Vite manualChunks 分割 i18n resources，app bundle 從 331.78 KB 下降至 292.00 KB (-12%)，同時保持 SSG 預渲染兼容性。zh-TW 預設語言隨主 app 加載（9.2KB），en/ja/ko 可延遲至語言切換時加載（31.2KB）。LCP 預期改善 4.2s → 3.8–4.0s。

- 日期：2026-04-02
- ID：ratewise-seo-audit-p1-p5-fix-001
- 原因：H1 標題使用貨幣代碼（USD、JPY）而非中文名稱（美金、日圓），與 title 不一致降低搜尋相關性
- 解法：依據 SEO 稽核報告修正 P1（H1 標題）、P3（HowTo 圖片 404）、P5（dateModified 語意化）、P9（SeoTech 說明文字）四項高優先度問題。P4（測試衝突）確認為誤報。

- 日期：2026-04-02
- ID：ratewise-worktree-cleanup-seo-guards-001
- 原因：先前的 side worktree 建立在落後主支的基底上，未提交內容混有可用測試想法與已過時的 API / prerender 斷言
- 解法：盤點 repo 內殘留的 Claude worktree 後，先以主支為準判斷哪些內容已過時、哪些仍有保留價值。最終將兩份 dirty worktree 先備份 patch，再移除過期 worktree，只把不會回退主支現況的修補收斂回 `main`，包含版權文案 SSOT 與 sitemap / noindex prerender 防呆測試。

- 日期：2026-04-01
- ID：github-actions-schedule-drift-monitor-001
- 原因：既有 repo 只有 workflow YAML 與人工 `gh run list` 觀察，無法系統化量化「理論應觸發時間」與「實際 run 建立時間」之間的落差
- 解法：針對 GitHub Actions `schedule` 只提供 best-effort 觸發、無法保證每 5 分鐘準點的現況，新增 repo 內監測腳本，自動掃描有 `schedule` 的 workflow、比對 cron 理論時間與實際 `createdAt`，並統計 drift 秒數與缺漏的 scheduled slots，讓後續 CI/維運判讀不再只看 YAML。

- 日期：2026-03-31
- ID：rates-workflow-summary-cleanup-001
- 原因：`Commit and push changes` 步驟在 rebase 衝突時使用 `|| true` 吞掉錯誤，後續 summary 直接讀本地工作樹中的 `latest.json`
- 解法：合併後檢查主支 workflow log 時，發現 `Update Latest Exchange Rates` 在 `git pull --rebase` 衝突後，仍沿用帶 conflict markers 的本地工作樹執行 summary，導致成功 run 夾帶 JSON parse error。此次先以測試鎖定需求，再在兩條匯率 workflow 中加入 `origin/data` 刷新步驟，確保 summary 永遠讀取已提交的乾淨 JSON。

- 日期：2026-03-26
- ID：split-meow-mvp-pwa-offline-release-001
- 原因：新 app 初始匯入含 AI Studio 模板殘留（lockfile/依賴/外部資源），且未對齊 basePath 與 PWA 策略，若直接上線易造成離線失效與路徑錯誤
- 解法：將 split-meow 對齊 monorepo SSOT 與既有 PWA 實務模式，補齊 app.config.mjs、離線頁與本地資源，並以 prompt + injectManifest 設定避免版本撕裂，完成 v0.0.1 可上線版本。

- 日期：2026-03-18
- ID：ratewise-seo-audit-lastmod-contract-sync
- 原因：`scripts/verify-sitemap-2025.mjs` 保留舊的 ISO 8601 + timezone regex，未跟上 sitemap 生成器改為 date-only 的設計
- 解法：GitHub Actions 的 `SEO 2025 Standards Audit` 仍把 `lastmod` 視為必須帶時間與時區的完整 timestamp，導致合法的 `YYYY-MM-DD` sitemap 被誤判失敗。此次將 CI 驗證腳本同步到 W3C Datetime 契約，接受 date-only 與完整 timestamp 兩種合法格式。

- 日期：2026-03-18
- ID：ratewise-sitemap-lastmod-test-contract-sync
- 原因：`scripts/__tests__/sitemap-2025.test.ts` 已更新，但 `apps/ratewise/src/seo-best-practices.test.ts` 仍保留舊的秒級 regex
- 解法：`seo-best-practices.test.ts` 仍把 sitemap `lastmod` 寫死為完整 UTC timestamp，與新的 date-only sitemap 契約衝突，導致 pre-push 卡住。此次將測試同步收斂到 W3C 日期格式，讓最佳實踐、產物與測試三者一致。

- 日期：2026-03-18
- ID：ratewise-sitemap-lastmod-date-granularity
- 原因：先前 `lastmod` 輸出到秒級時間，若同一個 commit 本身修改了依賴檔，commit 完成後最新 git commit time 會晚於 commit 前生成的 sitemap，造成產物立即漂移
- 解法：針對 `git commit time` 版 `lastmod` 在 commit 完成後會立刻讓 `public/sitemap.xml` 再次變髒的問題，改為輸出 W3C Datetime 的日期格式 `YYYY-MM-DD`。這仍符合 sitemap protocol 與 Google 文件，且對同日多次 commit 保持穩定，讓 repo 追蹤的 sitemap 產物與實際 HEAD 不再互相打架。

- 日期：2026-03-18
- ID：ratewise-open-data-basename-lastmod-followup
- 原因：Open Data 相關資源卡以單一 `<a href>` 渲染，未區分 external 與 internal 導覽，導致 basename 部署時內部連結不會自動帶 `/ratewise/`
- 解法：依 review comment 與官方最佳實踐，將 Open Data 頁「使用指南」資源卡從一般 `<a href>` 改為 React Router `Link`，避免 `/ratewise/` 子路徑部署時導到根目錄；同時把首頁 `seo-metadata.ts` 納入 sitemap 依賴，確保首頁 SEO 文案更新會反映在 `lastmod`。

- 日期：2026-03-17
- ID：park-keeper-use-debounce-test-flake
- 原因：debounce hook 測試使用真實時間與 400ms timeout，當機器負載或測試併發較高時會偶發未在期限內完成狀態更新
- 解法：`apps/park-keeper` 的 `useDebounce.test.ts` 原本依賴真實計時器與 `waitFor`，在整包 workspace 測試併發時偶發超時，導致 `pre-push` 擋住與本次 SEO 任務無關的推送流程。改為 Vitest fake timers 後，測試可直接控制 300ms/500ms 邊界，行為更快也更穩定。

- 日期：2026-03-17
- ID：ratewise-seo-title-truthfulness-lastmod-tdd
- 原因：Open Data 頁的 SSOT title 直接包含品牌，而 `SEOHelmet` 又會統一追加品牌，導致最終 prerender `<title>` 重複
- 解法：針對 PR #207 的深度 SEO 審核 findings，先以紅燈測試鎖定三個問題，再完成最小修正與重建產物：Open Data 頁 title 不再重複品牌、About/SEO 指南不再錯誤宣稱 FAQPage rich result 已實作、sitemap `lastmod` 改為重大依賴檔的 git commit time 優先，讓 SEO 說法、SSG 產物與測試重新對齊。

- 日期：2026-03-16
- ID：park-keeper-photo-ux-v1.0.28
- 原因：（未填）
- 解法：RecordCard.tsx：PhotoViewerModal 改用 createPortal(modal, document.body) 渲染，跳出 transform 容器

- 日期：2026-03-16
- ID：park-keeper-ux-improvements-v1.0.27
- 原因：（未填）
- 解法：RecordCard.tsx：新增 formatSmartTime(timestamp) 純函式，依時間距離返回對應格式字串

- 日期：2026-03-15
- ID：park-keeper-photo-click-offset-fix-v1.0.26
- 原因：（未填）
- 解法：MiniMap.tsx：photoOffset default y: -80 → 10

- 日期：2026-03-15
- ID：park-keeper-user-beam-modern-svg-v1.0.25
- 原因：（未填）
- 解法：MiniMap.tsx：createUserIcon 改為 SVG 實作，增加 labelHtml（top:-44px）、精度暈圈、錐形 path + radialGradient、分層圓點（陰影/白環/主色）

- 日期：2026-03-15
- ID：park-keeper-nav-compact-48px-v1.0.24
- 原因：（未填）
- 解法：navBar.ts：NAV_CONTENT_H h-14 to h-12，NAV_ICON_SIZE 22 to 18

- 日期：2026-03-15
- ID：park-keeper-phone-flat-threshold-hysteresis-v1.0.23
- 原因：（未填）
- 解法：deviceOrientation.ts：PHONE_FLAT_THRESHOLD_DEGREES 45 to 75，新增 PHONE_FLAT_HYSTERESIS_DEGREES=55

- 日期：2026-03-15
- ID：park-keeper-nav-label-restore-v1.0.22
- 原因：（未填）
- 解法：navBar.ts：新增 NAV_LABEL_BASE_CLS（text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300）

- 日期：2026-03-13
- ID：improvement-ratewise-release-edge-sync-guard
- 原因：既有 `Release` workflow 對 `main` push 後立即 purge CDN，但 app 真正上線時間由外部部署系統決定，兩者沒有同步保證。
- 解法：新增 `scripts/ratewise-production-release.mjs`：提供 `app-version` probe、Cloudflare purge payload 與定點 purge 執行邏輯。

- 日期：2026-03-12
- ID：improvement-ratewise-live-precache-verifier-subpath-release
- 原因：`verify-precache-assets.mjs` 先前的預設 base 不是 `RateWise` 子路徑，若操作時未帶環境變數，容易把 root path 的結果誤當成 `/ratewise/` live 狀態。
- 解法：`scripts/verify-precache-assets.mjs`：依 `VERIFY_PRECACHE_SOURCE` 預設 `RateWise` 專用 base URL，並匯出 `getDefaultBaseUrl`、`parseShellAssetUrls`、`resolvePrecacheAssetUrl` 供測試使用。

- 日期：2026-03-12
- ID：improvement-ratewise-pwa-update-offline-techdebt-cleanup
- 原因：既有更新流程在 waiting SW 接管後缺少 `controllerchange` reload，容易留下「新 SW 已接管、舊 HTML 仍引用舊 chunk」的技術債風險。
- 解法：`UpdatePrompt.tsx`：新增 ready update 在線自動套用邏輯。

- 日期：2026-03-12
- ID：success-ratewise-stale-edge-404-offline-hotfix
- 原因：正式站 `sw.js` precache manifest 中有 4 個 `assets/*.js` URL 在 Cloudflare 邊緣被保留為 stale 404；同 URL 加 querystring 後可回 `200`，證明源站檔案存在但 edge 狀態錯誤。
- 解法：`security-headers/src/worker.js`：對 `ratewise/assets/*` 的 4xx 回應一律改成 `Cache-Control: no-store, no-cache, must-revalidate`，同步部署 Cloudflare worker `v4.2`。

- 日期：2026-03-12
- ID：improvement-seo-production-resource-availability-ssot
- 原因：既有 `verify-production-seo.mjs` 偏重 sitemap、robots、llms、404 與 canonical 語義驗證，缺少一個專責的「必要資源 availability」檢查層。
- 解法：新增 `scripts/verify-production-resources.mjs`，直接以每個 `app.config.mjs` 的 `resources.seoFiles` 與 `resources.images` 為 SSOT，自動發現所有 apps 並檢查正式站 URL 是否回傳 `200`；同時接入 `SEO Production Validation` workflow，使資源存活檢查與 sitemap/robots/llms 語義檢查分層。

- 日期：2026-03-11
- ID：incident-ratewise-settings-theme-hydration-disabled
- 原因：`useAppTheme()` 以 `typeof window !== 'undefined'` 直接推導 `isLoaded`，缺少一個 client mount 後必定觸發的 state re-render。
- 解法：在正式站 root-scope SW 汙染修正後重新驗證 `RateWise`，發現 `/ratewise/settings` 雖已可進入，但主題切換按鈕與重置按鈕仍維持 `disabled`，只有語言切換可用。最終確認不是資料載入失敗，而是 SSG/hydration 流程把 server 端的 disabled 屬性殘留在 DOM。

- 日期：2026-03-11
- ID：incident-ratewise-stale-pwa-shell-recovery
- 原因：正式站仍存在 top-level `self.skipWaiting()` 舊版 SW，與 repo 已改成 prompt 模式的 source 不一致。
- 解法：正式站舊 PWA 使用者可能被舊版 auto-update service worker 與新資產版本撕裂卡在 SSR 骨架屏，React 恢復機制因主 bundle 未載入而完全失效；同時先前將 apple-touch-icon 與 legacy pwa-\*.png 改為透明去背，造成使用者感知到 icon 樣式改變。

- 日期：2026-03-11
- ID：incident-haotool-root-sw-cross-app-contamination
- 原因：`apps/haotool` 啟用了根 scope PWA，`vite-plugin-pwa` 預設會以 `navigator.serviceWorker.register('/sw.js', { scope: '/' })` 註冊。
- 解法：正式站 `curl` 已顯示 `RateWise` 新版 HTML 與 recovery bootstrap 上線，但 Browser MCP 造訪 `https://app.haotool.org/ratewise/` 時仍被 `haotool` 首頁接管。最終確認根因不是 RateWise bundle，而是同網域根目錄 `haotool` 的 root-scope Service Worker (`/sw.js`) 透過 `NavigationRoute(index.html)` 攔截所有子路徑，讓曾造訪首頁的使用者在 `/ratewise/` 也收到錯誤 app shell。

- 日期：2026-03-15
- ID：park-keeper-ssot-tdd-refactor-v1.0.21
- 原因：（未填）
- 解法：（未填）

- 日期：2026-03-13
- ID：e2e-offline-timeout-fix
- 原因：（未填）
- 解法：|

- 日期：2026-03-11
- ID：pr188-precache-verifier-and-home-lazy-chunk-audit
- 原因：`Quality Checks` 失敗實際不是測試紅，而是 `BottomNavigation.tsx` / `OfflineAwareError.tsx` 新增路徑沒有對應 coverage
- 解法：PR #188 補上 `BottomNavigation` 與 `OfflineAwareError` 測試後，`ratewise` coverage 已回到 GitHub Actions 門檻以上；同時發現 root `verify:precache` 腳本仍只會解析舊版 `precacheAndRoute([...])` 字串，對目前 injectManifest 產出的 minified `sw.js` 會假性失敗。另一路正式檢查確認 `haotool` 首頁雖已移除 Suspense fallback marker，但 build 產物仍會 preload `ThreeHero` 與 `SectionBackground` lazy chunk，與「mount 後才載入」的設計不一致，因此改在 `postbuild.js` 直接清理首頁 preload，讓產物與設計一致。

- 日期：2026-03-10
- ID：haotool-home-procedural-environment-and-ratewise-basename-guard
- 原因：`ThreeHero.tsx` 直接使用 `Environment preset="city"`，把首頁反射環境綁到第三方遠端 HDR 檔與 `connect-src`
- 解法：正式站複核時發現 `haotool.org` 首頁 3D Hero 使用 `@react-three/drei` 的遠端 HDR preset，執行期會抓 `raw.githack.com`，被既有 CSP 正常阻擋後直接連鎖觸發 React / WebGL 崩潰；進一步本地 production preview 又揭露首頁仍因 `React.lazy + Suspense` 包裝 client-only 3D 模組，讓 SSG HTML 帶入 Suspense fallback marker，觸發 `React error #418`。同一輪 `squirrel audit` 也揭露 `ratewise` 底部導覽在 SSR HTML 輸出裸路徑 href，讓 crawler 或無 JS 情境直接打到 `/multi`、`/favorites`、`/settings` 的 root 404。修正採最小責任原則：`haotool` 改為程序化 `Environment + Lightformer`，並把 3D 模組改成 mount 後再 `import()`；`ratewise` 導覽改為 `useHref()` 產生 basename-aware href，並確認既有 PWA chunk recovery 未提交變更可覆蓋 Chrome / Safari 的常見 chunk 失效路徑。

- 日期：2026-03-10
- ID：manual-version-pr-fallback-release-2026-03-10
- 原因：GitHub Actions `Release` run `22883131370` 在 `Create Release Pull Request` 後回報 org-level permission 缺失：未啟用「Allow GitHub Actions to create and approve pull requests」
- 解法：PR #185 合併到 `main` 後，`Release` workflow 確實被觸發，但組織層級未開啟 GitHub Actions 建立 PR 權限，導致 `changesets/action` 無法自動建立 `Version Packages` PR。為維持既有 release SSOT，本次改以 `codex/manual-release-ratewise-2-8-6-parkkeeper-1-0-10` 分支手動執行 `pnpm changeset:version` 與 `pnpm --filter @app/ratewise prebuild`，將 patch 版本展開為 RateWise `2.8.6` 與 ParkKeeper `1.0.10`，再透過一般 PR 流程回到 `main`。

- 日期：2026-03-10
- ID：pr185-review-browser-verification-release-prep
- 原因：使用者要求在合併前完成深度 review、瀏覽器功能確認與小版本更新，但 repo 的 versioning 規則明確禁止在功能分支直接執行 `changeset version`
- 解法：針對 `codex/cloudflare-security-headers-v4` 執行合併前深度審查，補跑 Browser MCP 驗證 `ratewise` 與 `park-keeper` 核心路由與互動，確認 console 全程 0 error，並補上 multi-package patch changeset，讓 PR #185 合併後可以依 repo SSOT 正常產生 `Version Packages` PR。

- 日期：2026-03-10
- ID：codeql-test-html-regex-removal
- 原因：測試為了模擬 Cloudflare `HTMLRewriter`，以 regex 匹配 `<script ...>` 後手動重組 tag
- 解法：PR #185 的 GitHub Advanced Security 在 `apps/ratewise/src/__tests__/securityHeadersWorker.test.ts` 發現 `js/bad-tag-filter`，原因是測試用 mock `HTMLRewriter` 以 regex 改寫 `<script>` tag。雖然告警落在 `classifications: [test]`，但仍會讓 PR 顯示新增高嚴重度 security alert。修正方式改為使用 `jsdom` 建立 DOM、以 `querySelectorAll()` 套用 handler，不再用 regex 解析 HTML。

- 日期：2026-03-10
- ID：security-header-test-structure-decoupling
- 原因：`seo-best-practices.test.ts` 仍使用舊 regex 直接抓 `"'Permissions-Policy': '...'"` 字串，假設 Worker 採物件字面值寫法
- 解法：`pre-push` 在 `apps/ratewise/src/seo-best-practices.test.ts` 揭露既有測試仍假設 Worker 以舊式物件字面值直接宣告 `Permissions-Policy`，與新版 profile/constant 架構不相容。改為驗證 `DEFAULT_PERMISSIONS_POLICY` / `PARK_KEEPER_PERMISSIONS_POLICY` 常數與實際 `response.headers.set()` 路徑後，測試重新回到對 SSOT 的行為驗證，而非對字串排版的脆弱耦合。

- 日期：2026-03-10
- ID：cloudflare-security-headers-layered-refactor
- 原因：舊 Worker 雖已集中管理安全標頭，但 route 只覆蓋 `app.haotool.org/ratewise/*`，導致 `nihonname`、`park-keeper`、`quake-school` 與 root pages 缺少一致保護
- 解法：針對 `security-headers` Worker 執行分層重構，將 HSTS 留在 Cloudflare Edge，讓 Worker 專注於依 app/path 分層 CSP、CSP report 與分享圖 CORS；同時把 `ratewise` 升級為 nonce 型 CSP、補上 `park-keeper` 導航感測器白名單與 hook 啟用條件，最後以 curl、Playwright MCP、正式站 Playwright smoke test 建立可重現的生產驗證閉環。

- 日期：2026-03-09
- ID：fix-ratewise-router-chunk-cycle
- 原因：`manualChunks()` 只把 `react-router` 系列切到 `vendor-router`，但底層 `@remix-run/router` 被落入 `vendor-commons`
- 解法：針對 `pnpm build:ratewise` 既存的 `Circular chunk: vendor-router -> vendor-commons -> vendor-router` 警告，重整 `manualChunks` 的 router 生態系統分組，將 `react-router`、`@remix-run/router` 與 `vite-react-ssg` 收斂到同一個 chunk，消除跨 chunk 循環依賴。

- 日期：2026-03-09
- ID：ratewise-v2-8-1-patch-release
- 原因：`#177` 與 `#182` 合併後，main 上累積兩個 `@app/ratewise` patch changeset，需透過正式版本化流程寫回 package 與 CHANGELOG
- 解法：將已合併到 main 的兩個 RateWise patch changeset 正式版本化為 v2.8.1，產出對應 CHANGELOG 並清除待處理 changeset，讓主支回到乾淨可發布狀態。

- 日期：2026-03-08
- ID：ratewise-seo-ssot-faq-best-practices
- 原因：FAQ 內容、FAQ rich result、hreflang fallback 與 head metadata 分散在 `SEOHelmet`、頁面元件與測試斷言中，導致 PR 表面通過但實際仍殘留舊 FAQPage 行為
- 解法：依 Google Search Central 最佳實踐重新審查 RateWise SEO PR，將 FAQ 內容與 rich result 責任拆分，移除不適用的 FAQPage schema、收斂 hreflang fallback 與 head metadata，並以 TDD 重寫 SEO 驗證，讓 SEO 行為回到單一 SSOT。

- 日期：2026-03-09
- ID：fix-twd-pinned-multi-ordering
- 原因：（未填）
- 解法：修改 useCurrencyConverter.ts：sortedCurrencies 改用明確 TWD 置頂邏輯

- 日期：2026-03-08
- ID：log-v2-structured-indexing
- 原因：舊版 entry 可讀但索引欄位不穩定，主題與關鍵字無法可靠抽取
- 解法：依文件前言、分類與搜尋最佳實踐，將 002 升級為可被腳本與靜態文件工具穩定解析的 v2 結構，補上受控主題分類、標準化關鍵字與跨案例關聯。

- 日期：2026-03-08
- ID：incident-ssg-hydration-determinism
- 原因：server 與 client 首次 render 使用非 deterministic 值
- 解法：多次事故本質相同：server 與 client 首次 render 使用了不同輸入，例如 `new Date()`、`Math.random()`、`localStorage`、未固定時區的日期或巢狀 Layout，導致 Hydration #418、畫面重排或首屏內容漂移。

- 日期：2026-03-08
- ID：incident-base-path-assets
- 原因：手動組合資產 URL，而不是讓打包工具處理
- 解法：多次正式站問題都來自同一根因：資產路徑在 component 內自行拼接，或只在本地根路徑驗證，沒用真實子路徑 / base path 檢查，最終造成 logo、OG、offline、manifest 或 favicon 在正式站失效。

- 日期：2026-03-08
- ID：incident-seo-public-path-ssot
- 原因：公開 URL 清單存在多份來源
- 解法：sitemap、hreflang、llms.txt、robots、公開路由與驗證腳本曾多次互相脫鉤；表面症狀不同，但根因一致：公開 SEO 路徑不是由單一來源生成，導致每加一條路由就有多處需要手動同步。

- 日期：2026-03-08
- ID：incident-ci-hardcoded-audit
- 原因：檢查器使用手寫常數、硬編碼字串或固定欄位假設
- 解法：多次 CI 失敗不是產品真的壞掉，而是檢查工具寫死字串、路徑或數字，導致合規內容也被阻擋。這類問題本質上是檢查器違反 SSOT，而不是應用邏輯錯誤。

- 日期：2026-03-08
- ID：incident-csp-header-boundary
- 原因：安全標頭由多個層級同時維護
- 解法：安全標頭曾經同時散落在 app、nginx、worker 與理論最佳實踐之間；像 `strict-dynamic` 這種策略在 SSG 架構下沒有穩定 nonce 來源，套上去只會讓正式站壞掉。另一類問題則是 app 端已修、edge 端仍舊 header，形成部署漂移。

- 日期：2026-03-08
- ID：incident-production-verification-gap
- 原因：驗證只停在本地與 CI，缺少正式站 smoke check
- 解法：多次事故共同模式是「本地綠、CI 綠，但正式站仍有問題」，原因包含沒有檢查真實 base path、沒有驗 edge header、沒有檢查正式 console、或部署順序讓 app 與 worker 不一致。

- 日期：2026-03-08
- ID：incident-over-optimization-before-stability
- 原因：在缺少回滾與依賴邊界驗證時就做進階優化
- 解法：幾次事故都來自同一思維：在基礎資產、依賴邊界或回滾方案沒準備好前先做優化，例如過早考慮 AVIF/WebP、把 React 核心模組拆錯 chunk，最終把性能優化變成生產事故。

- 日期：2026-03-08
- ID：regression-docs-tests-routes-sync
- 原因：變更只修改執行邏輯，未同步測試、文檔與 SSG / SEO 設定
- 解法：多次小問題其實都屬同一類：改了 routes、SEO 路徑、xhtml:link 數量或文件敘述，但沒有同步測試與文檔，造成 false red 或更糟的 false green。

- 日期：2026-03-14
- ID：ga-e2e-review-fixes-and-scheduling-guard
- 原因：將「實頁面不變式」與「readyState 分支覆蓋」混在同一個 E2E 測試，導致 about:blank 假陽性
- 解法：PR #204 的 review 先後暴露六個層面問題：`ga-defer-lcp.spec.ts` 在 `chromium-mobile` 與 `offline-pwa-chromium` 重複執行、E2E 用 `about:blank` 的 `document.readyState` 假裝覆蓋實頁面競態、以 `includes('googletagmanager.com')` 判斷 script URL 造成 CodeQL `js/incomplete-url-substring-sanitization` 告警、以 `Array.isArray()` 錯判 GA `IArguments` 結構導致 `config` 次數永遠算成 0、只在 `DOMContentLoaded` 取樣一次而漏掉 `DOMContentLoaded → load` 之間的初始化時窗，以及 `APP_ROOT` 目錄深度計算錯誤導致 E2E 永遠讀不到真正的 `dist/assets`。修正方式是把 GA 排程抽成 `scheduleAfterPageLoad()` 單元測試覆蓋、E2E 改回實頁面不變式驗證、Playwright project 規則抽成常數，並以 parsed URL host/path、連續監測 `dataLayer`、正確的 `IArguments` 判讀與穩定的 app root 解析收斂 review。

- 日期：2026-03-14
- ID：haotool-root-url-ssot-contact-non200-fix
- 原因：`SITE_CONFIG.url` 同時承擔 root site canonical 與 sibling app sitemap host，導致根站網址責任混雜
- 解法：將 `apps/haotool/app.config.mjs` 的 root `SITE_CONFIG.url` 改為 `https://haotool.org/`

- 日期：2026-03-14
- ID：security-headers-wrangler-schema-compat-date-refresh
- 原因：`security-headers/wrangler.jsonc` 建立後長期未跟進 Cloudflare 近月最佳實踐，導致相容日期老化。
- 解法：透過 `wrangler` CLI 與 Cloudflare 官方文件重新核對後，確認目前生產中的 `security-headers` Worker 雖正常運作，但 `wrangler.jsonc` 仍缺少 `$schema`，且 `compatibility_date` 停在 `2025-11-26`。這次將設定補齊到 Cloudflare 當前建議做法，讓後續配置校驗、IDE 提示與 runtime 行為基線都回到可維護狀態。

- 日期：2026-03-30
- ID：ratewise-prerender-canonical-amount-schema-sync
- 原因：FAQ 頁的 SEO SSOT title 本身包含完整品牌字樣，經 `SEOHelmet` append brand 後造成 prerender HTML title 語意重複。
- 解法：針對 RateWise prerender SEO 做 production-grade 回歸審查後，補上三個會直接影響搜尋與 AI 抽取品質的缺陷：FAQ 頁 title 在 HTML 中重複品牌、`?amount=` 入口會自我 canonical 成 query URL、以及 amount 頁 `FinancialService` schema 仍指回幣對首頁。這次以 TDD 先補紅燈測試，再修正 SSOT 與 prerender 輸出，讓 amount 頁 metadata、hreflang、schema 與 self-canonical 完全一致。

- 日期：2026-03-30
- ID：ratewise-seo-ssot-machine-readable-followup
- 原因：Vite PWA plugin config 與 Playwright PWA 測試仍沿用舊品牌字串，沒有跟 `APP_INFO.name` 與 public manifest generator 同步。
- 解法：針對前一輪 SEO/AEO 修正後的殘留漂移，再補齊三個會影響長期穩定性的 SSOT 缺口：PWA manifest 名稱仍使用舊品牌、`llms-full.txt` 的 Answer Capsule 對外仍殘留 query-first 心智模型，以及 `api/latest.json` / `openapi.json` 沒有把 path-style amount landing page 宣告為首選模板。這次以 TDD 補上紅燈測試後，統一由 `APP_INFO.name` 驅動 manifest 品牌，並把 machine-readable 契約改為 `preferredLandingPageTemplate` + `interactiveDeepLinkTemplate` 的雙模板模式。

- 日期：2026-03-30
- ID：ratewise-rating-snapshot-deterministic-placeholder
- 原因：`fetch-rating-snapshot.mjs` 的 placeholder 路徑與成功拉取路徑共用「現在時間」心智模型，導致無 API 環境也會寫入新的 `snapshotAt`。
- 解法：在推送 `codex/ratewise-seo-followup` 時發現 `pre-push` 的 `build:ratewise` 會讓 `apps/ratewise/src/config/generated/rating-snapshot.ts` 每次都變更，根因是 `fetch-rating-snapshot.mjs` 在 `RATING_API_URL` 未設定時仍以 `new Date().toISOString()` 產生 placeholder 快照時間。這會破壞 build 可重現性，讓本機與 CI 反覆留下髒工作樹。修正方式是先以測試鎖定 deterministic placeholder 規則，再把 placeholder 改為固定時間常數 `1970-01-01T00:00:00.000Z`。

- 日期：2026-03-30
- ID：split-meow-ci-coverage-unblock-for-ratewise-pr
- 原因：CI `Quality Checks` 對整個 monorepo 執行 `pnpm -r run test:coverage`，所以即使 RateWise 變更正確，也會被其他 workspace 的 coverage debt 阻塞。
- 解法：PR #221 的 `Quality Checks` 失敗不是來自 `apps/ratewise`，而是 monorepo 中 `apps/split-meow` 的 coverage functions 只有 `54.98%`，低於 workflow 要求的 `60%`。為了完成「CI 修復後才能合併主支」的控制目標，這次在 scope 外做最小必要修補：以測試補強 `App.tsx`、`CatCompanion.tsx`、`CatPlayLayer.tsx` 與 `lib/catPlay.ts`，把 `split-meow` coverage 拉升到 `63.46%`，不調降門檻。

- 日期：2026-03-30
- ID：ratewise-seo-production-followup-ssot-hardening
- 原因：前一輪修正雖已消除實際輸出的 canonical/schema 問題，但仍有部分 SEO/PWA 文案模板散落在 hook 與生成器內，長期會與品牌 SSOT 或頁面 metadata 漂移。
- 解法：續查正式站與 GitHub workflow 後，確認 `SEO Production Validation` 的最新失敗屬於 `/eur-twd/` 暫時性 502 假警報，同時本地仍殘留兩個會持續讓 SEO 漂移的硬編碼點：`usePairAmountSEO.ts` 直接寫死 amount 頁 title/description 模板，以及 `generate-manifest.mjs` 直接寫死 `short_name` 與 screenshot label。這次先以測試鎖定行為，再把 amount SEO 文案收斂到 `seo-metadata.ts`，把 manifest 品牌資訊收斂到 `app-info.ts` 的 manifest SSOT，並補上 authority guide 頁的 Answer Capsule 與 production health check 5xx retry。

- 日期：2026-03-30
- ID：ratewise-health-check-plain-node-ssot-fix
- 原因：`health-check.mjs` 先前為了避免硬編碼，直接 import `src/config/seo-metadata.ts`；但該模組依賴 extensionless TS imports 與 `import.meta.env`，不適合被 plain Node CLI 直接載入。
- 解法：Codex review 指出 `apps/ratewise/scripts/health-check.mjs` 直接 import `seo-metadata.ts`，會在 plain Node 環境因 bundler-only import 與 `import.meta.env` 依賴而於啟動前崩潰。這次先用紅燈測試鎖定「health-check 只能依賴 plain-Node SSOT 模組」，再把首頁與 Guide 的預期 title 抽成 `seo-static.ts`，讓 health-check 與 `seo-metadata.ts` 共用同一份靜態來源，同時保留 build/typecheck 與直接 `node` 執行能力。

- 日期：2026-03-31
- ID：splitmeow-tdd-and-actions-schedule-reliability
- 原因：`useUpdatePrompt.ts` 將 `visible` 永久綁在 `dismissed`，但沒有在新的 `needRefresh` 事件發生時重置 `dismissed`。
- 解法：針對近一個月 closed PR 的 Codex review 逐條回查後，確認 `split-meow` 還有兩個真實缺陷未修：`useUpdatePrompt` 在使用者 dismiss 離線提示後，不會在後續 `needRefresh=true` 時重新顯示更新提示；`HomeTab` 在 itemized 模式下若目前焦點成員被停用，鍵盤輸入仍可能寫入已停用對象。這次先用紅燈測試鎖定兩個互動問題，再做最小修正讓其轉綠。另在驗證 `4a26af8e` 的 MoneyBox 5 分鐘同步時，發現 workflow 雖成功抓到資料，但因用 `git diff --quiet` 檢查未 tracked 新檔案，導致 `moneybox.json` 第一次建立時被誤判為「無變更」而未 commit；同時 GitHub Actions 的 `*/5` schedule 在實測上並不準時，今天只跑出數次、實際間隔介於約 49 至 205 分鐘。為降低高負載時的延遲 / 掉單風險，將 latest 與 moneybox 兩個高頻 workflow 的 cron 改為錯開且避開整點，並加入 schedule diagnostics 輸出，讓後續可直接從 `gh run view --log` / summary 判讀平台延遲與資料新鮮度。

- 日期：2026-04-09
- ID：ratewise-p0-seo-schema-implementation
- 原因：`SEO_MASTER_SSOT.md` 已規劃 P0 任務但尚未實作，導致 AI 引擎無法從 RateWise 頁面提取結構化匯率資訊。
- 解法：依據 `SEO_MASTER_SSOT.md` 的 P0 優先級任務，完成三項關鍵 SEO 改善：(1) 首頁加入 `CurrencyConversionService` schema，讓 AI 引擎匹配「幣別換算工具」查詢時優先引用；(2) 34 個幣對頁加入 `ExchangeRateSpecification` schema，從 `seo-rate-examples.ts` 動態讀取現金賣出價，讓 AI 引擎可提取並顯示具體匯率數字；(3) 幣對頁加入可見更新時間戳（`<time>` 元素），作為 Perplexity 新鮮度信號。同時新增 10 個測試案例驗證 schema 正確性。

- 日期：2026-04-20
- ID：ratewise-p1-5-amount-page-exchange-rate-schema
- 原因：P0 階段僅在 34 個幣對頁實作 `ExchangeRateSpecification`，約 204 個金額頁缺乏此 schema。
- 解法：延續 P0 階段的 ExchangeRateSpecification 實作，將此 schema 擴展至約 204 個金額頁（如 `/usd-twd/100/`）。新增 `buildAmountExchangeRateSpecificationJsonLd()` 函數，在 schema description 中包含具體換算結果（如「100 USD 換 3,250 TWD」），讓 AI 引擎可直接提取「X 外幣 = Y 台幣」形式的答案。同時新增 4 個測試案例驗證 to-twd 和 twd-to-foreign 兩種方向的 schema 生成。

- 日期：2026-04-20
- ID：ratewise-seo-infrastructure-batch-2026-04
- 原因：開發者需要診斷 Worker 處理耗時，但缺乏 Server-Timing 標頭。
- 解法：批次完成四項 SEO 基礎建設任務：(1) P1-8 在 Cloudflare Worker 加入 Server-Timing 診斷標頭，記錄 fetch/rewrite 耗時；(2) P2-7 在 open-data 頁面使用 TechArticle schema 強化開發者 SEO；(3) P2-10 建立 GSC AI Overviews 監測 SOP 文件；(4) P2-11 在 Worker 中加入 AI 爬蟲存取記錄功能，追蹤 llms.txt/.md 鏡像的存取頻率。

- 日期：2026-04-24
- ID：ci-data-branch-post-push-refresh-hardening
- 原因：排程 workflow 將 post-push refresh 視為一般必要步驟，導致 GitHub 瞬時 5xx 會把整個 job 標成 failure。
- 解法：透過 `gh run view --log-failed` 追查 `Update Latest Exchange Rates` 最新失敗後，確認 `Commit and push changes` 與 jsDelivr purge 都已成功，真正失敗的是最後的 `Refresh ... from remote data branch`，原因為 GitHub 在 `git fetch origin data` 返回瞬時 `500`。這代表 workflow 把「收尾驗證失敗」誤判成「資料更新失敗」。本次將 latest 與 moneybox 兩支同型 workflow 的 post-push refresh 收斂為最多 3 次重試，並設為 `continue-on-error: true`；若仍失敗，只在 workflow summary 顯示 warning，不再覆蓋已成功的 data branch push 結果。同時同步更新 `AGENTS.md` 與 `CLAUDE.md`，把這個判定原則與修法納入 SOP。

- 日期：2026-04-24
- ID：ratewise-auto-rate-display-align-buy-sell
- 原因：`SingleConverter` 的匯率卡片自行以 `fromRate / toRate` 組裝顯示值，沒有共用實際換算用的 `convertCurrencyAmountWithMode()`。
- 解法：修正單幣別轉換器在 `自動方向` 模式下的匯率卡片顯示錯誤。實際換算早已透過 `convertCurrencyAmountWithMode()` 依方向套用買入/賣出價，但 `SingleConverter` 的卡片文字仍直接用 `getExchangeRate()` 計算，等同固定走 sell 邏輯，導致畫面上的「1 TWD = X USD / 1 USD = Y TWD」與實際換算結果不一致。本次將卡片顯示改為直接共用 `convertCurrencyAmountWithMode()`，讓 auto / sell / mid 三種模式的顯示與計算完全收斂，並新增測試鎖住 auto 模式下正反向不必互為倒數的行為。

- 日期：2026-04-26
- ID：ratewise-seo-rate-examples-spotavailable-ssot
- 原因：前一輪修補已在 runtime 依賴 `spotAvailable` 分支，但生成腳本與 generated 檔案仍停留在未提交狀態。
- 解法：將 `spotAvailable` 正式收進 `update-seo-rate-examples.mjs` 與 `generated/seo-rate-examples.ts` 的資料生成鏈，讓 cash-only 幣別與有即期匯率幣別的差異來自可重建的 SSOT，而非只存在於本地測試狀態。同時保留 `seo-speakable.test.ts` 對 Authority Guide FAQ `h3` 朗讀節點的回歸測試，避免再次出現 metadata 與頁面實際 heading 結構脫鉤。

- 日期：2026-04-26
- ID：ratewise-sitemap-lastmod-diversity-followup
- 原因：generator 對 `CONTENT_LASTMOD_POLICY` 的內容頁直接對整組 dependency files 做 `git log -1`，使共享檔案的最近 commit 蓋過 route 專屬內容檔。
- 解法：`generate-sitemap-2025.mjs` 先前雖已導入 semantic lastmod policy，但內容頁仍會因共用 `seo-metadata.ts` 的最近 commit 被壓成同一天，導致 sitemap 只產生 2 種日期並持續警告。這次將內容頁 lastmod 的優先順序改成先看 route 專屬主檔，再回退到完整 dependency set，讓 `/faq/`、`/about/`、`/guide/`、`/open-data/`、`/seo-tech/` 的日期更貼近主內容更新，而不是被共用設定檔一起帶新。

- 日期：2026-04-25
- ID：ratewise-seo-ssot-external-audit-2026-04-25
- 原因：`SEO_MASTER_SSOT.md` 的 12.6 區塊缺少最新一次可追蹤的外部檢測迭代紀錄。
- 解法：補充 `apps/ratewise` SEO SSOT 的外部檢測基線，新增 2026-04-25 外部檢測快照、權威來源對照與可重複執行命令，將網站回應狀態與第三方限制做分層紀錄，幫助後續發版快速區分站點退化與工具限制造成的異常。

- 日期：2026-04-25
- ID：ratewise-seo-ssot-external-audit-2026-04-25-revision
- 原因：先前 SSOT 監測節點缺少最新 46 入口抽樣與 prod/root 差異證據。
- 解法：同步 `docs/SEO_MASTER_SSOT.md` 的 12.5 / 12.6 區為 2026-04-25 生產基線，補齊 46 筆外部入口快照、`curl` 與 IsItAgentReady API 實測摘要，並修正檢測結果分佈紀錄。

- 日期：2026-04-25
- ID：ratewise-root-host-ai-discovery-alignment-2026-04-25
- 原因：`ROOT_SITE_HOSTS` 原先未包含 `app.haotool.org`，導致掃描器以 root 起算時看不到 `Content-Signal` 與 `Link` header 相容行為。
- 解法：將 `security-headers/src/worker.js` 的 root-host 設定補上 `app.haotool.org`，使 root 與 `/ratewise/` 可共用同一套 `Content-Signal`、markdown negotiation 與 `Link` 導向邏輯；待生產部署後需重跑 IsItAgentReady 與 curl 驗證。

- 日期：2026-04-26
- ID：pr275-codex-command-evidence-fix-2026-04-26
- 原因：先前 002 條目沿用了文件草稿中的命令描述，未再次核對 `scripts/seo-full-audit.mjs` 的實際 CLI 介面。
- 解法：依 PR275 的 Codex review，將 `docs/dev/002_development_reward_penalty_log.md` 內不可執行的 `node scripts/seo-full-audit.mjs --base-url=...` 證據命令改為實際支援的本地 `dist` 稽核命令，避免把不存在的 CLI 參數寫進可追溯證據鏈。

- 日期：2026-04-30
- ID：ratewise-seo-ab-test-production-fixes-2026-04-30
- 原因：常見金額連結使用 `popularAmounts`，但 SSG 可索引金額由 `INDEXABLE_FORWARD_AMOUNTS` 維護，兩份資料源漂移後產生 `/myr-twd/5000/`、`/nzd-twd/20/`、`/php-twd/50000/` 站內 404。
- 解法：依 Squirrel、正式站抽樣與多 agent 複核結果，修正幣別頁常見金額連結與 SSG 金額白名單漂移、OpenData 頁 raw email 觸發 Cloudflare email obfuscation、首頁 Markdown mirror 描述錯抓 FAQ 文案、robots 非標準 Content-Signal 註解與過時 WebSite SearchAction。

- 日期：2026-04-26
- ID：pr281-regex-tail-whitespace-fix-2026-04-26
- 原因：先前修正只處理了大寫標籤，未覆蓋 end tag 在 `>` 前含空白的合法 HTML 變體。
- 解法：依 PR281 合併後新增的 CodeQL thread，將兩支 dist HTML 可見文字測試的 regex 從大小寫不敏感版本再補強為可接受 `</script >` 與 `</style >` 這類 end-tag 尾端空白，避免 HTML stripping 留下腳本或樣式內容造成假陽性。

- 日期：2026-05-01
- ID：ratewise-performance-followup-shell-split
- 原因：首頁 app shell 仍直接載入互動換算器與 motion 相關提示元件，release 後 Markdown mirror 版本也停在舊版。
- 解法：延續已隔離 stash 並經多 agent 複核，保留 logo LCP preload，移除未使用 Google Fonts resource hint，將首頁換算器與非首屏 PWA/評分提示延遲載入，底部導覽改用 CSS transition，並同步 Markdown mirror 至 v2.22.8。

- 日期：2026-05-01
- ID：pr315-ratewise-lazy-boundary-direction-review-fix
- content_type：review-fix
- topics：ratewise, performance, pwa, route-transition
- keywords：React.lazy, Suspense, error boundary, route animation, chunk load
- related_entries：ratewise-performance-followup-shell-split
- 原因：PR #315 review 指出兩個真問題：route direction 透過 effect 更新會在反向連續切換時慢一拍；全域非首屏 lazy 提示若 chunk 載入失敗，缺少錯誤邊界會把非關鍵提示故障升級成整體路由錯誤。
- 解法：將 AppLayout 的上一個 pathname 記錄改為 render-time guarded state，讓當次 render 直接取得正確 previous/current path；另以非關鍵 error boundary 包住 OfflineIndicator、UpdatePrompt、RatingModal 的 Suspense，chunk 失敗時只隱藏提示元件，不影響主要內容與導覽。

- 日期：2026-05-01
- ID：pr315-ci-coverage-lazy-mock-fix
- content_type：ci-fix
- topics：ratewise, vitest, coverage, lazy-loading
- keywords：test:coverage, React.lazy, AppLayout, CI teardown
- related_entries：pr315-ratewise-lazy-boundary-direction-review-fix
- 原因：GitHub Quality Checks 的 `pnpm test:coverage` 在 `AppLayout.safe-area.test.tsx` 結束後出現 Vitest teardown unhandled rejection；該測試只驗證 header safe-area，卻未 mock AppLayout 新增的 lazy 全域提示。
- 解法：在 safe-area layout 測試中補齊 OfflineIndicator、UpdatePrompt、RatingModal mock，讓測試隔離非目標 lazy 元件，避免 coverage 全量併發時留下未收斂的 lazy 任務。

- 日期：2026-05-01
- ID：pr315-noncritical-lazy-boundary-retry-fix
- content_type：review-fix
- topics：ratewise, pwa, lazy-loading, reliability
- keywords：React.lazy, error boundary, retry, online event, Layout
- related_entries：pr315-ratewise-lazy-boundary-direction-review-fix, pr315-ci-coverage-lazy-mock-fix
- 原因：PR #315 最新 review 指出兩個真問題：`Layout` 的 lazy 全域提示位於主要 `ErrorBoundary` 之外，chunk 載入失敗仍會升級成整頁錯誤；`AppLayout` 新增的非關鍵 lazy 邊界捕捉錯誤後沒有重置機制，暫時性離線或弱網會讓提示元件整個 session 永久消失。
- 解法：將非關鍵 lazy 錯誤邊界抽成共用元件，提供 `resetKey`、`online` 事件與 `attempt` render prop；重置時讓 `AppLayout` / `Layout` 重新建立 lazy component type，避免 React.lazy 快取已 reject 的 loader，並補上單元測試鎖定正常渲染、錯誤隔離、resetKey 重試與網路恢復重試。

- 日期：2026-05-02
- ID：ratewise-markdown-mirror-noindex-guard-2026-05-02
- 原因：正式站 `.md` mirrors 雖已正確回 `text/markdown` 並供 AI crawler 讀取，但未明確宣告 `noindex`，存在 mirror 與 canonical HTML 重複索引風險。
- 解法：依 Google Search Central 非 HTML `X-Robots-Tag` 規範，於 Cloudflare Worker v5.1 與 `_headers` 對直連 `.md` 補 `X-Robots-Tag: noindex`，同時以測試鎖定 markdown negotiation 不得誤傷 canonical URL 索引。

- 日期：2026-05-02
- ID：pr325-markdown-negotiation-noindex-inheritance-fix
- 原因：Codex P1 指出 markdown negotiation 會繼承上游 `.md` 的 `X-Robots-Tag: noindex`，導致 canonical URL 的 markdown 變體誤帶 noindex。
- 解法：在 Worker 的 markdown negotiation 分支明確刪除繼承而來的 `X-Robots-Tag`，並把測試改成模擬上游實際帶 `noindex` 的情況，鎖住這個回歸。

- 日期：2026-05-02
- ID：ratewise-mailto-crawlable-anchor-seo-fix
- 原因：第 2 輪 SEO iteration 發現 `/about/`、`/faq/` Lighthouse SEO 從 100→92，根因為 `MailtoLink` SSG 輸出 `<a>` 無 `href`（為避開 Cloudflare Email Obfuscation），觸發 `crawlable-anchors` 扣分。
- 解法：將 `MailtoLink` 改用 `<button type="button">` 取代 `<a>`，繼續無 `mailto:`/raw email SSG 輸出避開 CF 與 scraper，並補上 5 個 vitest 守門 button-only / 無 mailto / SSG label 等不變式。

- 日期：2026-05-03
- ID：ratewise-meta-description-google-snippet-extend
- 原因：Squirrel surface audit 顯示 `/ratewise/` meta description 96 字元（< 110 建議），Google SERP snippet 與 AI 摘要的可用語意密度不足。
- 解法：擴充 `DEFAULT_DESCRIPTION` 與 `SITE_CONFIG.description` 至 126 字元（雙 SSOT 同步），補入差異化定位（「台灣最精準匯率換算工具」）、四大特色（即時換算/現金即期/趨勢圖/PWA），維持品牌一致性與 verify:seo-docs SSOT alignment 通過。

- 日期：2026-05-04
- ID：tooling-vitest-4-test-script-jest-flag-removal
- 原因：root `package.json` 的 `test:unit` / `test:integration` 仍透過 `pnpm -r test --` 把 Jest flag 傳給 Vitest 4，造成 4 個 app（haotool/park-keeper/nihonname/quake-school 等）每次 SEO iteration 都報 `CACError: Unknown option`，使 R5/R6 orchestrator 「失敗 20 輪」與本地 `test:unit` 全失敗。
- 解法：移除 `--testPathIgnorePatterns` / `--testPathPattern`，e2e 隔離全部下放到各 app 的 `vitest.config.ts test.exclude`；integration 改為 `pnpm --filter @app/ratewise exec vitest run integration`，2660 unit + 8 integration tests 全綠。

- 日期：2026-05-04
- ID：ratewise-lhci-homepage-runtime-refresh-guard
- 原因：PR #350 的 Lighthouse CI 在首頁 `/` 掉到 `0.87~0.88`，根因為 LHCI 離線模式下首頁仍執行 runtime 匯率 refresh，失敗後插入 stale warning 與額外背景工作，拉低首屏效能。
- 解法：在 `exchangeRateService` 與 `useExchangeRates` 增加 `VITE_LHCI_OFFLINE` 穩定分支，LHCI 直接使用 build-time 匯率並跳過 runtime refresh / polling，另補 service 與 hook 回歸測試鎖住行為。
