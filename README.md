# Soft Melanin MCP — Softness Strategist™ Content Engine

A production-ready content intelligence engine and admin dashboard for Soft Melanin, built with Next.js, shadcn/ui, and TypeScript.

## Overview

This system transforms minimal inputs (seed ideas, framework elements, monthly themes) into fully brand-aligned content across multiple platforms:

- **LinkedIn Founder Posts** — Professional reflection through softness
- **LinkedIn Company Posts** — SOFT methodology education
- **Substack Articles** — Deep-dive content with cultural context
- **AI Visual Prompts** — Midjourney/DALL-E ready prompts
- **Quote Cards** — Brand-aligned text options
- **Hashtag Strategy** — Optimized tag combinations

## Brand Foundation

**Brand:** Soft Melanin
**Founder:** Courtney A. Doss, M.Ed.
**Title:** The Softness Strategist™

**Mission:** Empower Black women to redefine strength through softness — emotional sovereignty, rest, boundaries, joy, and radical self-honoring.

## Key Features

### Embedded Frameworks

#### S.O.F.T. Framework™
- **S** - Separate worth from work
- **O** - Own your role and boundaries
- **F** - Filter demands and opportunities
- **T** - Thrive with sustainable systems

#### Triple S Method™ (LinkedIn)
- **STOP** — Hook using 5 C's (Curiosity, Contradiction, Conflict, Contrast, Controversy)
- **STAY** — Story + resonance
- **SHARE** — Takeaways + reflective CTA

### Audience Segments

1. **Overextended Professional** — Mid-career leaders running on competence
2. **Healing High-Achiever** — Post-therapy women struggling with integration
3. **Creative Reclaimer** — Entrepreneurs building without burnout

### Deterministic Validation

All content passes through hard validators:
- Word count enforcement (150-300 for LinkedIn, 1000-1500 for Substack)
- Mobile whitespace formatting check
- SOFT + Triple S mapping verification
- CTA debate-check (no debate-inviting language)
- Hashtag validation (3-5 tags, 2-3 primary brand tags)
- Brand voice authenticity check
- Automatic rewrite loop (max 2 retries)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Database:** SQLite via Prisma
- **Validation:** Zod schemas
- **LLM:** Abstracted provider (OpenAI, Anthropic, or Mock)
- **Monorepo:** pnpm workspaces + Turborepo

## Project Structure

```
soft-melanin-mcp/
├── apps/
│   └── web/                    # Next.js Admin Dashboard
│       ├── app/
│       │   ├── api/
│       │   │   ├── generate/   # Content generation endpoint
│       │   │   └── artifacts/  # Content library endpoint
│       │   ├── library/        # Content library page
│       │   └── page.tsx        # Main generator page
│       ├── components/ui/      # shadcn components
│       └── lib/                # Utilities + engine config
├── packages/
│   ├── engine/                 # Content generation engine
│   │   └── src/
│   │       ├── generator.ts    # Main generation logic
│   │       ├── validators.ts   # Deterministic validators
│   │       ├── prompts.ts      # Prompt templates
│   │       └── llm.ts          # LLM provider abstraction
│   └── shared/                 # Shared types and schemas
│       └── src/
│           ├── types.ts        # TypeScript types
│           └── schemas.ts      # Zod validation schemas
├── prisma/
│   └── schema.prisma           # Database schema
├── examples/
│   └── sample_outputs.json     # Acceptance test outputs
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml         # Workspace config
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd soft-melanin-mcp

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# LLM Provider: "openai", "anthropic", or "mock"
LLM_PROVIDER="mock"

# OpenAI (if using)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# Anthropic (if using)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-sonnet-20240229"
```

## Usage

### Admin Dashboard

1. Navigate to `http://localhost:3000`
2. Enter a seed idea (e.g., "Boundaries at work when everyone thinks you're the dependable one")
3. Optionally add a monthly theme
4. Select target segments and platforms
5. Toggle product mentions and A/B variants if desired
6. Click "Generate Content"

### Generated Content Includes

- Full post/article content with hook and body
- Triple S mapping (for LinkedIn)
- S.O.F.T. framework mapping
- Hashtag strategy
- Visual generation prompts
- Quote card text options
- Best posting times
- Repurposing ideas
- A/B hook variants (optional)
- QA validation results

### Content Library

Navigate to `/library` to:
- Browse all generated content
- Filter by platform and segment
- Copy content to clipboard
- Export as JSON
- Delete artifacts

## API Endpoints

### POST /api/generate

Generate new content artifacts.

```typescript
{
  seedIdea: string;           // Required
  monthlyTheme?: string;      // Optional
  segments: Segment[];        // At least one
  platforms: Platform[];      // At least one
  includeProductMentions?: boolean;
  generateABVariants?: boolean;
}
```

### GET /api/artifacts

Fetch saved artifacts.

```
?platform=linkedin_founder
&segment=overextended_professional
&limit=50
&offset=0
```

### DELETE /api/artifacts

Delete an artifact.

```
?id=artifact-id
```

## Acceptance Test

The system passes validation for the standard test:

**Seed:** "Boundaries at work when everyone thinks you're the dependable one"

**Generated:**
- 3 Founder posts (all segments) ✓
- 2 Company posts ✓
- 1 Substack article ✓
- Visual prompts + hashtags for all ✓
- All QA validations pass ✓

See `examples/sample_outputs.json` for full output.

## Brand Voice Guidelines

Content must embody these pillars:
1. **Radical Clarity** — Truth delivered with tenderness
2. **Grounded Softness** — Calm, secure, regulated tone
3. **Cultural Fluency** — Rooted in Black womanhood + liberation
4. **Graceful Authority** — Professional, warm, anti-hustle

### Cadence Rules
- Rhythmic sentences
- Intentional pauses
- "Trusted sister" energy
- Never robotic
- Never generic influencer tone

## Hashtag Strategy

### Primary (2-3 required)
- #SoftMelanin
- #SoftnessIsPower
- #SoftnessStrategist
- #BoundariesAreSoftness

### Secondary Rotation
**Wellness:** #SoftLifeCoaching, #SoftHabits, #ThriveInSoftness
**Identity:** #BlackWomenLead, #SoftPowerMoves, #AuthenticConfidence
**Business:** #SoftBusinessStrategy, #BlackWomenInBusiness, #FounderEnergy

## Product Integration

Natural mentions when appropriate:
- **Soft & Still Coloring Pages** — Meditative coloring for stress relief
- **Plush Boost Coaching** — Individual coaching program
- **Luxe Shift Coaching** — Premium coaching experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

Private — All rights reserved.

---

Built with care for Black women's liberation and sustainable success.
