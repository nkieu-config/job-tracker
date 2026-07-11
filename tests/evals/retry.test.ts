import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiError } from "@/lib/errors";
import { classify, withRetry, maxAttemptsFromEnv } from "../../evals/lib/retry";

describe("maxAttemptsFromEnv", () => {
  it("defaults to 3 total attempts when unset or blank", () => {
    expect(maxAttemptsFromEnv(undefined)).toBe(3);
    expect(maxAttemptsFromEnv("")).toBe(3);
    expect(maxAttemptsFromEnv("  ")).toBe(3);
  });

  it("accepts an explicit attempt count, where 1 means no retries", () => {
    expect(maxAttemptsFromEnv("1")).toBe(1);
    expect(maxAttemptsFromEnv("5")).toBe(5);
  });

  it("rejects values that would skip the API call entirely", () => {
    for (const bad of ["0", "-1", "abc", "1.5", "NaN"]) {
      expect(() => maxAttemptsFromEnv(bad)).toThrow(/EVAL_MAX_ATTEMPTS/);
    }
  });
});

describe("AiError kinds", () => {
  it("treats transport and timeout failures as retryable", () => {
    expect(new AiError("boom", "transport").retryable).toBe(true);
    expect(new AiError("slow", "timeout").retryable).toBe(true);
  });

  it("treats unusable model output as a non-retryable model failure", () => {
    for (const kind of ["empty", "malformed", "schema"] as const) {
      const err = new AiError("bad output", kind);
      expect(err.retryable).toBe(false);
      expect(err.isModelOutputFailure).toBe(true);
    }
  });

  it("defaults to transport so an unclassified throw is never blamed on the model", () => {
    expect(new AiError("boom").kind).toBe("transport");
    expect(new AiError("boom").isModelOutputFailure).toBe(false);
  });

  it("treats a missing key as neither retryable nor the model's fault", () => {
    const err = new AiError("AI is not configured.", "config");
    expect(err.retryable).toBe(false);
    expect(err.isModelOutputFailure).toBe(false);
  });
});

describe("classify", () => {
  it("separates API failures from model-output failures", () => {
    expect(classify(new AiError("net", "transport")).status).toBe("api-error");
    expect(classify(new AiError("timed out", "timeout")).status).toBe("api-error");
    expect(classify(new AiError("bad json", "malformed")).status).toBe(
      "invalid-output",
    );
    expect(classify(new AiError("bad shape", "schema")).status).toBe(
      "invalid-output",
    );
  });

  it("counts an unknown throw as an API error, not a model failure", () => {
    expect(classify(new Error("socket hang up")).status).toBe("api-error");
    expect(classify("weird").status).toBe("api-error");
  });

  it("counts a missing key as an API error, not a model failure", () => {
    expect(classify(new AiError("not configured", "config")).status).toBe(
      "api-error",
    );
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the API exactly once when only one attempt is allowed", async () => {
    const fn = vi.fn().mockRejectedValue(new AiError("net", "transport"));

    const assertion = expect(withRetry(fn, undefined, 1)).rejects.toThrow("net");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries a transport error and returns the eventual success", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new AiError("net", "transport"))
      .mockResolvedValueOnce("ok");

    const settled = withRetry(fn);
    await vi.runAllTimersAsync();

    await expect(settled).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry unusable model output", async () => {
    const fn = vi.fn().mockRejectedValue(new AiError("bad shape", "schema"));

    const assertion = expect(withRetry(fn)).rejects.toThrow("bad shape");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the attempt limit and rethrows", async () => {
    const fn = vi.fn().mockRejectedValue(new AiError("net", "transport"));
    const onRetry = vi.fn();

    const assertion = expect(withRetry(fn, onRetry)).rejects.toThrow("net");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially between attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new AiError("net", "transport"));
    const delays: number[] = [];
    const spy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation(((cb: () => void, ms?: number) => {
        delays.push(ms ?? 0);
        cb();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout);

    await expect(withRetry(fn)).rejects.toThrow("net");
    expect(delays).toEqual([2_000, 4_000]);

    spy.mockRestore();
  });
});
