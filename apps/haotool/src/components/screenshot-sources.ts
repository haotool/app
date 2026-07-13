/** 截圖路徑契約 SSOT：public/screenshots/<toolId>-mobile.{avif,webp}（素材代理產出）。 */
export function screenshotSources(toolId: string): { avif: string; webp: string } {
  return {
    avif: `/screenshots/${toolId}-mobile.avif`,
    webp: `/screenshots/${toolId}-mobile.webp`,
  };
}
