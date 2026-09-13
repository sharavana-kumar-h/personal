import { headers } from "next/headers";

export type PerformanceContext = {
  requestId: string;
};

export function createPerformanceContext(): PerformanceContext {
  return { requestId: crypto.randomUUID() };
}

export async function getPerformanceContext(): Promise<PerformanceContext> {
  const requestId = (await headers()).get("x-request-id");
  return { requestId: requestId || crypto.randomUUID() };
}

// TODO: Remove or reduce detailed performance instrumentation after this diagnosis.
export async function measurePerformance<T>(
  operation: string,
  context: PerformanceContext,
  work: () => Promise<T>,
) {
  const startedAt = performance.now();

  try {
    return await work();
  } finally {
    console.log("[perf]", {
      operation,
      durationMs: Math.round(performance.now() - startedAt),
      requestId: context.requestId,
    });
  }
}

export function measurePerformanceSync<T>(
  operation: string,
  context: PerformanceContext,
  work: () => T,
) {
  const startedAt = performance.now();

  try {
    return work();
  } finally {
    console.log("[perf]", {
      operation,
      durationMs: Math.round(performance.now() - startedAt),
      requestId: context.requestId,
    });
  }
}
