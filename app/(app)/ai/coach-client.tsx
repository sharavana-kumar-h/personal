"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { sendCoachMessage, type CoachMessageState } from "@/app/actions/coach";
import type { CoachMode } from "@/services/coach-context";

type CoachMessage = CoachMessageState["messages"][number];

const prompts: Record<CoachMode, string[]> = {
  nutrition: [
    "Analyze my nutrition today.",
    "How much protein do I still need today?",
    "What should I eat based on my remaining calories?",
    "Show me my biggest weaknesses based on my actual data.",
  ],
  workout: [
    "Analyze my workout.",
    "How am I progressing compared with last month?",
    "What should I focus on improving?",
    "Show me my biggest weaknesses based on my actual data.",
  ],
};

function messageLabel(message: CoachMessage) {
  return message.role === "assistant" ? "AI recommendation" : "You";
}

export default function CoachClient({
  mode,
  initialState,
}: {
  mode: CoachMode;
  initialState: CoachMessageState;
}) {
  const [state, formAction, pending] = useActionState(sendCoachMessage, initialState);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">AI coach</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">A grounded view of your training</h2>
          <p className="mt-2 max-w-2xl text-slate-400">The coach only receives your authenticated records for this mode. It does not fill gaps with invented data.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300">Back to dashboard</Link>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        <Link href="/ai?mode=nutrition" className={`border-b-2 px-4 py-3 text-sm font-semibold ${mode === "nutrition" ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>Nutrition Coach</Link>
        <Link href="/ai?mode=workout" className={`border-b-2 px-4 py-3 text-sm font-semibold ${mode === "workout" ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>Workout Coach</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex min-h-[620px] flex-col rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {state.messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
                Ask about your {mode === "nutrition" ? "food, goals, or recent intake" : "program, sessions, strength, or cardio"}.
              </div>
            ) : null}
            {state.messages.map((message) => (
              <div key={message.id} className={`max-w-[92%] rounded-xl p-4 ${message.role === "assistant" ? "border border-emerald-500/20 bg-emerald-500/5" : "ml-auto bg-slate-800"}`}>
                <div className="mb-2 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em]">
                  <span className={message.role === "assistant" ? "text-emerald-300" : "text-slate-400"}>{messageLabel(message)}</span>
                  {message.role === "assistant" ? <span className="text-slate-500">Recommendation</span> : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{message.content}</p>
              </div>
            ))}
            {pending ? <div className="text-sm text-slate-500">The coach is reviewing your stored records...</div> : null}
            {state.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">{state.error} Submit the message again to retry.</div> : null}
          </div>

          <form action={formAction} className="border-t border-slate-800 p-4">
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="conversationId" value={state.conversationId ?? ""} />
            <div className="flex gap-3">
              <textarea name="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your actual records..." rows={3} maxLength={2000} className="min-w-0 flex-1 resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-400" />
              <button type="submit" disabled={pending || !draft.trim()} className="self-end rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Useful prompts</p>
            <div className="mt-4 space-y-2">
              {prompts[mode].map((prompt) => <button key={prompt} type="button" onClick={() => setDraft(prompt)} className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-300 hover:border-emerald-500 hover:text-white">{prompt}</button>)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Data labels</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="font-semibold text-white">Measured</span> values from recorded measurement sources.</p>
              <p><span className="font-semibold text-white">User-entered</span> values you logged.</p>
              <p><span className="font-semibold text-white">Calculated</span> totals and progression derived from your records.</p>
              <p><span className="font-semibold text-amber-300">Estimated</span> values are not verified facts.</p>
              <p><span className="font-semibold text-emerald-300">AI recommendation</span> is advice for this conversation only.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
