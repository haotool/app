---
'@app/ratewise': patch
---

重構 useCurrencyConverter — 9 個 handler 補上 useCallback

- handleFromAmountChange、handleToAmountChange 補上 useCallback（deps: []）
- quickAmount 補上 useCallback（deps: mode, baseCurrency, handleMultiAmountChange）
- swapCurrencies 補上 useCallback（deps: storeSwapCurrencies, toAmount, fromAmount）
- toggleFavorite、reorderFavorites 補上 useCallback（deps: store actions）
- addToHistory 補上 useCallback（deps: fromCurrency, toCurrency, amounts, showToast, t）
- clearAllHistory 補上 useCallback（deps: []）
- reconvertFromHistory 補上 useCallback（deps: setFromCurrency, setToCurrency）
