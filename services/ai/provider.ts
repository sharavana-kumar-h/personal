export type StructuredOutputOptions = {
  name: string;
  schema?: Record<string, unknown>;
};

export type AIProviderRequest = {
  system: string;
  user: string;
  structured?: StructuredOutputOptions;
};

export type AIProvider = {
  generateText(request: AIProviderRequest): Promise<string>;
};
