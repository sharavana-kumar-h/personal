import { describe, expect, it } from "vitest";

import { assertUserOwnership } from "@/lib/auth";

describe("server authorization", () => {
  it("allows access only when resource ownership matches", () => {
    expect(() => assertUserOwnership("user-a", "user-a")).not.toThrow();
  });

  it("rejects an IDOR attempt with another user's resource ID", () => {
    expect(() => assertUserOwnership("user-a", "user-b")).toThrow("Unauthorized");
  });
});
