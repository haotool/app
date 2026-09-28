export function verifyDataRoot(
  dataRoot: string,
  requiredProviders?: string[],
): {
  generatedAt: string;
  providers: Record<
    string,
    {
      history: number;
      dateGaps: { after: string; before: string; missingDays: number }[];
      quarantined: number;
    }
  >;
};
export function parseRequiredProviders(args: string[]): string[];
