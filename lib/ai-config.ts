import "server-only";

export const aiEnv = {
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseUrl: process.env.DEEPSEEK_API_BASE_URL ?? "https://api.deepseek.com",
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-flash",
  timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS ?? 20000),
};

export const deepSeekEnv = aiEnv;
