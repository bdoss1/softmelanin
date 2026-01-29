// ============================================================================
// Soft Melanin MCP - Core Types
// ============================================================================

// Audience Segments
export type Segment =
  | "overextended_professional"
  | "healing_high_achiever"
  | "creative_reclaimer";

// Platform Types
export type Platform =
  | "linkedin_founder"
  | "linkedin_company"
  | "substack";

// Five C's for Triple S STOP hook
export type FiveC =
  | "curiosity"
  | "contradiction"
  | "conflict"
  | "contrast"
  | "controversy";

// Product Offerings
export type Offering =
  | "soft_and_still"
  | "plush_boost"
  | "luxe_shift";

// Product Placement Types
export type ProductPlacement = "body" | "cta";

// A/B Variant Labels
export type ABLabel = "A" | "B";

// Brand Palette Colors
export const BRAND_PALETTE = ["#6e3f2b", "#a6683f", "#d2955e"] as const;
export type BrandPalette = typeof BRAND_PALETTE;

// ============================================================================
// Framework Structures
// ============================================================================

// Triple S Method Structure
export interface TripleS {
  stop: {
    hook: string;
    fiveC: FiveC;
  };
  stay: {
    story: string;
  };
  share: {
    takeaways: string[];
    cta: string;
  };
}

// S.O.F.T. Framework Structure
export interface SOFTFramework {
  separate: string;  // Separate worth from work
  own: string;       // Own your role and boundaries
  filter: string;    // Filter demands and opportunities
  thrive: string;    // Thrive with sustainable systems
}

// Visual Generation Structure
export interface Visual {
  prompt: string;
  palette: BrandPalette;
  quoteCardTextOptions: string[];
}

// Product Mention Structure
export interface ProductMention {
  offering: Offering;
  placement: ProductPlacement;
  text: string;
}

// Growth Optimization Structure
export interface Growth {
  bestPostingTimes: string[];
  repurposingIdeas: string[];
  abVariants?: {
    label: ABLabel;
    hook: string;
  }[];
}

// QA Validation Structure
export interface QAValidation {
  authenticityPass: boolean;
  brandVoicePass: boolean;
  culturalSensitivityPass: boolean;
  businessRelevancePass: boolean;
  errors: string[];
}

// ============================================================================
// Main Content Artifact Type
// ============================================================================

export interface ContentArtifact {
  id?: string;
  platform: Platform;
  segment: Segment;

  // Core content
  hook: string;
  body: string;

  // Framework mappings
  tripleS: TripleS;
  soft: SOFTFramework;

  // Hashtags (3-5 required)
  hashtags: string[];

  // SEO tags (Substack only)
  seoTags?: string[];

  // Visual generation
  visual: Visual;

  // Optional product mentions
  productMentions?: ProductMention[];

  // Growth optimization data
  growth: Growth;

  // QA validation results
  qa: QAValidation;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  seedIdea?: string;
  monthlyTheme?: string;
}

// ============================================================================
// Generation Request Types
// ============================================================================

export interface GenerationRequest {
  seedIdea: string;
  monthlyTheme?: string;
  segments: Segment[];
  platforms: Platform[];
  includeProductMentions?: boolean;
  generateABVariants?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  artifacts: ContentArtifact[];
  errors?: string[];
  generatedAt: Date;
}

// ============================================================================
// Segment Profiles (for prompt context)
// ============================================================================

export interface SegmentProfile {
  name: string;
  description: string;
  wound: string;
  desire: string;
  emotion: string;
  toneGuidance: string;
}

export const SEGMENT_PROFILES: Record<Segment, SegmentProfile> = {
  overextended_professional: {
    name: "Overextended Professional",
    description: "Black women mid-career leaders running on competence",
    wound: "If I rest, I'll fall behind.",
    desire: "Ease without losing edge",
    emotion: "Overcapacity disguised as strength",
    toneGuidance: "Acknowledge the weight without diminishing achievement. Offer permission, not prescription."
  },
  healing_high_achiever: {
    name: "Healing High-Achiever",
    description: "Post-therapy women struggling with integration",
    wound: "I know better, but I still overextend.",
    desire: "Peace that lasts beyond sessions",
    emotion: "Integration fatigue",
    toneGuidance: "Honor the journey. Validate the gap between knowing and being. Offer gentle bridges."
  },
  creative_reclaimer: {
    name: "Creative Reclaimer",
    description: "Entrepreneurs + creatives building without burnout",
    wound: "I can't hold what I built.",
    desire: "Structure that doesn't strangle",
    emotion: "Purpose fatigue",
    toneGuidance: "Celebrate the vision while acknowledging the cost. Offer sustainable scaffolding."
  }
};

// ============================================================================
// Hashtag Constants
// ============================================================================

export const PRIMARY_HASHTAGS = [
  "#SoftMelanin",
  "#SoftnessIsPower",
  "#SoftnessStrategist",
  "#BoundariesAreSoftness"
] as const;

export const SECONDARY_HASHTAGS = {
  wellness: [
    "#SoftLifeCoaching",
    "#SoftHabits",
    "#ThriveInSoftness"
  ],
  identity: [
    "#BlackWomenLead",
    "#SoftPowerMoves",
    "#AuthenticConfidence"
  ],
  business: [
    "#SoftBusinessStrategy",
    "#BlackWomenInBusiness",
    "#FounderEnergy"
  ]
} as const;

// ============================================================================
// Platform Configuration
// ============================================================================

export interface PlatformConfig {
  name: string;
  minWords: number;
  maxWords: number;
  requiresTripleS: boolean;
  requiresSEO: boolean;
  founderThemes?: string[];
  companyThemes?: string[];
  substackThemes?: string[];
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  linkedin_founder: {
    name: "LinkedIn Founder Post",
    minWords: 150,
    maxWords: 300,
    requiresTripleS: true,
    requiresSEO: false,
    founderThemes: [
      "professional reflection through softness",
      "boundary leadership",
      "higher ed + accessibility insight",
      "personal journey narratives"
    ]
  },
  linkedin_company: {
    name: "LinkedIn Company Post",
    minWords: 150,
    maxWords: 300,
    requiresTripleS: true,
    requiresSEO: false,
    companyThemes: [
      "SOFT methodology education",
      "product highlights",
      "business philosophy",
      "emotional boundaries as leadership skill"
    ]
  },
  substack: {
    name: "Substack Article",
    minWords: 1000,
    maxWords: 1500,
    requiresTripleS: false,
    requiresSEO: true,
    substackThemes: [
      "emotional sovereignty",
      "rest as liberation",
      "sustainable growth systems",
      "softness-centered leadership"
    ]
  }
};

// ============================================================================
// Brand Voice Constants
// ============================================================================

export const BRAND_VOICE_PILLARS = [
  {
    name: "Radical Clarity",
    description: "Truth delivered with tenderness"
  },
  {
    name: "Grounded Softness",
    description: "Calm, secure, regulated tone"
  },
  {
    name: "Cultural Fluency",
    description: "Rooted in Black womanhood + liberation"
  },
  {
    name: "Graceful Authority",
    description: "Professional, warm, anti-hustle"
  }
] as const;

export const CADENCE_RULES = [
  "Use rhythmic sentences",
  "Include intentional pauses",
  "Maintain 'trusted sister' energy",
  "Never sound robotic",
  "Avoid generic influencer tone"
] as const;
