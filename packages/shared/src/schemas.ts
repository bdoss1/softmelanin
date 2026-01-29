import { z } from "zod";
import { BRAND_PALETTE, PRIMARY_HASHTAGS } from "./types";

// ============================================================================
// Base Enum Schemas
// ============================================================================

export const SegmentSchema = z.enum([
  "overextended_professional",
  "healing_high_achiever",
  "creative_reclaimer"
]);

export const PlatformSchema = z.enum([
  "linkedin_founder",
  "linkedin_company",
  "substack"
]);

export const FiveCSchema = z.enum([
  "curiosity",
  "contradiction",
  "conflict",
  "contrast",
  "controversy"
]);

export const OfferingSchema = z.enum([
  "soft_and_still",
  "plush_boost",
  "luxe_shift"
]);

export const ProductPlacementSchema = z.enum(["body", "cta"]);

export const ABLabelSchema = z.enum(["A", "B"]);

// ============================================================================
// Framework Schemas
// ============================================================================

export const TripleSSchema = z.object({
  stop: z.object({
    hook: z.string().min(1, "Hook is required"),
    fiveC: FiveCSchema
  }),
  stay: z.object({
    story: z.string().min(1, "Story is required")
  }),
  share: z.object({
    takeaways: z.array(z.string()).min(1, "At least one takeaway required"),
    cta: z.string().min(1, "CTA is required")
  })
});

export const SOFTFrameworkSchema = z.object({
  separate: z.string().min(1, "Separate element is required"),
  own: z.string().min(1, "Own element is required"),
  filter: z.string().min(1, "Filter element is required"),
  thrive: z.string().min(1, "Thrive element is required")
});

export const VisualSchema = z.object({
  prompt: z.string().min(10, "Visual prompt must be at least 10 characters"),
  palette: z.tuple([
    z.literal(BRAND_PALETTE[0]),
    z.literal(BRAND_PALETTE[1]),
    z.literal(BRAND_PALETTE[2])
  ]),
  quoteCardTextOptions: z.array(z.string()).min(1, "At least one quote card option required")
});

export const ProductMentionSchema = z.object({
  offering: OfferingSchema,
  placement: ProductPlacementSchema,
  text: z.string().min(1, "Product mention text is required")
});

export const GrowthSchema = z.object({
  bestPostingTimes: z.array(z.string()).min(1, "At least one posting time required"),
  repurposingIdeas: z.array(z.string()).min(1, "At least one repurposing idea required"),
  abVariants: z.array(z.object({
    label: ABLabelSchema,
    hook: z.string().min(1)
  })).optional()
});

export const QAValidationSchema = z.object({
  authenticityPass: z.boolean(),
  brandVoicePass: z.boolean(),
  culturalSensitivityPass: z.boolean(),
  businessRelevancePass: z.boolean(),
  errors: z.array(z.string())
});

// ============================================================================
// Hashtag Validation Schema
// ============================================================================

const primaryHashtagSet = new Set(PRIMARY_HASHTAGS);

export const HashtagsSchema = z.array(z.string())
  .min(3, "At least 3 hashtags required")
  .max(5, "Maximum 5 hashtags allowed")
  .refine((tags) => {
    const primaryCount = tags.filter(tag => primaryHashtagSet.has(tag as typeof PRIMARY_HASHTAGS[number])).length;
    return primaryCount >= 2;
  }, "At least 2 primary brand hashtags required");

// ============================================================================
// Content Artifact Schema
// ============================================================================

export const ContentArtifactSchema = z.object({
  id: z.string().optional(),
  platform: PlatformSchema,
  segment: SegmentSchema,

  hook: z.string().min(1, "Hook is required"),
  body: z.string().min(1, "Body is required"),

  tripleS: TripleSSchema,
  soft: SOFTFrameworkSchema,

  hashtags: HashtagsSchema,
  seoTags: z.array(z.string()).optional(),

  visual: VisualSchema,
  productMentions: z.array(ProductMentionSchema).optional(),
  growth: GrowthSchema,
  qa: QAValidationSchema,

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  seedIdea: z.string().optional(),
  monthlyTheme: z.string().optional()
});

// ============================================================================
// Generation Request/Response Schemas
// ============================================================================

export const GenerationRequestSchema = z.object({
  seedIdea: z.string().min(5, "Seed idea must be at least 5 characters"),
  monthlyTheme: z.string().optional(),
  segments: z.array(SegmentSchema).min(1, "At least one segment required"),
  platforms: z.array(PlatformSchema).min(1, "At least one platform required"),
  includeProductMentions: z.boolean().optional(),
  generateABVariants: z.boolean().optional()
});

export const GenerationResponseSchema = z.object({
  success: z.boolean(),
  artifacts: z.array(ContentArtifactSchema),
  errors: z.array(z.string()).optional(),
  generatedAt: z.date()
});

// ============================================================================
// Type Exports from Schemas
// ============================================================================

export type SegmentType = z.infer<typeof SegmentSchema>;
export type PlatformType = z.infer<typeof PlatformSchema>;
export type FiveCType = z.infer<typeof FiveCSchema>;
export type OfferingType = z.infer<typeof OfferingSchema>;
export type TripleSType = z.infer<typeof TripleSSchema>;
export type SOFTFrameworkType = z.infer<typeof SOFTFrameworkSchema>;
export type VisualType = z.infer<typeof VisualSchema>;
export type ProductMentionType = z.infer<typeof ProductMentionSchema>;
export type GrowthType = z.infer<typeof GrowthSchema>;
export type QAValidationType = z.infer<typeof QAValidationSchema>;
export type ContentArtifactType = z.infer<typeof ContentArtifactSchema>;
export type GenerationRequestType = z.infer<typeof GenerationRequestSchema>;
export type GenerationResponseType = z.infer<typeof GenerationResponseSchema>;
