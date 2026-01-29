import {
  ContentArtifact,
  GenerationRequest,
  GenerationResponse,
  Platform,
  Segment,
  BRAND_PALETTE
} from "@soft-melanin/shared";
import { LLMProvider } from "./llm";
import { buildGenerationPrompt, buildRewritePrompt } from "./prompts";
import { validateArtifact, FullValidationResult } from "./validators";

// ============================================================================
// Content Generator
// ============================================================================

export interface GeneratorConfig {
  llmProvider: LLMProvider;
  maxRewriteAttempts?: number;
}

export class ContentGenerator {
  private llm: LLMProvider;
  private maxRewriteAttempts: number;

  constructor(config: GeneratorConfig) {
    this.llm = config.llmProvider;
    this.maxRewriteAttempts = config.maxRewriteAttempts ?? 2;
  }

  /**
   * Parse JSON from LLM response, handling potential markdown code blocks
   */
  private parseJSON(response: string): unknown {
    // Remove markdown code blocks if present
    let cleaned = response.trim();

    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }

    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }

    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  }

  /**
   * Generate a single content artifact with validation and rewrite loop
   */
  async generateArtifact(
    seedIdea: string,
    segment: Segment,
    platform: Platform,
    options?: {
      monthlyTheme?: string;
      includeProductMentions?: boolean;
      generateABVariants?: boolean;
    }
  ): Promise<{ artifact: ContentArtifact; attempts: number; validation: FullValidationResult }> {
    let attempts = 0;
    let lastErrors: string[] = [];
    let artifact: ContentArtifact | null = null;
    let validation: FullValidationResult | null = null;

    while (attempts <= this.maxRewriteAttempts) {
      attempts++;

      try {
        // Build the prompt
        const prompt = buildGenerationPrompt({
          seedIdea,
          monthlyTheme: options?.monthlyTheme,
          segment,
          platform,
          includeProductMentions: options?.includeProductMentions,
          isRewrite: attempts > 1,
          previousErrors: attempts > 1 ? lastErrors : undefined
        });

        // Generate content
        const response = await this.llm.generate(prompt, {
          temperature: attempts === 1 ? 0.7 : 0.5 // Lower temperature for rewrites
        });

        // Parse response
        const parsed = this.parseJSON(response) as ContentArtifact;

        // Ensure required fields and fix palette
        artifact = this.normalizeArtifact(parsed, segment, platform, seedIdea, options?.monthlyTheme);

        // Validate
        validation = validateArtifact(artifact);

        if (validation.isValid) {
          // Update QA with validation results
          artifact.qa = validation.qa;
          return { artifact, attempts, validation };
        }

        // Store errors for next attempt
        lastErrors = validation.qa.errors;

      } catch (error) {
        lastErrors = [error instanceof Error ? error.message : "Unknown error during generation"];
      }
    }

    // If we exhausted retries, return the last artifact with errors
    if (artifact && validation) {
      artifact.qa = validation.qa;
      return { artifact, attempts, validation };
    }

    // Final fallback - return error artifact
    throw new Error(`Failed to generate valid content after ${attempts} attempts. Errors: ${lastErrors.join(", ")}`);
  }

  /**
   * Normalize artifact to ensure all required fields are present
   */
  private normalizeArtifact(
    parsed: Partial<ContentArtifact>,
    segment: Segment,
    platform: Platform,
    seedIdea: string,
    monthlyTheme?: string
  ): ContentArtifact {
    return {
      platform,
      segment,
      hook: parsed.hook || "",
      body: parsed.body || "",
      tripleS: parsed.tripleS || {
        stop: { hook: "", fiveC: "curiosity" },
        stay: { story: "" },
        share: { takeaways: [], cta: "" }
      },
      soft: parsed.soft || {
        separate: "",
        own: "",
        filter: "",
        thrive: ""
      },
      hashtags: parsed.hashtags || [],
      seoTags: parsed.seoTags,
      visual: {
        prompt: parsed.visual?.prompt || "",
        palette: BRAND_PALETTE,
        quoteCardTextOptions: parsed.visual?.quoteCardTextOptions || []
      },
      productMentions: parsed.productMentions,
      growth: parsed.growth || {
        bestPostingTimes: [],
        repurposingIdeas: [],
        abVariants: undefined
      },
      qa: parsed.qa || {
        authenticityPass: false,
        brandVoicePass: false,
        culturalSensitivityPass: false,
        businessRelevancePass: false,
        errors: []
      },
      seedIdea,
      monthlyTheme,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate multiple artifacts based on request
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const artifacts: ContentArtifact[] = [];
    const errors: string[] = [];

    // Generate for each combination of segment and platform
    for (const segment of request.segments) {
      for (const platform of request.platforms) {
        try {
          const result = await this.generateArtifact(
            request.seedIdea,
            segment,
            platform,
            {
              monthlyTheme: request.monthlyTheme,
              includeProductMentions: request.includeProductMentions,
              generateABVariants: request.generateABVariants
            }
          );

          artifacts.push(result.artifact);

          if (!result.validation.isValid) {
            errors.push(
              `${platform}/${segment}: Generated with ${result.validation.qa.errors.length} validation errors after ${result.attempts} attempts`
            );
          }
        } catch (error) {
          errors.push(
            `${platform}/${segment}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    }

    return {
      success: errors.length === 0,
      artifacts,
      errors: errors.length > 0 ? errors : undefined,
      generatedAt: new Date()
    };
  }

  /**
   * Rewrite a specific artifact with targeted fixes
   */
  async rewriteArtifact(
    artifact: ContentArtifact,
    specificErrors: string[]
  ): Promise<{ artifact: ContentArtifact; validation: FullValidationResult }> {
    const prompt = buildRewritePrompt(
      JSON.stringify(artifact, null, 2),
      specificErrors
    );

    const response = await this.llm.generate(prompt, {
      temperature: 0.5
    });

    const parsed = this.parseJSON(response) as ContentArtifact;
    const normalized = this.normalizeArtifact(
      parsed,
      artifact.segment,
      artifact.platform,
      artifact.seedIdea || "",
      artifact.monthlyTheme
    );

    const validation = validateArtifact(normalized);
    normalized.qa = validation.qa;

    return { artifact: normalized, validation };
  }
}

// ============================================================================
// Batch Generation Utilities
// ============================================================================

export interface BatchGenerationRequest {
  seedIdea: string;
  monthlyTheme?: string;
  includeProductMentions?: boolean;
  generateABVariants?: boolean;
}

/**
 * Generate the acceptance test batch:
 * - 3 Founder posts (all segments)
 * - 2 Company posts
 * - 1 Substack outline + draft
 */
export async function generateAcceptanceTestBatch(
  generator: ContentGenerator,
  request: BatchGenerationRequest
): Promise<GenerationResponse> {
  const allArtifacts: ContentArtifact[] = [];
  const allErrors: string[] = [];

  // 3 Founder posts (all segments)
  const founderResponse = await generator.generate({
    seedIdea: request.seedIdea,
    monthlyTheme: request.monthlyTheme,
    segments: ["overextended_professional", "healing_high_achiever", "creative_reclaimer"],
    platforms: ["linkedin_founder"],
    includeProductMentions: request.includeProductMentions,
    generateABVariants: request.generateABVariants
  });
  allArtifacts.push(...founderResponse.artifacts);
  if (founderResponse.errors) {
    allErrors.push(...founderResponse.errors);
  }

  // 2 Company posts (pick 2 segments)
  const companyResponse = await generator.generate({
    seedIdea: request.seedIdea,
    monthlyTheme: request.monthlyTheme,
    segments: ["overextended_professional", "healing_high_achiever"],
    platforms: ["linkedin_company"],
    includeProductMentions: request.includeProductMentions,
    generateABVariants: request.generateABVariants
  });
  allArtifacts.push(...companyResponse.artifacts);
  if (companyResponse.errors) {
    allErrors.push(...companyResponse.errors);
  }

  // 1 Substack article
  const substackResponse = await generator.generate({
    seedIdea: request.seedIdea,
    monthlyTheme: request.monthlyTheme,
    segments: ["overextended_professional"],
    platforms: ["substack"],
    includeProductMentions: request.includeProductMentions,
    generateABVariants: false
  });
  allArtifacts.push(...substackResponse.artifacts);
  if (substackResponse.errors) {
    allErrors.push(...substackResponse.errors);
  }

  return {
    success: allErrors.length === 0,
    artifacts: allArtifacts,
    errors: allErrors.length > 0 ? allErrors : undefined,
    generatedAt: new Date()
  };
}
