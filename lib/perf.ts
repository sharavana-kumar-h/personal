export type PerformanceContext = {
  requestId: string;
};

export function createPerformanceContext(): PerformanceContext {
  return { requestId: crypto.randomUUID() };
}

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
