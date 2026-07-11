// Timing a whole `withRetry(() => { await paceGenerate(); ... })` block measures
// the rate-limiter's window wait and the retry backoff, not the model. On the
// free tier that's tens of seconds of sleeping per item, which swamps the real
// latency. This records only the innermost call, from the last attempt.
export type LatencyTimer = {
  measure<T>(fn: () => Promise<T>): Promise<T>;
  readonly latencyMs: number;
};

export function createLatencyTimer(): LatencyTimer {
  let latencyMs = 0;
  return {
    async measure<T>(fn: () => Promise<T>): Promise<T> {
      const t0 = performance.now();
      try {
        return await fn();
      } finally {
        latencyMs = performance.now() - t0;
      }
    },
    get latencyMs() {
      return latencyMs;
    },
  };
}
