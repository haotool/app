export function shouldRenderStructuredData(robots: string): boolean {
  return !robots.toLowerCase().includes('noindex');
}
