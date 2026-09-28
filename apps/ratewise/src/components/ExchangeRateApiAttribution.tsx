import { FX_ATTRIBUTION_METADATA } from '../../../shared/fx/provider-metadata.mjs';

export function ExchangeRateApiAttribution() {
  const { sourceUrl, requiredText } = FX_ATTRIBUTION_METADATA.exchangeRateApi;

  return (
    <p className="text-xs text-text-muted">
      資料來源：<a href={sourceUrl}>{requiredText}</a>
    </p>
  );
}
