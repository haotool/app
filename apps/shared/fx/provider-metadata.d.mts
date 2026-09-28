/** provider-metadata.mjs 型別宣告：實作以 .mjs 為 SSOT。 */
interface FxProviderMetadata<Kind extends 'bank' | 'exchange_shop'> {
  readonly name: string;
  readonly kind: Kind;
  readonly sourceUrl: string;
  readonly termsUrl: string | null;
  readonly redistributionStatus: 'verified' | 'unknown' | 'restricted';
  readonly attribution: string;
}
interface FxAttributionMetadata {
  readonly name: string;
  readonly sourceUrl: string;
  readonly requiredText: string;
  readonly attributionLine: string;
}
export declare const FX_ATTRIBUTION_METADATA: Readonly<{
  exchangeRateApi: FxAttributionMetadata;
}>;
export declare const FX_PROVIDER_METADATA: Readonly<{
  bot: FxProviderMetadata<'bank'>;
  moneybox: FxProviderMetadata<'exchange_shop'>;
}>;
