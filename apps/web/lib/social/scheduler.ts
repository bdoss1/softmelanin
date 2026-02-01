// ============================================================================
// Content Scheduler Service
// ============================================================================

import { prisma } from "@/lib/prisma";
import { LinkedInService } from "./linkedin";
import { SubstackService } from "./substack";
import { ContentArtifact, PostResult, ScheduledPost } from "@soft-melanin/shared";

// Type for Prisma artifact
interface PrismaArtifact {
  id: string;
  platform: string;
  segment: string;
  hook: string;
  body: string;
  tripleS: string;
  soft: string;
  hashtags: string;
  seoTags: string | null;
  visual: string;
  productMentions: string | null;
  growth: string;
  qa: string;
  seedIdea: string | null;
  monthlyTheme: string | null;
}

// Type for Prisma social account
interface PrismaSocialAccount {
  id: string;
  platform: string;
  accountType: string;
  accountId: string;
  accessToken: string;
  refreshToken: string | null;
}

// Type for Prisma scheduled post result
interface PrismaScheduledPost {
  id: string;
  artifactId: string;
  socialAccountId: string;
  scheduledFor: Date;
  timezone: string;
  status: string;
  publishedAt: Date | null;
  externalPostId: string | null;
  lastError: string | null;
  retryCount: number;
  maxRetries: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifact?: unknown;
  socialAccount?: unknown;
}

// Type for scheduled post with relations
interface ScheduledPostWithRelations {
  id: string;
  artifactId: string;
  artifact: PrismaArtifact;
  socialAccount: PrismaSocialAccount;
  retryCount: number;
  maxRetries: number;
}

interface SchedulerConfig {
  checkIntervalMs: number;
  maxConcurrentPosts: number;
  retryDelayMs: number;
}

export class SchedulerService {
  private config: SchedulerConfig;
  private linkedInService: LinkedInService;
  private substackService: SubstackService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      checkIntervalMs: config?.checkIntervalMs || 60000, // Check every minute
      maxConcurrentPosts: config?.maxConcurrentPosts || 3,
      retryDelayMs: config?.retryDelayMs || 300000, // 5 minutes retry delay
    };

    this.linkedInService = new LinkedInService();
    this.substackService = new SubstackService();
  }

  // ============================================================================
  // Scheduler Lifecycle
  // ============================================================================

  start(): void {
    if (this.isRunning) {
      console.log("Scheduler is already running");
      return;
    }

    console.log("Starting content scheduler...");
    this.isRunning = true;

    // Run immediately on start
    this.processScheduledPosts();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, this.config.checkIntervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("Stopping content scheduler...");
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // Post Processing
  // ============================================================================

  async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();

      // Find posts that are due
      const duePosts = await prisma.scheduledPost.findMany({
        where: {
          status: "pending",
          scheduledFor: {
            lte: now,
          },
        },
        include: {
          artifact: true,
          socialAccount: true,
        },
        take: this.config.maxConcurrentPosts,
        orderBy: {
          scheduledFor: "asc",
        },
      });

      if (duePosts.length === 0) {
        return;
      }

      console.log(`Processing ${duePosts.length} scheduled posts...`);

      // Process posts concurrently
      await Promise.all(
        (duePosts as ScheduledPostWithRelations[]).map((post: ScheduledPostWithRelations) => this.processPost(post))
      );
    } catch (error) {
      console.error("Error processing scheduled posts:", error);
    }
  }

  private async processPost(
    scheduledPost: {
      id: string;
      artifactId: string;
      artifact: {
        id: string;
        platform: string;
        segment: string;
        hook: string;
        body: string;
        tripleS: string;
        soft: string;
        hashtags: string;
        seoTags: string | null;
        visual: string;
        productMentions: string | null;
        growth: string;
        qa: string;
        seedIdea: string | null;
        monthlyTheme: string | null;
      };
      socialAccount: {
        id: string;
        platform: string;
        accountType: string;
        accountId: string;
        accessToken: string;
        refreshToken: string | null;
      };
      retryCount: number;
      maxRetries: number;
    }
  ): Promise<void> {
    const { id, artifact, socialAccount } = scheduledPost;

    try {
      // Update status to posting
      await prisma.scheduledPost.update({
        where: { id },
        data: { status: "posting" },
      });

      // Parse artifact JSON fields
      const parsedArtifact: ContentArtifact = {
        id: artifact.id,
        platform: artifact.platform as ContentArtifact["platform"],
        segment: artifact.segment as ContentArtifact["segment"],
        hook: artifact.hook,
        body: artifact.body,
        tripleS: JSON.parse(artifact.tripleS),
        soft: JSON.parse(artifact.soft),
        hashtags: JSON.parse(artifact.hashtags),
        seoTags: artifact.seoTags ? JSON.parse(artifact.seoTags) : undefined,
        visual: JSON.parse(artifact.visual),
        productMentions: artifact.productMentions
          ? JSON.parse(artifact.productMentions)
          : undefined,
        growth: JSON.parse(artifact.growth),
        qa: JSON.parse(artifact.qa),
        seedIdea: artifact.seedIdea || undefined,
        monthlyTheme: artifact.monthlyTheme || undefined,
      };

      let result: PostResult;

      if (socialAccount.platform === "linkedin") {
        result = await this.postToLinkedIn(parsedArtifact, socialAccount);
      } else if (socialAccount.platform === "substack") {
        result = await this.postToSubstack(parsedArtifact, socialAccount);
      } else {
        throw new Error(`Unsupported platform: ${socialAccount.platform}`);
      }

      if (result.success) {
        // Update to published
        await prisma.scheduledPost.update({
          where: { id },
          data: {
            status: "published",
            publishedAt: new Date(),
            externalPostId: result.externalPostId,
            lastError: null,
          },
        });

        // Create post history record
        await prisma.postHistory.create({
          data: {
            scheduledPostId: id,
            artifactId: artifact.id,
            platform: socialAccount.platform,
            externalPostId: result.externalPostId,
            externalUrl: result.externalUrl,
            rawResponse: result.rawResponse
              ? JSON.stringify(result.rawResponse)
              : null,
          },
        });

        console.log(`Successfully posted: ${id} to ${socialAccount.platform}`);
      } else {
        await this.handlePostFailure(scheduledPost, result.error || "Unknown error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await this.handlePostFailure(scheduledPost, errorMessage);
    }
  }

  private async handlePostFailure(
    scheduledPost: {
      id: string;
      retryCount: number;
      maxRetries: number;
    },
    error: string
  ): Promise<void> {
    const { id, retryCount, maxRetries } = scheduledPost;

    if (retryCount < maxRetries) {
      // Schedule retry
      const nextRetry = new Date(Date.now() + this.config.retryDelayMs);

      await prisma.scheduledPost.update({
        where: { id },
        data: {
          status: "pending",
          scheduledFor: nextRetry,
          retryCount: retryCount + 1,
          lastError: error,
        },
      });

      console.log(`Post ${id} failed, scheduled retry ${retryCount + 1}/${maxRetries}`);
    } else {
      // Max retries reached
      await prisma.scheduledPost.update({
        where: { id },
        data: {
          status: "failed",
          lastError: error,
        },
      });

      console.error(`Post ${id} failed permanently after ${maxRetries} retries: ${error}`);
    }
  }

  // ============================================================================
  // Platform-Specific Posting
  // ============================================================================

  private async postToLinkedIn(
    artifact: ContentArtifact,
    account: {
      accessToken: string;
      accountType: string;
      accountId: string;
    }
  ): Promise<PostResult> {
    this.linkedInService.setAccessToken(account.accessToken);

    const authorType = account.accountType === "company" ? "organization" : "person";

    return this.linkedInService.createPost(artifact, authorType, account.accountId);
  }

  private async postToSubstack(
    artifact: ContentArtifact,
    account: {
      accessToken: string;
      accountId: string;
    }
  ): Promise<PostResult> {
    // For Substack, accessToken contains the API key
    // accountId contains the subdomain
    const [email, apiKey] = account.accessToken.split(":");

    this.substackService.setCredentials(email, apiKey, account.accountId);

    return this.substackService.postFromArtifact(artifact, {
      publishNow: true,
      sendEmail: true,
    });
  }

  // ============================================================================
  // Manual Post Execution
  // ============================================================================

  async executePostNow(scheduledPostId: string): Promise<PostResult> {
    const scheduledPost = await prisma.scheduledPost.findUnique({
      where: { id: scheduledPostId },
      include: {
        artifact: true,
        socialAccount: true,
      },
    });

    if (!scheduledPost) {
      return {
        success: false,
        platform: "linkedin",
        error: "Scheduled post not found",
      };
    }

    if (scheduledPost.status === "published") {
      return {
        success: false,
        platform: scheduledPost.socialAccount.platform as "linkedin" | "substack",
        error: "Post already published",
      };
    }

    // Process immediately
    await this.processPost({
      ...scheduledPost,
      retryCount: scheduledPost.retryCount,
      maxRetries: scheduledPost.maxRetries,
    });

    // Fetch updated status
    const updated = await prisma.scheduledPost.findUnique({
      where: { id: scheduledPostId },
    });

    return {
      success: updated?.status === "published",
      platform: scheduledPost.socialAccount.platform as "linkedin" | "substack",
      externalPostId: updated?.externalPostId || undefined,
      error: updated?.lastError || undefined,
    };
  }

  // ============================================================================
  // Scheduling Helpers
  // ============================================================================

  async getUpcomingPosts(
    limit: number = 10,
    accountId?: string
  ): Promise<ScheduledPost[]> {
    const posts = await prisma.scheduledPost.findMany({
      where: {
        status: "pending",
        ...(accountId && { socialAccountId: accountId }),
      },
      include: {
        artifact: true,
        socialAccount: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
      take: limit,
    });

    return posts.map((post: PrismaScheduledPost) => this.transformScheduledPost(post));
  }

  async getPostsForDateRange(
    startDate: Date,
    endDate: Date,
    accountId?: string
  ): Promise<ScheduledPost[]> {
    const posts = await prisma.scheduledPost.findMany({
      where: {
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
        ...(accountId && { socialAccountId: accountId }),
      },
      include: {
        artifact: true,
        socialAccount: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return posts.map((post: PrismaScheduledPost) => this.transformScheduledPost(post));
  }

  private transformScheduledPost(post: {
    id: string;
    artifactId: string;
    socialAccountId: string;
    scheduledFor: Date;
    timezone: string;
    status: string;
    publishedAt: Date | null;
    externalPostId: string | null;
    lastError: string | null;
    retryCount: number;
    maxRetries: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    artifact?: unknown;
    socialAccount?: unknown;
  }): ScheduledPost {
    return {
      id: post.id,
      artifactId: post.artifactId,
      socialAccountId: post.socialAccountId,
      scheduledFor: post.scheduledFor,
      timezone: post.timezone,
      status: post.status as ScheduledPost["status"],
      publishedAt: post.publishedAt || undefined,
      externalPostId: post.externalPostId || undefined,
      lastError: post.lastError || undefined,
      retryCount: post.retryCount,
      maxRetries: post.maxRetries,
      notes: post.notes || undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

// Singleton instance
let schedulerServiceInstance: SchedulerService | null = null;

export function getSchedulerService(): SchedulerService {
  if (!schedulerServiceInstance) {
    schedulerServiceInstance = new SchedulerService();
  }
  return schedulerServiceInstance;
}
