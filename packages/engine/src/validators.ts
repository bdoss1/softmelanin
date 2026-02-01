import {
  ContentArtifact,
  Platform,
  PLATFORM_CONFIGS,
  PRIMARY_HASHTAGS,
  QAValidation
} from "../../shared/src";

// ============================================================================
// Deterministic Validators (Hard-Fail)
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates word count based on platform requirements
 */
export function validateWordCount(content: string, platform: Platform): ValidationResult {
  const config = PLATFORM_CONFIGS[platform];
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const errors: string[] = [];

  if (wordCount < config.minWords) {
    errors.push(`Word count ${wordCount} is below minimum ${config.minWords} for ${config.name}`);
  }
  if (wordCount > config.maxWords) {
    errors.push(`Word count ${wordCount} exceeds maximum ${config.maxWords} for ${config.name}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates mobile whitespace formatting for LinkedIn posts
 */
export function validateWhitespaceFormatting(content: string, platform: Platform): ValidationResult {
  const errors: string[] = [];

  if (platform === "linkedin_founder" || platform === "linkedin_company") {
    // Check for proper line breaks (should have whitespace between paragraphs)
    const paragraphs = content.split(/\n\n+/);

    // LinkedIn posts should have multiple short paragraphs for mobile readability
    if (paragraphs.length < 3) {
      errors.push("LinkedIn posts should have at least 3 paragraphs for mobile readability");
    }

    // Check for overly long paragraphs (mobile unfriendly)
    for (const para of paragraphs) {
      const paraWords = para.split(/\s+/).filter(w => w.length > 0).length;
      if (paraWords > 50) {
        errors.push("Paragraphs should be under 50 words for mobile readability");
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates SOFT framework mapping is present and meaningful
 */
export function validateSOFTMapping(artifact: ContentArtifact): ValidationResult {
  const errors: string[] = [];
  const soft = artifact.soft;

  if (!soft.separate || soft.separate.length < 10) {
    errors.push("SOFT 'Separate' element must be meaningful (min 10 chars)");
  }
  if (!soft.own || soft.own.length < 10) {
    errors.push("SOFT 'Own' element must be meaningful (min 10 chars)");
  }
  if (!soft.filter || soft.filter.length < 10) {
    errors.push("SOFT 'Filter' element must be meaningful (min 10 chars)");
  }
  if (!soft.thrive || soft.thrive.length < 10) {
    errors.push("SOFT 'Thrive' element must be meaningful (min 10 chars)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates Triple S method is present for LinkedIn posts
 */
export function validateTripleS(artifact: ContentArtifact): ValidationResult {
  const errors: string[] = [];
  const config = PLATFORM_CONFIGS[artifact.platform];

  if (config.requiresTripleS) {
    const tripleS = artifact.tripleS;

    if (!tripleS.stop.hook || tripleS.stop.hook.length < 5) {
      errors.push("Triple S STOP hook must be present");
    }
    if (!tripleS.stop.fiveC) {
      errors.push("Triple S must specify which of the 5 C's the hook uses");
    }
    if (!tripleS.stay.story || tripleS.stay.story.length < 20) {
      errors.push("Triple S STAY story must be meaningful (min 20 chars)");
    }
    if (!tripleS.share.takeaways || tripleS.share.takeaways.length === 0) {
      errors.push("Triple S SHARE must include at least one takeaway");
    }
    if (!tripleS.share.cta || tripleS.share.cta.length < 5) {
      errors.push("Triple S SHARE must include a CTA");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates CTA is reflective, not debate-inviting
 */
export function validateCTA(cta: string): ValidationResult {
  const errors: string[] = [];
  const ctaLower = cta.toLowerCase();

  // Debate-inviting patterns to avoid
  const debatePatterns = [
    "what do you think?",
    "agree or disagree",
    "am i right",
    "change my mind",
    "fight me",
    "prove me wrong",
    "debate me",
    "hot take"
  ];

  for (const pattern of debatePatterns) {
    if (ctaLower.includes(pattern)) {
      errors.push(`CTA contains debate-inviting language: "${pattern}". Use reflective CTAs instead.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates hashtag requirements
 */
export function validateHashtags(hashtags: string[]): ValidationResult {
  const errors: string[] = [];

  // Check count (3-5)
  if (hashtags.length < 3) {
    errors.push(`Hashtag count ${hashtags.length} is below minimum 3`);
  }
  if (hashtags.length > 5) {
    errors.push(`Hashtag count ${hashtags.length} exceeds maximum 5`);
  }

  // Check primary hashtag count (2-3 required)
  const primarySet = new Set(PRIMARY_HASHTAGS);
  const primaryCount = hashtags.filter(tag => primarySet.has(tag as typeof PRIMARY_HASHTAGS[number])).length;

  if (primaryCount < 2) {
    errors.push(`Only ${primaryCount} primary brand hashtags found. Minimum 2 required from: ${PRIMARY_HASHTAGS.join(", ")}`);
  }

  // Check for # prefix
  for (const tag of hashtags) {
    if (!tag.startsWith("#")) {
      errors.push(`Hashtag "${tag}" must start with #`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates SEO tags for Substack
 */
export function validateSEOTags(artifact: ContentArtifact): ValidationResult {
  const errors: string[] = [];
  const config = PLATFORM_CONFIGS[artifact.platform];

  if (config.requiresSEO) {
    if (!artifact.seoTags || artifact.seoTags.length === 0) {
      errors.push("Substack articles require SEO tags");
    } else if (artifact.seoTags.length < 3) {
      errors.push("Substack articles should have at least 3 SEO tags");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Brand voice validation patterns
 */
const ROBOTIC_PATTERNS = [
  /as an ai/i,
  /i don't have feelings/i,
  /i cannot/i,
  /i'm sorry, but/i,
  /it's important to note/i,
  /it should be noted/i,
  /in conclusion/i,
  /to summarize/i,
  /therefore/i,
  /furthermore/i,
  /moreover/i,
  /in my opinion/i,
  /i believe that/i
];

const INFLUENCER_PATTERNS = [
  /drop a .* if/i,
  /smash that/i,
  /link in bio/i,
  /swipe up/i,
  /don't forget to like/i,
  /subscribe for more/i,
  /follow for more/i,
  /double tap/i,
  /tag someone/i,
  /share this with/i,
  /repost if/i
];

/**
 * Validates brand voice authenticity
 */
export function validateBrandVoice(content: string): ValidationResult {
  const errors: string[] = [];

  // Check for robotic patterns
  for (const pattern of ROBOTIC_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Content contains robotic language pattern. Remove AI-sounding phrases.`);
      break;
    }
  }

  // Check for generic influencer patterns
  for (const pattern of INFLUENCER_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Content contains generic influencer language. Maintain brand voice.`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates visual prompt requirements
 */
export function validateVisual(artifact: ContentArtifact): ValidationResult {
  const errors: string[] = [];

  if (!artifact.visual.prompt || artifact.visual.prompt.length < 20) {
    errors.push("Visual prompt must be at least 20 characters for useful generation");
  }

  if (!artifact.visual.quoteCardTextOptions || artifact.visual.quoteCardTextOptions.length < 1) {
    errors.push("At least one quote card text option required");
  }

  // Check palette is correct
  if (artifact.visual.palette[0] !== "#6e3f2b" ||
      artifact.visual.palette[1] !== "#a6683f" ||
      artifact.visual.palette[2] !== "#d2955e") {
    errors.push("Visual palette must use brand colors: #6e3f2b, #a6683f, #d2955e");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Master Validation Function
// ============================================================================

export interface FullValidationResult {
  isValid: boolean;
  qa: QAValidation;
}

/**
 * Runs all deterministic validators on a content artifact
 */
export function validateArtifact(artifact: ContentArtifact): FullValidationResult {
  const allErrors: string[] = [];

  // Combine hook + body for content validation
  const fullContent = `${artifact.hook}\n\n${artifact.body}`;

  // Run all validators
  const wordCountResult = validateWordCount(fullContent, artifact.platform);
  const whitespaceResult = validateWhitespaceFormatting(fullContent, artifact.platform);
  const softResult = validateSOFTMapping(artifact);
  const tripleSResult = validateTripleS(artifact);
  const ctaResult = validateCTA(artifact.tripleS.share.cta);
  const hashtagResult = validateHashtags(artifact.hashtags);
  const seoResult = validateSEOTags(artifact);
  const brandVoiceResult = validateBrandVoice(fullContent);
  const visualResult = validateVisual(artifact);

  // Collect all errors
  allErrors.push(...wordCountResult.errors);
  allErrors.push(...whitespaceResult.errors);
  allErrors.push(...softResult.errors);
  allErrors.push(...tripleSResult.errors);
  allErrors.push(...ctaResult.errors);
  allErrors.push(...hashtagResult.errors);
  allErrors.push(...seoResult.errors);
  allErrors.push(...brandVoiceResult.errors);
  allErrors.push(...visualResult.errors);

  // Build QA object
  const qa: QAValidation = {
    authenticityPass: brandVoiceResult.isValid,
    brandVoicePass: brandVoiceResult.isValid && ctaResult.isValid,
    culturalSensitivityPass: true, // Would need more sophisticated analysis
    businessRelevancePass: softResult.isValid && tripleSResult.isValid,
    errors: allErrors
  };

  return {
    isValid: allErrors.length === 0,
    qa
  };
}

/**
 * Check if content needs rewrite based on validation
 */
export function needsRewrite(result: FullValidationResult): boolean {
  return !result.isValid;
}

/**
 * Get rewrite guidance based on validation errors
 */
export function getRewriteGuidance(result: FullValidationResult): string {
  if (result.isValid) {
    return "No rewrite needed - all validations passed.";
  }

  const guidance: string[] = [
    "Content failed validation. Please address the following issues:",
    ""
  ];

  for (const error of result.qa.errors) {
    guidance.push(`• ${error}`);
  }

  return guidance.join("\n");
}
