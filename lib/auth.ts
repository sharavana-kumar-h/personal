import { cache } from "react";

import { prisma } from "@/lib/db";
import { measurePerformance, type PerformanceContext } from "@/lib/perf";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function assertUserOwnership(currentUserId: string, resourceUserId: string) {
  if (currentUserId !== resourceUserId) {
    throw new Error("Unauthorized");
  }
}

type AuthDiagnostics = {
  requestId?: string;
  operation?: string;
};

function safeErrorDetails(error: unknown) {
  const value = error instanceof Error ? error : new Error(String(error));
  const prismaCode = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;

  return {
    errorName: value.name,
    errorMessage: value.message.replace(/(?:postgres(?:ql)?):\/\/\S+/gi, "[redacted-database-url]"),
    prismaCode,
    errorStack: value.stack?.replace(/(?:postgres(?:ql)?):\/\/\S+/gi, "[redacted-database-url]"),
  };
}

async function getSessionUserImpl(diagnostics: AuthDiagnostics = {}) {
  const context: PerformanceContext = { requestId: diagnostics.requestId ?? crypto.randomUUID() };
  const { data, error } = await measurePerformance("auth.supabase.getUser", context, async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.auth.getUser();
  });

  if (error || !data.user) {
    if (diagnostics.operation) {
      console.error("[dashboard-auth-failure]", {
        operation: diagnostics.operation,
        requestId: diagnostics.requestId,
        hasAuthenticatedUser: Boolean(data.user),
        hasLocalUser: false,
        ...safeErrorDetails(error ?? new Error("Supabase user was not found.")),
      });
    }
    return null;
  }

  try {
    const localUser = await measurePerformance("auth.prisma.localUserLookup", context, () => prisma.user.findUnique({
      where: { supabaseAuthId: data.user.id },
      select: { id: true, email: true, name: true, supabaseAuthId: true },
    }));

    if (!localUser && diagnostics.operation) {
      console.error("[dashboard-auth-failure]", {
        operation: diagnostics.operation,
        requestId: diagnostics.requestId,
        hasAuthenticatedUser: true,
        hasLocalUser: false,
        errorName: "LocalUserNotFound",
        errorMessage: "Authenticated Supabase user has no local Prisma User record.",
      });
    }

    return localUser;
  } catch (lookupError) {
    if (diagnostics.operation) {
      console.error("[dashboard-auth-failure]", {
        operation: diagnostics.operation,
        requestId: diagnostics.requestId,
        hasAuthenticatedUser: true,
        hasLocalUser: false,
        ...safeErrorDetails(lookupError),
      });
    }
    throw lookupError;
  }
}

const getCachedSessionUser = cache(() => getSessionUserImpl());

export function getSessionUser(diagnostics: AuthDiagnostics = {}) {
  return Object.keys(diagnostics).length === 0
    ? getCachedSessionUser()
    : getSessionUserImpl(diagnostics);
}

export async function requireUser(diagnostics: AuthDiagnostics = {}) {
  const user = await getSessionUser(diagnostics);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
