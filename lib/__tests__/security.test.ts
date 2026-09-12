import { describe, expect, it } from "vitest";

import { calculateBodyFatMass, calculateBmr, calculateLeanMass } from "@/lib/body-composition";
import { consumeRateLimit, clearRateLimits } from "@/lib/rate-limit";
import { bodyCompositionSnapshotSchema } from "@/lib/validation-body";
import { resolveDashboardRange } from "@/services/dashboard";

describe("security and integrity controls", () => {
  it("does not treat zero body-fat percentage as missing", () => {
    expect(calculateBodyFatMass(80, 0)).toBe(0);
    expect(calculateLeanMass(80, 0)).toBe(80);
  });

  it("preserves blank optional body metrics as absent", () => {
    const result = bodyCompositionSnapshotSchema.safeParse({ date: "2026-09-12", weightKg: 75, pbf: "", segmentLean: { leftArm: "" } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pbf).toBeUndefined();
      expect(result.data.segmentLean?.leftArm).toBeUndefined();
    }
  });

  it("uses a neutral BMR formula for other gender", () => {
    expect(calculateBmr({ weightKg: 75, heightCm: 180, age: 30, gender: "other" })).toBe(1725);
  });

  it("rate-limits repeated actions and resets after the window", () => {
    clearRateLimits();
    expect(consumeRateLimit("user-a", 2, 1000, 0).allowed).toBe(true);
    expect(consumeRateLimit("user-a", 2, 1000, 1).allowed).toBe(true);
    expect(consumeRateLimit("user-a", 2, 1000, 2).allowed).toBe(false);
    expect(consumeRateLimit("user-a", 2, 1000, 1001).allowed).toBe(true);
  });

  it("keeps dashboard range parsing bounded to date inputs", () => {
    const range = resolveDashboardRange({ range: "custom", from: "2026-01-01<script>", to: "2026-01-02" }, new Date("2026-09-12T00:00:00Z"));
    expect(range.key).toBe("30");
  });
});
