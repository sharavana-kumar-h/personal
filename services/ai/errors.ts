export type AiErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "timeout"
  | "network_failure"
  | "rate_limited"
  | "service_failure"
  | "malformed_response"
  | "invalid_output"
  | "bad_request";

export class AiServiceError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly retryable = false,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}
