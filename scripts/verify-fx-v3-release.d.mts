export function verifyDataRoot(dataRoot: string): {
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
