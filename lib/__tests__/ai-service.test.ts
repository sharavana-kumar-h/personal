import { describe, expect, it } from "vitest";

import { AiServiceError, XaiService } from "@/services/ai";

describe("xAI service", () => {
  it("sends a server-side Responses API request with structured output", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;

    const service = new XaiService({
      apiKey: "test-only-key",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-test",
      fetchImpl: async (input, init) => {
        requestUrl = String(input);
        requestInit = init;
        return new Response(JSON.stringify({
          output_text: JSON.stringify({
            foods: [{
              name: "Oats",
              quantityGrams: 80,
              calories: 300,
              protein: 10,
              carbohydrates: 50,
              fat: 6,
              fiber: 8,
              isAiEstimate: true,
              confidence: 0.8,
            }],
            notes: "Estimate only",
          }),
        }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });

    const result = await service.parseFood("80 grams of oats");
    const body = JSON.parse(String(requestInit?.body));

    expect(result.foods[0]?.name).toBe("Oats");
    expect(requestUrl).toBe("https://api.x.ai/v1/responses");
    expect(requestInit?.method).toBe("POST");
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe("Bearer test-only-key");
    expect(body.model).toBe("grok-test");
    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.strict).toBe(true);
    expect(JSON.stringify(body)).not.toContain("test-only-key");
  });

  it("rejects structured output that fails Zod validation", async () => {
    const service = new XaiService({
      apiKey: "test-only-key",
      fetchImpl: async () => new Response(JSON.stringify({ output_text: JSON.stringify({ foods: [], notes: 42 }) }), { status: 200 }),
    });

    await expect(service.parseFood("unknown meal")).rejects.toMatchObject({
      code: "invalid_output",
      retryable: true,
    });
  });

  it("returns a useful configuration error without making a request", async () => {
    let called = false;
    const service = new XaiService({
      apiKey: "",
      fetchImpl: async () => {
        called = true;
        return new Response(null, { status: 200 });
      },
    });

    await expect(service.chat("What should I eat?"))
      .rejects.toBeInstanceOf(AiServiceError);
    expect(called).toBe(false);
  });

  it("maps rate limits and server failures to retryable errors", async () => {
    const rateLimited = new XaiService({
      apiKey: "test-only-key",
      fetchImpl: async () => new Response(null, { status: 429 }),
    });
    const unavailable = new XaiService({
      apiKey: "test-only-key",
      fetchImpl: async () => new Response(null, { status: 503 }),
    });

    await expect(rateLimited.chat("hello")).rejects.toMatchObject({ code: "rate_limited", retryable: true });
    await expect(unavailable.chat("hello")).rejects.toMatchObject({ code: "unavailable", retryable: true });
  });
});
