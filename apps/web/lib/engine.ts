import "server-only";

import { ContentGenerator, createLLMProvider, LLMConfig } from "@soft-melanin/engine";

// Get LLM configuration from environment
function getLLMConfig(): LLMConfig {
  const provider = (process.env["LLM_PROVIDER"] || "mock") as LLMConfig["provider"];

  switch (provider) {
    case "openai":
      return {
        provider: "openai",
        apiKey: process.env["OPENAI_API_KEY"],
        model: process.env["OPENAI_MODEL"] || "gpt-4-turbo-preview",
        baseUrl: process.env["OPENAI_BASE_URL"],
      };
    case "anthropic":
      return {
        provider: "anthropic",
        apiKey: process.env["ANTHROPIC_API_KEY"],
        model: process.env["ANTHROPIC_MODEL"] || "claude-3-sonnet-20240229",
      };
    case "mock":
    default:
      return { provider: "mock" };
  }
}

// Create and export the content generator
export function getContentGenerator(): ContentGenerator {
  const config = getLLMConfig();
  const llmProvider = createLLMProvider(config);

  return new ContentGenerator({
    llmProvider,
    maxRewriteAttempts: 2,
  });
}

// Singleton instance for reuse
let generatorInstance: ContentGenerator | null = null;

export function getSharedGenerator(): ContentGenerator {
  if (!generatorInstance) {
    generatorInstance = getContentGenerator();
  }
  return generatorInstance;
}
