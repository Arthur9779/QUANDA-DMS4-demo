import { describe, expect, it, vi } from "vitest";
import {
  configuredTimeoutMs,
  withAbortTimeout,
} from "@/src/lib/ai/withAbortTimeout";

describe("AI request timeouts", () => {
  it("clamps configured values and uses the fallback for invalid input", () => {
    expect(configuredTimeoutMs(undefined, 25_000)).toBe(25_000);
    expect(configuredTimeoutMs("invalid", 25_000)).toBe(25_000);
    expect(configuredTimeoutMs("100", 25_000)).toBe(1_000);
    expect(configuredTimeoutMs("120000", 25_000)).toBe(60_000);
  });

  it("creates a fresh timeout for each generation attempt", async () => {
    vi.useFakeTimers();
    try {
      const run = () =>
        withAbortTimeout(
          1_000,
          (signal) =>
            new Promise<string>((resolve, reject) => {
              const timer = setTimeout(() => resolve("ok"), 750);
              signal.addEventListener("abort", () => {
                clearTimeout(timer);
                reject(new DOMException("Aborted", "AbortError"));
              });
            }),
        );

      const first = run();
      await vi.advanceTimersByTimeAsync(750);
      await expect(first).resolves.toBe("ok");

      const repair = run();
      await vi.advanceTimersByTimeAsync(750);
      await expect(repair).resolves.toBe("ok");
    } finally {
      vi.useRealTimers();
    }
  });
});
