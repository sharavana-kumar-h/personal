import { prisma } from "@/lib/db";
import type { CoachMode } from "@/services/coach-context";

export async function getCoachConversation(userId: string, mode: CoachMode, conversationId?: string) {
  return prisma.coachConversation.findFirst({
    where: {
      userId,
      mode,
      ...(conversationId ? { id: conversationId } : {}),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
