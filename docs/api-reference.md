# API Reference

Complete API documentation for the Soft Melanin Content Engine.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Content Generation

### Generate Content

Create new content artifacts from a seed idea.

```http
POST /api/generate
Content-Type: application/json
```

#### Request Body

```typescript
{
  seedIdea: string;                    // Required - The content topic/idea
  monthlyTheme?: string;               // Optional - Current month's theme
  segments: Segment[];                 // Required - Target audience segments
  platforms: Platform[];               // Required - Target platforms
  includeProductMentions?: boolean;    // Optional - Include product references
  generateABVariants?: boolean;        // Optional - Generate A/B test variants
}
```

#### Types

```typescript
type Segment =
  | "overextended_professional"
  | "healing_high_achiever"
  | "creative_reclaimer";

type Platform =
  | "linkedin_founder"
  | "linkedin_company"
  | "substack";
```

#### Response

```typescript
{
  success: boolean;
  artifacts: ContentArtifact[];  // Generated content
  errors?: string[];             // Any generation errors
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "seedIdea": "Setting boundaries at work",
    "segments": ["overextended_professional"],
    "platforms": ["linkedin_founder"]
  }'
```

---

## Content Library

### List Artifacts

Retrieve saved content artifacts with optional filtering.

```http
GET /api/artifacts
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| platform | string | - | Filter by platform type |
| segment | string | - | Filter by audience segment |
| limit | number | 50 | Maximum results to return |
| offset | number | 0 | Pagination offset |

#### Response

```typescript
{
  artifacts: ContentArtifact[];
  total: number;
  limit: number;
  offset: number;
}
```

#### Example

```bash
curl "http://localhost:3000/api/artifacts?platform=linkedin_founder&limit=10"
```

### Delete Artifact

Remove a content artifact.

```http
DELETE /api/artifacts?id={artifactId}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Artifact ID to delete |

#### Response

```typescript
{
  success: boolean;
}
```

---

## Social Accounts

### List Accounts

Get all connected social accounts.

```http
GET /api/social/accounts
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| platform | string | Filter by platform (linkedin, substack) |
| active | boolean | Filter by active status |

#### Response

```typescript
{
  success: boolean;
  accounts: SocialAccount[];
}
```

#### SocialAccount Type

```typescript
interface SocialAccount {
  id: string;
  platform: "linkedin" | "substack";
  accountType: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Create Account

Connect a new social account.

```http
POST /api/social/accounts
Content-Type: application/json
```

#### Request Body

```typescript
{
  platform: "linkedin" | "substack";
  accountType: string;
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: string;  // ISO date string
}
```

#### Response

```typescript
{
  success: boolean;
  account: SocialAccount;
  updated?: boolean;  // True if existing account was updated
}
```

### Delete Account

Disconnect a social account.

```http
DELETE /api/social/accounts?id={accountId}
```

#### Response

```typescript
{
  success: boolean;
  error?: string;  // If account has pending scheduled posts
}
```

---

## Scheduled Posts

### List Scheduled Posts

Get scheduled posts with optional filtering.

```http
GET /api/social/scheduled
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| accountId | string | Filter by social account |
| artifactId | string | Filter by content artifact |
| startDate | string | Start of date range (ISO) |
| endDate | string | End of date range (ISO) |
| limit | number | Max results (default 50) |
| offset | number | Pagination offset |

#### Status Values

```typescript
type ScheduledPostStatus =
  | "pending"     // Awaiting scheduled time
  | "queued"      // Ready for processing
  | "posting"     // Currently being posted
  | "published"   // Successfully posted
  | "failed"      // Failed after retries
  | "cancelled";  // Manually cancelled
```

#### Response

```typescript
{
  success: boolean;
  posts: ScheduledPost[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

### Create Scheduled Post

Schedule content for future publishing.

```http
POST /api/social/scheduled
Content-Type: application/json
```

#### Request Body

```typescript
{
  artifactId: string;      // Content to post
  socialAccountId: string; // Target account
  scheduledFor: string;    // ISO date string
  timezone?: string;       // Default: "America/New_York"
  notes?: string;          // Optional notes
}
```

#### Response

```typescript
{
  success: boolean;
  scheduledPost: ScheduledPost;
  error?: string;
}
```

#### Validation

- Artifact must exist
- Social account must be active
- Content platform must match account platform
- Cannot schedule same artifact to same account twice

### Update Scheduled Post

Modify a scheduled post.

```http
PATCH /api/social/scheduled?id={postId}
Content-Type: application/json
```

#### Request Body

```typescript
{
  scheduledFor?: string;   // New schedule time
  timezone?: string;       // New timezone
  status?: string;         // Change status
  notes?: string;          // Update notes
}
```

#### Response

```typescript
{
  success: boolean;
  scheduledPost: ScheduledPost;
}
```

### Delete Scheduled Post

Cancel a scheduled post.

```http
DELETE /api/social/scheduled?id={postId}
```

#### Behavior

- **Pending/Failed posts**: Deleted completely
- **Other statuses**: Marked as cancelled
- **Published posts**: Cannot be deleted

#### Response

```typescript
{
  success: boolean;
}
```

### Execute Scheduled Post

Manually trigger a scheduled post immediately.

```http
POST /api/social/scheduled/execute
Content-Type: application/json
```

#### Request Body

```typescript
{
  scheduledPostId: string;
}
```

#### Response

```typescript
{
  success: boolean;
  result: PostResult;
}
```

---

## Calendar

### Get Calendar Data

Retrieve scheduled posts organized by calendar month.

```http
GET /api/social/calendar
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| year | number | Current year | Calendar year |
| month | number | Current month | Calendar month (1-12) |
| socialAccountId | string | - | Filter by account |
| platform | string | - | Filter by platform |

#### Response

```typescript
{
  success: boolean;
  calendar: {
    year: number;
    month: number;
    weeks: CalendarWeek[];
  };
  stats: {
    total: number;
    pending: number;
    published: number;
    failed: number;
    byPlatform: Record<string, number>;
  };
}
```

#### CalendarWeek Type

```typescript
interface CalendarWeek {
  days: CalendarDay[];
}

interface CalendarDay {
  date: string;           // ISO date
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  scheduledPosts: ScheduledPost[];
}
```

---

## Direct Posting

### Post to Platform

Immediately post content to a social platform.

```http
POST /api/social/post?platform={platform}
Content-Type: application/json
```

#### Platforms

- `linkedin`
- `substack`

#### Request Body (LinkedIn)

```typescript
{
  artifactId: string;
  socialAccountId: string;
  immediate?: boolean;  // Default: false
}
```

#### Request Body (Substack)

```typescript
{
  artifactId: string;
  socialAccountId: string;
  publishNow?: boolean;  // Default: false
  sendEmail?: boolean;   // Default: true
}
```

#### Response

```typescript
{
  success: boolean;
  result: {
    success: boolean;
    platform: string;
    externalPostId?: string;
    externalUrl?: string;
    error?: string;
  };
}
```

---

## OAuth

### Initiate LinkedIn OAuth

Start the LinkedIn OAuth flow.

```http
GET /api/social/oauth/linkedin?accountType={type}
```

#### Query Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| accountType | string | founder, company | Account type to connect |

Redirects to LinkedIn authorization page.

### Complete LinkedIn OAuth

Handle the OAuth callback.

```http
POST /api/social/oauth/linkedin
Content-Type: application/json
```

#### Request Body

```typescript
{
  code: string;    // Authorization code from LinkedIn
  state?: string;  // State parameter for verification
}
```

#### Response

```typescript
{
  success: boolean;
  account: SocialAccount;
  profile: {
    id: string;
    name: string;
    picture?: string;
  };
  organizations?: LinkedInOrganization[];  // If company type
}
```

---

## Types Reference

### ContentArtifact

```typescript
interface ContentArtifact {
  id: string;
  platform: Platform;
  segment: Segment;
  hook: string;
  body: string;
  tripleS: {
    stop: { hook: string; technique: string };
    stay: { story: string; emotion: string };
    share: { takeaways: string[]; cta: string };
  };
  soft: {
    separate: string;
    own: string;
    filter: string;
    thrive: string;
  };
  hashtags: string[];
  seoTags?: string[];
  visual: {
    prompt: string;
    palette: string[];
    quoteCardTextOptions: string[];
  };
  productMentions?: ProductMention[];
  growth: {
    bestPostingTimes: string[];
    repurposingIdeas: string[];
    abVariants?: string[];
  };
  qa: {
    wordCountPass: boolean;
    whitespacePass: boolean;
    softMappingPass: boolean;
    tripleSMappingPass: boolean;
    ctaPass: boolean;
    hashtagPass: boolean;
    brandVoicePass: boolean;
    visualPromptPass: boolean;
    seoTagsPass: boolean;
  };
  seedIdea?: string;
  monthlyTheme?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ScheduledPost

```typescript
interface ScheduledPost {
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
```

### PostResult

```typescript
interface PostResult {
  success: boolean;
  platform: "linkedin" | "substack";
  externalPostId?: string;
  externalUrl?: string;
  error?: string;
  rawResponse?: unknown;
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  success: false;
  error: string;
  details?: ValidationError[];  // For validation errors
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

### Validation Errors

```typescript
interface ValidationError {
  path: string[];
  message: string;
  code: string;
}
```

---

## Rate Limiting

The API does not currently implement rate limiting, but underlying platform APIs have limits:

- **LinkedIn**: 100,000 calls/day per app
- **Substack**: Varies by plan

The scheduler handles platform rate limiting with automatic retry.

---

## Authentication

Currently, the API does not require authentication. For production deployment, implement:

- API key authentication
- Session-based authentication
- OAuth for user-specific operations

---

## Webhooks (Planned)

Future support for webhooks to notify external systems of:

- Content generation completion
- Scheduled post publication
- Post failures
- Engagement updates
