// 幣別 icon 可插拔解析：vendor SVG（assets/coins/）建映射，缺檔回 null 由 UI 走字母 fallback。
const iconModules = import.meta.glob<string>('../assets/coins/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const icons = new Map<string, string>();
for (const [path, url] of Object.entries(iconModules)) {
  const base = path
    .split('/')
    .at(-1)
    ?.replace(/\.svg$/, '')
    .toUpperCase();
  if (base !== undefined) icons.set(base, url);
}

export function getCoinIcon(base: string): string | null {
  return icons.get(base.toUpperCase()) ?? null;
}
