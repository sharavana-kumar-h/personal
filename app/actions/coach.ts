"use server";

import { requireUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { AiServiceError, xaiService } from "@/services/ai";
import type { CoachMode } from "@/services/coach-context";
import { buildCoachContext } from "@/services/coach-context";
import { prisma } from "@/lib/db";

export type CoachMessageState = {
  mode: CoachMode;
  conversationId?: string;
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  error?: string;
};

function isCoachMode(value: string): value is CoachMode {
  return value === "nutrition" || value === "workout";
}

export async function sendCoachMessage(
  previousState: CoachMessageState,
  formData: FormData,
): Promise<CoachMessageState> {
  const user = await requireUser();
  const modeValue = String(formData.get("mode") ?? previousState.mode);
  const mode = isCoachMode(modeValue) ? modeValue : previousState.mode;
  const message = String(formData.get("message") ?? "").trim();
  const conversationIdValue = String(formData.get("conversationId") ?? "").trim();

  if (!message) {
    return { ...previousState, mode, error: "Write a question or choose a prompt first." };
  }

  if (message.length > 2000) {
    return { ...previousState, mode, error: "Coach messages must be 2,000 characters or fewer." };
  }

  const coachLimit = consumeRateLimit(`coach:${user.id}`, 20, 60 * 1000);
  if (!coachLimit.allowed) {
    return { ...previousState, mode, error: "The coach is rate-limited for a moment. Please retry shortly." };
  }

  const conversation = conversationIdValue
    ? await prisma.coachConversation.findFirst({
        where: { id: conversationIdValue, userId: user.id, mode },
      })
    : null;
  const ownedConversation = conversation ?? await prisma.coachConversation.create({
    data: { userId: user.id, mode },
  });

  try {
    const context = await buildCoachContext(user.id, mode);
    const answer = await xaiService.chat(message, context);
    await prisma.$transaction([
      prisma.coachMessage.create({
        data: { conversationId: ownedConversation.id, role: "user", content: message },
        select: { id: true, role: true, content: true },
      }),
      prisma.coachMessage.create({
        data: { conversationId: ownedConversation.id, role: "assistant", content: answer },
        select: { id: true, role: true, content: true },
      }),
      prisma.coachConversation.update({
        where: { id: ownedConversation.id },
        data: { updatedAt: new Date() },
      }),
    ]);
    const persistedMessages = await prisma.coachMessage.findMany({
      where: {
        conversationId: ownedConversation.id,
        conversation: { userId: user.id },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true },
    });

    return {
      mode,
      conversationId: ownedConversation.id,
      messages: persistedMessages.map((item) => ({
        id: item.id,
        role: item.role === "assistant" ? "assistant" as const : "user" as const,
        content: item.content,
      })),
    };
  } catch (error) {
    const messageText = error instanceof AiServiceError
      ? error.message
      : "The coach is temporarily unavailable. Please retry.";

    return {
      ...previousState,
      mode,
      conversationId: ownedConversation.id,
      error: messageText,
    };
  }
}
