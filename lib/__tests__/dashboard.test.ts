import { describe, expect, it } from "vitest";

import { resolveDashboardRange } from "@/services/dashboard";

describe("dashboard filters", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");

  it("resolves the supported rolling ranges", () => {
    const range = resolveDashboardRange({ range: "30" }, now);

    expect(range.key).toBe("30");
    expect(range.from).toBe("2026-08-14");
    expect(range.to).toBe("2026-09-12");
  });

  it("resolves an inclusive custom range", () => {
    const range = resolveDashboardRange({ range: "custom", from: "2026-08-01", to: "2026-08-10" }, now);

    expect(range.key).toBe("custom");
    expect(range.from).toBe("2026-08-01");
    expect(range.to).toBe("2026-08-10");
    expect(range.end.toISOString()).toBe("2026-08-11T00:00:00.000Z");
  });

  it("falls back to a real rolling range for invalid custom input", () => {
    const range = resolveDashboardRange({ range: "custom", from: "not-a-date", to: "2026-08-10" }, now);

    expect(range.key).toBe("30");
    expect(range.from).toBe("2026-08-14");
  });
});
