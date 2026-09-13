import { requireUser } from "@/lib/auth";
import { createPerformanceContext, measurePerformance } from "@/lib/perf";
import type { CoachMessageState } from "@/app/actions/coach";
import type { CoachMode } from "@/services/coach-context";
import { getCoachConversation } from "@/services/coach-conversations";
import CoachClient from "./coach-client";

function parseMode(value: string | undefined): CoachMode {
  return value === "workout" ? "workout" : "nutrition";
}

export default async function AiCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; conversationId?: string }>;
}) {
  const context = createPerformanceContext();
  const user = await requireUser();
  const params = await searchParams;
  const mode = parseMode(params.mode);
  const conversation = await measurePerformance("page.ai.data", context, () => getCoachConversation(user.id, mode, params.conversationId, context));
  const initialState: CoachMessageState = {
    mode,
    conversationId: conversation?.id,
    messages: conversation?.messages.map((message) => ({
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    })) ?? [],
  };

  return <CoachClient mode={mode} initialState={initialState} />;
}
