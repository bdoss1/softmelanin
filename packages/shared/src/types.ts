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

// ============================================================================
// Social Platform Types
// ============================================================================

export type SocialPlatform = "linkedin" | "substack";
export type LinkedInAccountType = "founder" | "company";
export type ScheduledPostStatus =
  | "pending"
  | "queued"
  | "posting"
  | "published"
  | "failed"
  | "cancelled";

// ============================================================================
// Social Account Types
// ============================================================================

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountType: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: string;
  vanityName?: string;
}

export interface LinkedInOrganization {
  id: string;
  localizedName: string;
  logoUrl?: string;
  vanityName?: string;
}

export interface SubstackPublication {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  logoUrl?: string;
}

// ============================================================================
// Scheduled Post Types
// ============================================================================

export interface ScheduledPost {
  id: string;
  artifactId: string;
  artifact?: ContentArtifact;
  socialAccountId: string;
  socialAccount?: SocialAccount;
  scheduledFor: Date;
  timezone: string;
  status: ScheduledPostStatus;
  publishedAt?: Date;
  externalPostId?: string;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledPostRequest {
  artifactId: string;
  socialAccountId: string;
  scheduledFor: string; // ISO date string
  timezone?: string;
  notes?: string;
}

export interface UpdateScheduledPostRequest {
  scheduledFor?: string;
  timezone?: string;
  status?: ScheduledPostStatus;
  notes?: string;
}

export interface ScheduleResponse {
  success: boolean;
  scheduledPost?: ScheduledPost;
  error?: string;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  scheduledPosts: ScheduledPost[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

// ============================================================================
// Social Posting Types
// ============================================================================

export interface PostToLinkedInRequest {
  artifactId: string;
  socialAccountId: string;
  immediate?: boolean;
}

export interface PostToSubstackRequest {
  artifactId: string;
  socialAccountId: string;
  publishNow?: boolean;
  sendEmail?: boolean;
}

export interface PostResult {
  success: boolean;
  platform: SocialPlatform;
  externalPostId?: string;
  externalUrl?: string;
  error?: string;
  rawResponse?: unknown;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthConnectRequest {
  platform: SocialPlatform;
  accountType?: LinkedInAccountType;
  redirectUri: string;
}

export interface OAuthCallbackData {
  platform: SocialPlatform;
  code: string;
  state?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

// ============================================================================
// Platform API Configs
// ============================================================================

export const LINKEDIN_API_CONFIG = {
  authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  apiBaseUrl: "https://api.linkedin.com/v2",
  scopes: ["openid", "profile", "w_member_social", "r_organization_social", "w_organization_social"],
} as const;

export const SUBSTACK_API_CONFIG = {
  apiBaseUrl: "https://substack.com/api/v1",
} as const;

// ============================================================================
// Posting Time Recommendations
// ============================================================================

export const OPTIMAL_POSTING_TIMES = {
  linkedin: {
    weekday: ["07:00", "08:00", "12:00", "17:00", "18:00"],
    weekend: ["09:00", "10:00", "11:00"],
  },
  substack: {
    weekday: ["06:00", "08:00", "10:00"],
    weekend: ["08:00", "09:00", "10:00"],
  },
} as const;
