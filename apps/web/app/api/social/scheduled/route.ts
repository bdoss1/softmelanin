// ============================================================================
// Scheduled Posts API Routes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CreateScheduledPostSchema,
  UpdateScheduledPostSchema,
} from "@soft-melanin/shared";

// GET /api/social/scheduled - List scheduled posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const accountId = searchParams.get("accountId");
    const artifactId = searchParams.get("artifactId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const posts = await prisma.scheduledPost.findMany({
      where: {
        ...(status && { status }),
        ...(accountId && { socialAccountId: accountId }),
        ...(artifactId && { artifactId }),
        ...(startDate &&
          endDate && {
            scheduledFor: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        artifact: {
          select: {
            id: true,
            platform: true,
            segment: true,
            hook: true,
            createdAt: true,
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
      take: limit,
      skip: offset,
    });

    const total = await prisma.scheduledPost.count({
      where: {
        ...(status && { status }),
        ...(accountId && { socialAccountId: accountId }),
        ...(artifactId && { artifactId }),
      },
    });

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scheduled posts",
      },
      { status: 500 }
    );
  }
}

// POST /api/social/scheduled - Create a new scheduled post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateScheduledPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { artifactId, socialAccountId, scheduledFor, timezone, notes } =
      validation.data;

    // Verify artifact exists
    const artifact = await prisma.contentArtifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: "Artifact not found",
        },
        { status: 404 }
      );
    }

    // Verify social account exists and is active
    const account = await prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Social account not found",
        },
        { status: 404 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Social account is not active",
        },
        { status: 400 }
      );
    }

    // Validate platform compatibility
    const platformMap: Record<string, string[]> = {
      linkedin: ["linkedin_founder", "linkedin_company"],
      substack: ["substack"],
    };

    const compatiblePlatforms = platformMap[account.platform] || [];
    if (!compatiblePlatforms.includes(artifact.platform)) {
      return NextResponse.json(
        {
          success: false,
          error: `Artifact platform (${artifact.platform}) is not compatible with account platform (${account.platform})`,
        },
        { status: 400 }
      );
    }

    // Check for duplicate scheduling
    const existingSchedule = await prisma.scheduledPost.findFirst({
      where: {
        artifactId,
        socialAccountId,
        status: { in: ["pending", "queued"] },
      },
    });

    if (existingSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: "This artifact is already scheduled for this account",
          existingScheduleId: existingSchedule.id,
        },
        { status: 400 }
      );
    }

    // Create the scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        artifactId,
        socialAccountId,
        scheduledFor: new Date(scheduledFor),
        timezone: timezone || "America/New_York",
        status: "pending",
        notes,
      },
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
    });

    return NextResponse.json({
      success: true,
      scheduledPost,
    });
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create scheduled post",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/social/scheduled - Update a scheduled post
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled post ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = UpdateScheduledPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Check if post exists
    const existing = await prisma.scheduledPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled post not found",
        },
        { status: 404 }
      );
    }

    // Only allow updates for pending posts
    if (existing.status !== "pending" && validation.data.scheduledFor) {
      return NextResponse.json(
        {
          success: false,
          error: "Can only reschedule pending posts",
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (validation.data.scheduledFor) {
      updateData.scheduledFor = new Date(validation.data.scheduledFor);
    }
    if (validation.data.timezone) {
      updateData.timezone = validation.data.timezone;
    }
    if (validation.data.status) {
      updateData.status = validation.data.status;
    }
    if (validation.data.notes !== undefined) {
      updateData.notes = validation.data.notes;
    }

    const updated = await prisma.scheduledPost.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      scheduledPost: updated,
    });
  } catch (error) {
    console.error("Error updating scheduled post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update scheduled post",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/social/scheduled?id=xxx - Delete/cancel a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled post ID is required",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.scheduledPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled post not found",
        },
        { status: 404 }
      );
    }

    // Can't delete published posts (soft delete by marking cancelled)
    if (existing.status === "published") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete published posts",
        },
        { status: 400 }
      );
    }

    // For pending/failed posts, we can delete
    if (existing.status === "pending" || existing.status === "failed") {
      await prisma.scheduledPost.delete({
        where: { id },
      });
    } else {
      // For other statuses, mark as cancelled
      await prisma.scheduledPost.update({
        where: { id },
        data: { status: "cancelled" },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete scheduled post",
      },
      { status: 500 }
    );
  }
}
