# Soft Melanin MCP — Softness Strategist™ Content Engine

A production-ready content intelligence engine and admin dashboard for Soft Melanin, built with Next.js, shadcn/ui, and TypeScript. Now featuring automated social posting to LinkedIn and Substack.

## Overview

This system transforms minimal inputs (seed ideas, framework elements, monthly themes) into fully brand-aligned content across multiple platforms:

- **LinkedIn Founder Posts** — Professional reflection through softness
- **LinkedIn Company Posts** — SOFT methodology education
- **Substack Articles** — Deep-dive content with cultural context
- **AI Visual Prompts** — Midjourney/DALL-E ready prompts
- **Quote Cards** — Brand-aligned text options
- **Hashtag Strategy** — Optimized tag combinations
- **Automated Scheduling** — Calendar-based content publishing

## Brand Foundation

**Brand:** Soft Melanin
**Founder:** Courtney A. Doss, M.Ed.
**Title:** The Softness Strategist™

**Mission:** Empower Black women to redefine strength through softness — emotional sovereignty, rest, boundaries, joy, and radical self-honoring.

## Key Features

### Content Generation

#### S.O.F.T. Framework™
- **S** - Separate worth from work
- **O** - Own your role and boundaries
- **F** - Filter demands and opportunities
- **T** - Thrive with sustainable systems

#### Triple S Method™ (LinkedIn)
- **STOP** — Hook using 5 C's (Curiosity, Contradiction, Conflict, Contrast, Controversy)
- **STAY** — Story + resonance
- **SHARE** — Takeaways + reflective CTA

### Social Posting & Scheduling

- **LinkedIn Integration** — OAuth-based posting to personal profiles and company pages
- **Substack Integration** — API-based publishing to newsletters
- **Calendar View** — Visual scheduling with month navigation
- **Automated Publishing** — Background scheduler for timed posts
- **Retry Logic** — Automatic retry with exponential backoff on failures

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
│       │   │   ├── artifacts/  # Content library endpoint
│       │   │   └── social/     # Social posting APIs
│       │   │       ├── accounts/   # Social account management
│       │   │       ├── scheduled/  # Scheduled posts CRUD
│       │   │       ├── calendar/   # Calendar data endpoint
│       │   │       ├── post/       # Immediate posting
│       │   │       └── oauth/      # OAuth flows
│       │   ├── auth/           # OAuth callbacks
│       │   ├── library/        # Content library page
│       │   ├── schedule/       # Scheduling calendar page
│       │   ├── settings/       # Settings pages
│       │   │   └── social/     # Social account settings
│       │   └── page.tsx        # Main generator page
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   └── calendar/       # Calendar components
│       └── lib/
│           ├── social/         # Social integration services
│           │   ├── linkedin.ts # LinkedIn API service
│           │   ├── substack.ts # Substack API service
│           │   └── scheduler.ts # Automated scheduler
│           └── engine.ts       # Content engine config
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
├── docs/                       # Documentation
│   ├── scheduling.md           # Scheduling guide
│   ├── social-integrations.md  # Social platform setup
│   └── api-reference.md        # API documentation
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

# LinkedIn OAuth (for social posting)
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
LINKEDIN_REDIRECT_URI="http://localhost:3000/auth/callback/linkedin"
```

## Usage

### Content Generation

1. Navigate to `http://localhost:3000`
2. Enter a seed idea (e.g., "Boundaries at work when everyone thinks you're the dependable one")
3. Optionally add a monthly theme
4. Select target segments and platforms
5. Toggle product mentions and A/B variants if desired
6. Click "Generate Content"

### Content Scheduling

1. Navigate to `/schedule` for the calendar view
2. Connect your social accounts in `/settings/social`
3. Select content from the queue or library
4. Choose a date and time for publishing
5. The scheduler automatically posts at the scheduled time

See [docs/scheduling.md](docs/scheduling.md) for detailed instructions.

### Social Account Setup

1. Go to `/settings/social`
2. For LinkedIn: Click "Connect Account" and complete OAuth flow
3. For Substack: Enter your publication subdomain and API key

See [docs/social-integrations.md](docs/social-integrations.md) for platform-specific setup.

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
- Schedule for posting

## API Endpoints

### Content Generation

#### POST /api/generate

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

#### GET /api/artifacts

Fetch saved artifacts.

```
?platform=linkedin_founder
&segment=overextended_professional
&limit=50
&offset=0
```

#### DELETE /api/artifacts

Delete an artifact.

```
?id=artifact-id
```

### Social Posting

#### GET /api/social/accounts

List connected social accounts.

#### POST /api/social/accounts

Connect a new social account.

#### GET /api/social/scheduled

List scheduled posts with optional filters.

#### POST /api/social/scheduled

Schedule a post for publishing.

#### GET /api/social/calendar

Get calendar data for a month.

See [docs/api-reference.md](docs/api-reference.md) for complete API documentation.

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
