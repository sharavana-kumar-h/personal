import "server-only";

import { deepSeekEnv } from "@/lib/ai-config";
import type { AIProvider, AIProviderRequest } from "@/services/ai/provider";
import { AiServiceError } from "@/services/ai/errors";

type FetchLike = typeof fetch;

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export type DeepSeekProviderOptions = {
  fetchImpl?: FetchLike;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

export class DeepSeekProvider implements AIProvider {
  private readonly fetchImpl: FetchLike;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: DeepSeekProviderOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.apiKey = options.apiKey ?? deepSeekEnv.apiKey;
    this.baseUrl = (options.baseUrl ?? deepSeekEnv.baseUrl).replace(/\/$/, "");
    this.model = options.model ?? deepSeekEnv.model;
    this.timeoutMs = options.timeoutMs ?? deepSeekEnv.timeoutMs;
  }

  async generateText(request: AIProviderRequest) {
    if (!this.apiKey) {
      throw new AiServiceError("missing_api_key", "The DeepSeek service is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          ...(request.structured ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new AiServiceError("invalid_api_key", "The DeepSeek API key was rejected.");
      }

      if (response.status === 429) {
        throw new AiServiceError("rate_limited", "DeepSeek is rate-limited. Please retry shortly.", true, 429);
      }

      if (!response.ok) {
        const retryable = response.status >= 500;
        throw new AiServiceError(
          retryable ? "service_failure" : "bad_request",
          retryable ? "DeepSeek is temporarily unavailable." : "DeepSeek rejected the request.",
          retryable,
          response.status,
        );
      }

      let payload: DeepSeekResponse;
      try {
        payload = await response.json() as DeepSeekResponse;
      } catch {
        throw new AiServiceError("malformed_response", "DeepSeek returned an unreadable response.", true, response.status);
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new AiServiceError("malformed_response", "DeepSeek returned no usable content.", true, response.status);
      }

      return content;
    } catch (error) {
      if (error instanceof AiServiceError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AiServiceError("timeout", "The DeepSeek request timed out. Please retry.", true);
      }
      throw new AiServiceError("network_failure", "DeepSeek could not be reached. Please retry.", true);
    } finally {
      clearTimeout(timeout);
    }
  }
}
