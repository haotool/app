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
export declare function validateSourceQuote(value: unknown): value is SourceQuote;
export declare function validateQuoteSnapshot(value: unknown): value is QuoteSnapshot;
export declare function validateEstimateRequest(value: unknown): value is EstimateRequest;
export declare function validateEstimateResult(value: unknown): value is EstimateResult;
export declare function validateSelectionContext(value: unknown): value is SelectionContext;
export declare function validateDerivedCrossQuote(value: unknown): value is DerivedCrossQuote;
export declare function validateObjectReference(value: unknown): value is ObjectReference;
export declare function validateProvider(value: unknown): value is Provider;
export declare function validateProviderSnapshot(value: unknown): value is ProviderSnapshot;
export declare function validateReleaseManifest(value: unknown): value is ReleaseManifest;
export declare function validateCurrentRelease(value: unknown): value is CurrentRelease;
export declare function validateDerivedEstimateResult(
  value: unknown,
): value is DerivedEstimateResult;
