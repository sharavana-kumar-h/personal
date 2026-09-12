import { describe, expect, it } from "vitest";

import { registerSchema, loginSchema } from "@/lib/validation";

describe("authentication validation", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "user@example.com",
      password: "securepassword",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email input", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "not-an-email",
      password: "securepassword",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "securepassword",
    });

    expect(result.success).toBe(true);
  });
});
