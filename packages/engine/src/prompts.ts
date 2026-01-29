import {
  Platform,
  Segment,
  SEGMENT_PROFILES,
  PLATFORM_CONFIGS,
  BRAND_VOICE_PILLARS,
  CADENCE_RULES,
  PRIMARY_HASHTAGS,
  SECONDARY_HASHTAGS
} from "@soft-melanin/shared";

// ============================================================================
// System Prompt Components
// ============================================================================

export const BRAND_CONTEXT = `
# BRAND: Soft Melanin
## Founder: Courtney A. Doss, M.Ed.
## Title: The Softness Strategist™

## Mission
Empower Black women to redefine strength through softness — emotional sovereignty, rest, boundaries, joy, and radical self-honoring.

## Brand Voice Pillars
${BRAND_VOICE_PILLARS.map(p => `- **${p.name}**: ${p.description}`).join("\n")}

## Cadence Rules
${CADENCE_RULES.map(r => `- ${r}`).join("\n")}

## Key Principle
Every piece of content must sound like a trusted sister speaking truth with tenderness. Never robotic. Never generic influencer tone.
`;

export const SOFT_FRAMEWORK = `
# S.O.F.T. Framework™

Every content artifact MUST include explicit mapping to this framework:

- **S - Separate**: Separate worth from work
- **O - Own**: Own your role and boundaries
- **F - Filter**: Filter demands and opportunities
- **T - Thrive**: Thrive with sustainable systems

This framework is the intellectual backbone of all Soft Melanin content.
`;

export const TRIPLE_S_METHOD = `
# Triple S Method™ (Required for LinkedIn)

Every LinkedIn post MUST follow this structure:

## STOP - The Hook
Use one of the 5 C's to create a scroll-stopping first line:
- **Curiosity**: Creates intrigue, makes reader need to know more
- **Contradiction**: Challenges conventional wisdom
- **Conflict**: Names a tension the reader feels
- **Contrast**: Juxtaposes two states or ideas
- **Controversy**: Takes a thoughtful stance (not inflammatory)

## STAY - The Story
Build resonance through:
- Personal narrative or client story
- Cultural context relevant to Black womanhood
- Emotional truth that validates the reader's experience

## SHARE - The Takeaways
Close with:
- 2-3 concrete takeaways or reflections
- A reflective CTA (NOT debate-inviting)
- Questions that prompt self-reflection, not argument
`;

// ============================================================================
// Segment-Specific Prompts
// ============================================================================

export function getSegmentPrompt(segment: Segment): string {
  const profile = SEGMENT_PROFILES[segment];

  return `
# Target Audience Segment: ${profile.name}

## Description
${profile.description}

## Core Wound
"${profile.wound}"

## Deepest Desire
${profile.desire}

## Emotional State
${profile.emotion}

## Tone Guidance for This Segment
${profile.toneGuidance}

Tailor your language, examples, and emotional resonance specifically to this segment.
`;
}

// ============================================================================
// Platform-Specific Prompts
// ============================================================================

export function getPlatformPrompt(platform: Platform): string {
  const config = PLATFORM_CONFIGS[platform];

  let themeList = "";
  if (config.founderThemes) {
    themeList = config.founderThemes.map(t => `- ${t}`).join("\n");
  } else if (config.companyThemes) {
    themeList = config.companyThemes.map(t => `- ${t}`).join("\n");
  } else if (config.substackThemes) {
    themeList = config.substackThemes.map(t => `- ${t}`).join("\n");
  }

  return `
# Platform: ${config.name}

## Requirements
- Word count: ${config.minWords} - ${config.maxWords} words
- Triple S Method required: ${config.requiresTripleS ? "YES" : "NO"}
- SEO tags required: ${config.requiresSEO ? "YES" : "NO"}

## Content Themes
${themeList}

${platform.includes("linkedin") ? `
## LinkedIn Formatting Rules
- Strong first line (hook)
- Mobile whitespace formatting (short paragraphs, line breaks between)
- Reflective CTA only (no debate-inviting questions)
- 3-5 hashtags with 2-3 primary brand hashtags
` : ""}

${platform === "substack" ? `
## Substack Formatting Rules
- 1,000-1,500 words
- Clear subheadings
- Framework breakdown section
- Cultural context woven throughout
- Actionable practices
- SEO tags for discoverability
- Weekly publication cadence
` : ""}
`;
}

// ============================================================================
// Hashtag Guidance
// ============================================================================

export const HASHTAG_GUIDANCE = `
# Hashtag Strategy

## Primary Brand Hashtags (Use 2-3 of these)
${PRIMARY_HASHTAGS.map(h => `- ${h}`).join("\n")}

## Secondary Rotation Tags (Use 1-2 from relevant category)

### Wellness
${SECONDARY_HASHTAGS.wellness.map(h => `- ${h}`).join("\n")}

### Identity
${SECONDARY_HASHTAGS.identity.map(h => `- ${h}`).join("\n")}

### Business
${SECONDARY_HASHTAGS.business.map(h => `- ${h}`).join("\n")}

## Rules
- Total: 3-5 hashtags per post
- Must include 2-3 primary brand hashtags
- Blend branded + niche + reach tags
`;

// ============================================================================
// Visual Prompt Guidance
// ============================================================================

export const VISUAL_GUIDANCE = `
# Visual Generation Requirements

## Brand Palette (REQUIRED)
- Primary: #6e3f2b (deep brown)
- Secondary: #a6683f (warm brown)
- Accent: #d2955e (golden brown)

## AI Image Prompt Guidelines
Create prompts suitable for Midjourney or DALL·E that:
- Feature Black women in moments of peace, joy, or soft power
- Use warm, earthy tones matching the brand palette
- Avoid stereotypical imagery
- Convey emotional sovereignty and groundedness
- Include specific artistic style directions

## Quote Card Text Guidelines
Generate 2-3 quote options that:
- Capture the essence of the content
- Are concise (under 15 words ideal)
- Work visually on a card format
- Embody brand voice
`;

// ============================================================================
// Product Integration Guidance
// ============================================================================

export const PRODUCT_GUIDANCE = `
# Product Integration (Natural, Not Pushy)

## Available Offerings

### Soft & Still Coloring Pages
- What: Meditative coloring pages for stress relief
- When to mention: Content about rest, mindfulness, creative outlets
- Tone: Gentle invitation, not hard sell

### Plush Boost Coaching
- What: Individual coaching program
- When to mention: Content about personal transformation, boundary setting
- Tone: Supportive suggestion for deeper work

### Luxe Shift Coaching
- What: Premium coaching experience
- When to mention: Content about major life transitions, leadership evolution
- Tone: Aspirational but accessible

## Integration Rules
- Maximum 1 product mention per artifact
- Must feel natural, not forced
- Can appear in body or CTA
- Never make the product the main focus
`;

// ============================================================================
// Authenticity Check Prompt
// ============================================================================

export const AUTHENTICITY_CHECK = `
# Final Authenticity Check

Before finalizing, verify the content:

1. **Human Sound Test**: Read it aloud. Does it sound like a real person or an AI?
2. **Sister Test**: Would this sound natural coming from a trusted friend?
3. **Cultural Test**: Is the cultural context authentic and respectful?
4. **Soft Test**: Does this embody softness as power, not weakness?

## Red Flags to Eliminate
- Any phrase that sounds like AI-generated text
- Generic motivational language
- Phrases like "in today's world" or "it's important to"
- Overly formal or academic tone
- Hustle culture language (grind, crush, slay)
- Generic influencer engagement bait

## Required Energy
- Warm but boundaried
- Clear but kind
- Strong but soft
- Real but refined
`;

// ============================================================================
// Full Generation Prompt Builder
// ============================================================================

export interface GenerationPromptConfig {
  seedIdea: string;
  monthlyTheme?: string;
  segment: Segment;
  platform: Platform;
  includeProductMentions?: boolean;
  isRewrite?: boolean;
  previousErrors?: string[];
}

export function buildGenerationPrompt(config: GenerationPromptConfig): string {
  const sections = [
    BRAND_CONTEXT,
    SOFT_FRAMEWORK,
    getSegmentPrompt(config.segment),
    getPlatformPrompt(config.platform)
  ];

  if (config.platform.includes("linkedin")) {
    sections.push(TRIPLE_S_METHOD);
  }

  sections.push(HASHTAG_GUIDANCE);
  sections.push(VISUAL_GUIDANCE);

  if (config.includeProductMentions) {
    sections.push(PRODUCT_GUIDANCE);
  }

  sections.push(AUTHENTICITY_CHECK);

  // Add the specific task
  let taskSection = `
# YOUR TASK

Create content based on this seed idea:
"${config.seedIdea}"
`;

  if (config.monthlyTheme) {
    taskSection += `\nMonthly Theme: "${config.monthlyTheme}"\n`;
  }

  if (config.isRewrite && config.previousErrors) {
    taskSection += `
## REWRITE REQUIRED

Your previous attempt failed validation. Fix these specific issues:
${config.previousErrors.map(e => `- ${e}`).join("\n")}

Make targeted fixes while preserving the content's core message.
`;
  }

  taskSection += `
## OUTPUT FORMAT

Return a valid JSON object matching the ContentArtifact schema with all required fields:
- platform, segment, hook, body
- tripleS (stop with hook and fiveC, stay with story, share with takeaways and cta)
- soft (separate, own, filter, thrive)
- hashtags (3-5 with 2-3 primary brand tags)
- visual (prompt, palette as ["#6e3f2b","#a6683f","#d2955e"], quoteCardTextOptions)
- growth (bestPostingTimes, repurposingIdeas)
- seoTags (if Substack)
- productMentions (if requested, array of {offering, placement, text})

Ensure the content passes all deterministic validators.
`;

  sections.push(taskSection);

  return sections.join("\n\n---\n\n");
}

// ============================================================================
// Rewrite Prompt
// ============================================================================

export function buildRewritePrompt(
  originalContent: string,
  errors: string[]
): string {
  return `
# REWRITE REQUIRED

The following content failed validation:

\`\`\`
${originalContent}
\`\`\`

## Validation Errors
${errors.map(e => `- ${e}`).join("\n")}

## Instructions
1. Review each error carefully
2. Make targeted fixes to address each issue
3. Preserve the core message and tone
4. Ensure the rewrite passes all validators
5. Return the complete corrected JSON artifact

${AUTHENTICITY_CHECK}
`;
}
