import { SYMBOLS, SYMBOL_META, type MarketSymbol } from '../config/market';
import { isPprSymbol, PPR_ENABLED } from '../features/ppr/config';

// PPR flag 關閉時自可見清單隱藏；其餘過濾邏輯不變。
const VISIBLE_SYMBOLS: readonly MarketSymbol[] = SYMBOLS.filter(
  (symbol) => PPR_ENABLED || !isPprSymbol(symbol),
);

export function filterSymbolsByQuery(
  query: string,
  source: readonly MarketSymbol[] = VISIBLE_SYMBOLS,
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
