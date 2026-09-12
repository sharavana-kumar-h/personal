import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getSessionUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

describe("Supabase Auth server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps only the authenticated Supabase identity to the local user row", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "supabase-user-a" } }, error: null }) },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "local-a", email: "a@example.com", name: "A", supabaseAuthId: "supabase-user-a" } as never);

    await expect(getSessionUser()).resolves.toMatchObject({ id: "local-a", supabaseAuthId: "supabase-user-a" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { supabaseAuthId: "supabase-user-a" },
      select: { id: true, email: true, name: true, supabaseAuthId: true },
    });
  });

  it("rejects unauthenticated access before a protected operation can proceed", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }) },
    } as never);

    await expect(getSessionUser()).resolves.toBeNull();
    await expect(requireUser()).rejects.toThrow("Unauthorized");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
