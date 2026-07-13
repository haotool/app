/**
 * S4-c 頂部 1px 品牌藍 scroll progress（motion-deep-dive §2 S4-c）。
 * 純 CSS scroll-timeline（@supports 包裹）；不支援的瀏覽器維持 scaleX(0) 不可見，
 * 零 JS fallback（scroll listener 的主執行緒成本 > 1px 裝飾價值）。僅 Home 掛載。
 */
export default function ScrollProgress() {
  return <div className="scroll-progress" aria-hidden="true" />;
}
