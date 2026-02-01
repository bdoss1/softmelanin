// ============================================================================
// Calendar API Routes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CalendarQuerySchema } from "@soft-melanin/shared";

// Type for Prisma scheduled post with relations
interface ScheduledPostWithRelations {
  id: string;
  artifactId: string;
  socialAccountId: string;
  scheduledFor: Date;
  status: string;
  artifact: {
    id: string;
    platform: string;
    segment: string;
    hook: string;
  };
  socialAccount: {
    id: string;
    platform: string;
    accountType: string;
    accountName: string;
  };
}

// GET /api/social/calendar - Get calendar data for a month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const socialAccountId = searchParams.get("socialAccountId");
    const platform = searchParams.get("platform");

    const validation = CalendarQuerySchema.safeParse({
      year,
      month,
      socialAccountId: socialAccountId || undefined,
      platform: platform || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    // Include days from previous and next month that appear in the calendar view
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);

    // Get the start of the week containing the first of the month
    const startDate = new Date(firstOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Get the end of the week containing the last of the month
    const endDate = new Date(lastOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    endDate.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause: Record<string, unknown> = {
      scheduledFor: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (socialAccountId) {
      whereClause.socialAccountId = socialAccountId;
    }

    if (platform) {
      whereClause.socialAccount = {
        platform,
      };
    }

    // Fetch scheduled posts for the date range
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: whereClause,
      include: {
        artifact: {
          select: {
            id: true,
            platform: true,
            segment: true,
            hook: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountType: true,
            accountName: true,
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    // Build calendar structure
    const weeks = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const week = [];

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentDate);
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Filter posts for this day
        const dayPosts = (scheduledPosts as ScheduledPostWithRelations[]).filter((post: ScheduledPostWithRelations) => {
          const postDate = new Date(post.scheduledFor);
          return postDate >= dayStart && postDate <= dayEnd;
        });

        week.push({
          date: dayDate.toISOString(),
          dayOfMonth: dayDate.getDate(),
          isToday: dayDate.getTime() === today.getTime(),
          isCurrentMonth: dayDate.getMonth() === month - 1,
          isWeekend: i === 0 || i === 6,
          scheduledPosts: dayPosts.map((post: ScheduledPostWithRelations) => ({
            id: post.id,
            artifactId: post.artifactId,
            socialAccountId: post.socialAccountId,
            scheduledFor: post.scheduledFor.toISOString(),
            status: post.status,
            artifact: post.artifact,
            socialAccount: post.socialAccount,
          })),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push({ days: week });
    }

    // Get summary stats for the month
    const typedPosts = scheduledPosts as ScheduledPostWithRelations[];
    const stats = {
      total: typedPosts.length,
      pending: typedPosts.filter((p: ScheduledPostWithRelations) => p.status === "pending").length,
      published: typedPosts.filter((p: ScheduledPostWithRelations) => p.status === "published").length,
      failed: typedPosts.filter((p: ScheduledPostWithRelations) => p.status === "failed").length,
      byPlatform: {} as Record<string, number>,
    };

    typedPosts.forEach((post: ScheduledPostWithRelations) => {
      const platform = post.socialAccount.platform;
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      calendar: {
        year,
        month,
        weeks,
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calendar data",
      },
      { status: 500 }
    );
  }
}
