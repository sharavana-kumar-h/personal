import { assertUserOwnership, requireUser } from "@/lib/auth";

export async function enforceUserAccess(resourceUserId: string) {
  const user = await requireUser();
  assertUserOwnership(user.id, resourceUserId);
  return user;
}
