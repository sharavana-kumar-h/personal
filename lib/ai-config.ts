import "server-only";

export const aiEnv = {
  apiKey: process.env.XAI_API_KEY,
  baseUrl: process.env.XAI_API_BASE_URL ?? "https://api.x.ai/v1",
  model: process.env.XAI_MODEL ?? "grok-4.6",
  timeoutMs: Number(process.env.XAI_TIMEOUT_MS ?? 20000),
};
