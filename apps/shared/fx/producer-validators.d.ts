import type {
  SourceQuote,
  QuoteSnapshot,
  EstimateRequest,
  EstimateResult,
  SelectionContext,
  DerivedCrossQuote,
  ObjectReference,
  Provider,
  ProviderSnapshot,
  ReleaseManifest,
  CurrentRelease,
  DerivedEstimateResult,
} from './types';
export declare function validateProducerSourceQuote(value: unknown): value is SourceQuote;
export declare function validateProducerQuoteSnapshot(value: unknown): value is QuoteSnapshot;
export declare function validateProducerEstimateRequest(value: unknown): value is EstimateRequest;
export declare function validateProducerEstimateResult(value: unknown): value is EstimateResult;
export declare function validateProducerSelectionContext(value: unknown): value is SelectionContext;
export declare function validateProducerDerivedCrossQuote(
  value: unknown,
): value is DerivedCrossQuote;
export declare function validateProducerObjectReference(value: unknown): value is ObjectReference;
export declare function validateProducerProvider(value: unknown): value is Provider;
export declare function validateProducerProviderSnapshot(value: unknown): value is ProviderSnapshot;
export declare function validateProducerReleaseManifest(value: unknown): value is ReleaseManifest;
export declare function validateProducerCurrentRelease(value: unknown): value is CurrentRelease;
export declare function validateProducerDerivedEstimateResult(
  value: unknown,
): value is DerivedEstimateResult;
