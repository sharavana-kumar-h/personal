import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function assertUserOwnership(currentUserId: string, resourceUserId: string) {
  if (currentUserId !== resourceUserId) {
    throw new Error("Unauthorized");
  }
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return prisma.user.findUnique({
    where: { supabaseAuthId: data.user.id },
    select: { id: true, email: true, name: true, supabaseAuthId: true },
  });
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
