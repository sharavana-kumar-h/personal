import { describe, expect, it } from "vitest";

import { AIService } from "@/services/ai";
import { AiServiceError } from "@/services/ai/errors";
import { DeepSeekProvider } from "@/services/ai/deepseek";

describe("DeepSeek AI service", () => {
  it("uses the documented chat completions endpoint and keeps the key out of the body", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const provider = new DeepSeekProvider({
      apiKey: "test-only-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-flash",
      fetchImpl: async (input, init) => {
        requestUrl = String(input);
        requestInit = init;
        return new Response(JSON.stringify({
          choices: [{ message: { content: JSON.stringify({
            foods: [{ name: "Oats", quantityGrams: 80, calories: 300, protein: 10, carbohydrates: 50, fat: 6, fiber: 8, isAiEstimate: true, confidence: 0.8 }],
            notes: "Estimate only",
          }) } }],
        }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });

    const result = await new AIService({ provider }).parseFoodEntry("80 grams of oats");
    const body = JSON.parse(String(requestInit?.body));

    expect(result.foods[0]?.name).toBe("Oats");
    expect(requestUrl).toBe("https://api.deepseek.com/chat/completions");
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe("Bearer test-only-key");
    expect(body.model).toBe("deepseek-flash");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(JSON.stringify(body)).not.toContain("test-only-key");
  });

  it("rejects malformed and schema-invalid AI responses", async () => {
    const malformed = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), { status: 200 }) });
    const invalid = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ foods: [], notes: 42 }) } }] }), { status: 200 }) });

    await expect(new AIService({ provider: malformed }).parseFoodEntry("unknown meal")).rejects.toMatchObject({ code: "malformed_response", retryable: true });
    await expect(new AIService({ provider: invalid }).parseFoodEntry("unknown meal")).rejects.toMatchObject({ code: "invalid_output", retryable: true });
  });

  it("handles missing and invalid API keys without exposing secrets", async () => {
    let called = false;
    const missing = new DeepSeekProvider({ apiKey: "", fetchImpl: async () => { called = true; return new Response(null); } });
    await expect(missing.generateText({ system: "system", user: "user" })).rejects.toMatchObject({ code: "missing_api_key" });
    expect(called).toBe(false);

    const invalid = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => new Response(null, { status: 401 }) });
    await expect(invalid.generateText({ system: "system", user: "user" })).rejects.toMatchObject({ code: "invalid_api_key" });
  });

  it("maps timeout, network, rate-limit, and service failures", async () => {
    const rateLimited = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => new Response(null, { status: 429 }) });
    const unavailable = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => new Response(null, { status: 503 }) });
    const network = new DeepSeekProvider({ apiKey: "test-only-key", fetchImpl: async () => { throw new Error("offline"); } });

    await expect(rateLimited.generateText({ system: "system", user: "user" })).rejects.toMatchObject({ code: "rate_limited", retryable: true });
    await expect(unavailable.generateText({ system: "system", user: "user" })).rejects.toMatchObject({ code: "service_failure", retryable: true });
    await expect(network.generateText({ system: "system", user: "user" })).rejects.toMatchObject({ code: "network_failure", retryable: true });
    expect(new AiServiceError("timeout", "timeout", true).retryable).toBe(true);
  });
});
