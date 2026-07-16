import { SYMBOLS, SYMBOL_META, type MarketSymbol } from '../config/market';

export function filterSymbolsByQuery(
  query: string,
  source: readonly MarketSymbol[] = SYMBOLS,
): MarketSymbol[] {
  const keyword = query.trim().toUpperCase();
  if (keyword === '') return [...source];
  return source.filter((symbol) => {
    const meta = SYMBOL_META[symbol];
    return (
      symbol.includes(keyword) ||
      meta.base.includes(keyword) ||
      meta.name.toUpperCase().includes(keyword)
    );
  });
}
