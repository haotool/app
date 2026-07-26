export declare const SETTINGS_KEY: string;
export declare const SETTINGS_SCHEMA_VERSION: number;
export declare function settingsFixture(patch: Record<string, unknown>): string;
export declare function readSetting(
  page: { evaluate: (fn: unknown, arg: unknown) => Promise<unknown> },
  field: string,
): Promise<unknown>;
