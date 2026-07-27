// monitor-schedule-drift.mjs 型別宣告（#900）：實作以 .mjs 為 SSOT，本檔僅描述既有 export 形狀。
export interface WorkflowRun {
  event: string;
  headBranch?: string | null;
  databaseId?: number;
  createdAt: string;
  conclusion?: string | null;
  status?: string | null;
}

export interface ScheduleDriftEntry {
  workflowName: string;
  databaseId: number | undefined;
  createdAt: string;
  expectedAt: string;
  matchedSchedule: string;
  driftSeconds: number;
  missedSlotsSincePrevious: number | null;
  conclusion: string | null | undefined;
  status: string | null | undefined;
}

export interface ScheduleDriftAnalysis {
  workflowName: string;
  schedules: string[];
  entries: ScheduleDriftEntry[];
  summary: {
    sampleCount: number;
    maxDriftSeconds: number;
    averageDriftSeconds: number;
    totalMissedSlots: number;
  };
}

export interface ScheduledWorkflow {
  filePath: string;
  name: string;
  schedules: string[];
}

export function findLatestScheduledTime(
  cronExpression: string,
  createdAt: string | Date,
  options?: { lookbackMinutes?: number },
): Date | null;

export function analyzeScheduledRuns(input: {
  workflowName: string;
  schedules: string[];
  runs: WorkflowRun[];
  defaultBranch?: string;
}): ScheduleDriftAnalysis;

export function discoverScheduledWorkflowsFromSources(
  sources: { filePath: string; source: string }[],
): ScheduledWorkflow[];

export function discoverScheduledWorkflows(workflowDirectory: string): ScheduledWorkflow[];

export function runScheduleDriftMonitor(options?: Record<string, unknown>): Promise<unknown>;
