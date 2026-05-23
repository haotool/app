---
name: RateWise
description: 台灣銀行牌告導向的冷靜匯率換算工具
colors:
  background: '#F8FAFC'
  surface: '#FFFFFF'
  surface-elevated: '#F6F9FC'
  surface-sunken: '#EFF4F8'
  text: '#0F172A'
  text-muted: '#64748B'
  primary: '#2563EB'
  secondary: '#0EA5E9'
  accent: '#3B82F6'
  border: '#E2E8F0'
  info: '#0891B2'
  success: '#22C55E'
  warning: '#F59E0B'
  destructive: '#DC2626'
typography:
  display:
    fontFamily: 'Inter, Noto Sans TC, system-ui, -apple-system, sans-serif'
    fontSize: 'clamp(1.875rem, 4vw, 2.25rem)'
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: 'Inter, Noto Sans TC, system-ui, -apple-system, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.333
  title:
    fontFamily: 'Inter, Noto Sans TC, system-ui, -apple-system, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: 'Inter, Noto Sans TC, system-ui, -apple-system, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Inter, Noto Sans TC, system-ui, -apple-system, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: '0.16em'
rounded:
  sm: '4px'
  md: '6px'
  lg: '8px'
  pill: '999px'
spacing:
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.lg}'
    padding: '0 16px'
    height: '44px'
  button-secondary:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
    padding: '0 16px'
    height: '44px'
  card-panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
    padding: '20px'
  notification-surface:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
    padding: '14px 24px'
  list-row:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.lg}'
    padding: '12px 16px'
---

## Overview

**Creative North Star: "The Quiet Exchange Desk"**

RateWise 的預設視覺系統是一套安靜、克制、資訊優先的產品介面。它應該像使用者在付款前最後確認匯率的工作台，不像行情盤，也不像裝飾型 SaaS 首頁。畫面首先服務判讀速度，其次才是品牌辨識。

預設產品語法以 `zen` 風格為基準，其他 `nitro`、`kawaii`、`classic`、`ocean`、`forest` 僅作使用者可切換的外觀變體。所有變體都必須保留相同的資訊層級、相同的元件節奏與相同的互動語意，不能用造型改寫產品心智模型。

這套系統明確排斥加密交易平台式的霓虹高飽和、AI 樣板 SaaS 式的 glow 與漸層文字，以及生活風格工具式的過度情緒化語氣。它的辨識度來自安靜表面、清楚數字、穩定留白與一致詞彙，不來自特效。

Key Characteristics:

- 冷靜、精準、可靠。
- 預設使用 restrained color strategy，不做大面積裝飾性漸層。
- 同一概念在首頁、收藏、多幣別、設定、SEO 內容頁使用同一種權重與元件語法。
- 觸控優先，但桌面版要有足夠寬度與資訊節奏，不能像手機稿被放大。

## Colors

整體色彩以冷靜的藍系中性色為主，將主色集中在主要操作、狀態與導引，而不是大片情緒背景。

### Primary

- **Exchange Blue** (`#2563EB`): 主要 CTA、焦點與需要立即判讀的互動元素。預設不拿來鋪滿大面積背景。

### Secondary

- **Sky Signal** (`#0EA5E9`): 支援型資訊、次要狀態與圖表底層過渡色，用於輔助，不與 Primary 爭主導權。

### Tertiary

- **Clear Accent** (`#3B82F6`): 僅用於小範圍高亮，例如通知裝飾、局部導引與互動後的柔性回饋。

### Neutral

- **Ledger Mist** (`#F8FAFC`): 頁面背景，維持乾淨但不刺眼的工作台底色。
- **Paper Surface** (`#FFFFFF`): 主卡片與主要容器背景。
- **Raised Surface** (`#F6F9FC`): 次層容器、segmented controls、次要按鈕背景。
- **Sunken Surface** (`#EFF4F8`): 按壓後或低階容器的收斂層次。
- **Ink 900** (`#0F172A`): 主要文字、標題與高重要度數字。
- **Slate Note** (`#64748B`): 次要說明、輔助文與低權重標籤。
- **Rule Line** (`#E2E8F0`): 邊框、分隔與可讀但不搶戲的結構線。

### Named Rules

**The Quiet Surface Rule.** 背景與容器先用中性層次解決階層，再考慮色彩。若同一畫面已經靠邊框、留白與標題完成分層，就不要再加漸層或 glow。

## Typography

**Display Font:** Inter, Noto Sans TC, system-ui, -apple-system, sans-serif
**Body Font:** Inter, Noto Sans TC, system-ui, -apple-system, sans-serif
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, monospace

字體策略以高可讀性的無襯線系統為主，讓中英文與數字混排時仍保持穩定節奏。數值顯示、更新時間與版本等資料型內容，應優先使用 tabular numerals 或 monospace 輔助，而不是額外裝飾。

### Hierarchy

- **Display** (700, `clamp(1.875rem, 4vw, 2.25rem)`, 1.2): 頁面主標題與少數需要建立主場景的首屏標題。
- **Headline** (700, `1.5rem`, 1.333): 核心模組標題，例如主要卡片或內容頁區塊標題。
- **Title** (600, `1.25rem`, 1.4): 次級區塊、卡片標題與清單模組標題。
- **Body** (400, `1rem`, 1.6): 正文與說明文。內容型頁面的段落寬度維持在約 65 至 72 字元。
- **Label** (600, `0.75rem`, 1.333, `0.16em`): eyebrow、區塊導引與輕量 metadata。只在需要建立節奏時使用大寫標籤，不可濫用。

### Named Rules

**The Number First Rule.** 與匯率、金額、更新時間相關的資訊優先度高於裝飾型標題。若文字階層與數值判讀衝突，優先讓數值更清楚。

## Elevation

RateWise 的深度語法以 tonal layering 為主，陰影為輔。絕大多數層次差異先靠 `surface`、`surface-elevated`、`surface-sunken` 解決，陰影只用來表達浮起、hover 或暫時性提示，不作常態性戲劇效果。

### Shadow Vocabulary

- **Resting Card** (`0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.05)`): 預設卡片與主要內容面板。
- **Hover Lift** (`0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`): hover 後的輕微浮起，只作互動回饋。
- **Transient Surface** (`shadow-lg` level): 通知、tooltip、底部工作表與臨時浮層。

### Named Rules

**The Lift Must Mean State Rule.** 若一個陰影不代表 hover、焦點、暫時提示或浮層，就不應存在。不要用大陰影補救階層不清的版面。

## Components

### Buttons

- **Shape:** 預設 `rounded-lg`（8px），主要尺寸高度至少 `44px`，少數輕量操作可用膠囊型圓角。
- **Primary:** `primary` 實底配 `surface` 文字，只用於明確主動作，例如更新、確認、開始轉換。
- **Hover / Focus:** hover 允許極輕微上浮與陰影加深；focus 使用清楚的 `ring-primary`，不得用模糊光暈取代焦點樣式。
- **Secondary / Ghost / Danger:** 次要按鈕用 `surface-elevated` 加邊框；ghost 只在低視覺權重工具列使用；danger 維持明確語義，但版面仍要克制。

### Chips

- **Style:** 小尺寸、圓角、邊框明確，優先作為 eyebrow、狀態或輕量切換標籤，而不是厚重 badge。
- **State:** 選中狀態主要依靠邊框、底色與文字色改變，不使用高飽和螢光效果。

### Cards / Containers

- **Corner Style:** 主內容面板、次層容器與互動列預設使用 8px 以內圓角；只允許 pill 用於 chip、badge 或膠囊型控制。
- **Background:** 主卡片用 `surface`，次層與安靜模組用 `surface-elevated`，不要在正式產品頁中使用玻璃卡。
- **Shadow Strategy:** 預設使用 resting card 陰影；hover 或可拖曳狀態才升到更高層級。
- **Border:** 絕大多數卡片都有 `border-border/70` 左右的結構線，取代彩色 accent stripe。
- **Internal Padding:** 主要面板 `20px` 至 `24px`，輕量列項 `12px` 至 `16px`。

### Inputs / Fields

- **Style:** 以乾淨背景、清楚邊界與穩定留白為主，不用擬物或發光效果。
- **Focus:** focus 由 ring 與邊框色帶出，不改變版面尺寸。
- **Error / Disabled:** 直接用語義色與可讀文字說明，不靠震動或炫目動畫表達。

### Navigation

- **Top / Bottom Navigation:** 使用半透明背景與輕微 blur 只作可讀性補強，不是視覺主角。導覽本體要融入產品殼層。
- **Segmented / Tabs:** 活動狀態使用 `surface-elevated`、文字加重與輕陰影，不用大片主色底。

### Notifications

- **Style:** 更新通知、離線提示與評分提示統一使用安靜的 `surface` 浮層，不再使用品牌漸層底。
- **Icon Treatment:** 狀態圖標放在小型 elevated 容器中，用 `primary` 或 `warning` 文字色表達狀態。
- **Action Pattern:** 通知內的主要與關閉操作共用同一套 action token，避免各通知自成一格。

## Do's and Don'ts

- **Do:** 先用字級、留白、邊框與表面層次建立階層，再決定是否需要色彩。
- **Do:** 讓首頁、收藏、多幣別、設定與 SEO 內容頁共用同一套 panel、row、eyebrow 與 secondary CTA 語法。
- **Do:** 保留 `prefers-reduced-motion`、清楚 focus ring、足夠對比與至少 44px 的觸控目標。
- **Do:** 將 theme styles 視為外觀皮膚，不得改變資訊密度、元件語意或互動模型。
- **Don't:** 不要使用漸層文字、彩色側邊條、裝飾性 glass、過量 glow、或沒有語義的大面積品牌漸層。
- **Don't:** 不要把金融工具做成加密交易平台、AI 樣板 SaaS，或可愛生活風首頁。
- **Don't:** 不要靠巢狀卡片與大陰影堆層級，也不要用 8 至 10px 當作常態正文。
- **Don't:** 不要在不同頁面為相同概念發明第二套顏色、第二套間距或第二套按鈕語法。
