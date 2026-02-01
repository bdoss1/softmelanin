// ============================================================================
// Social Accounts API Routes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateSocialAccountSchema } from "@soft-melanin/shared";

// GET /api/social/accounts - List all social accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const activeOnly = searchParams.get("active") === "true";

    const accounts = await prisma.socialAccount.findMany({
      where: {
        ...(platform && { platform }),
        ...(activeOnly && { isActive: true }),
      },
      select: {
        id: true,
        platform: true,
        accountType: true,
        accountName: true,
        accountId: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive tokens
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch social accounts",
      },
      { status: 500 }
    );
  }
}

// POST /api/social/accounts - Create a new social account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateSocialAccountSchema.safeParse(body);

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

    const { platform, accountType, accountName, accountId, accessToken, refreshToken, tokenExpiry } =
      validation.data;

    // Check if account already exists
    const existing = await prisma.socialAccount.findUnique({
      where: {
        platform_accountId: {
          platform,
          accountId,
        },
      },
    });

    if (existing) {
      // Update existing account
      const updated = await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accessToken,
          refreshToken,
          tokenExpiry,
          isActive: true,
          lastSyncAt: new Date(),
        },
        select: {
          id: true,
          platform: true,
          accountType: true,
          accountName: true,
          accountId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        account: updated,
        updated: true,
      });
    }

    // Create new account
    const account = await prisma.socialAccount.create({
      data: {
        platform,
        accountType,
        accountName,
        accountId,
        accessToken,
        refreshToken,
        tokenExpiry,
        isActive: true,
        lastSyncAt: new Date(),
      },
      select: {
        id: true,
        platform: true,
        accountType: true,
        accountName: true,
        accountId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("Error creating social account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create social account",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/social/accounts?id=xxx - Delete a social account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      );
    }

    // Check if account has scheduled posts
    const scheduledCount = await prisma.scheduledPost.count({
      where: {
        socialAccountId: id,
        status: "pending",
      },
    });

    if (scheduledCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete account with ${scheduledCount} pending scheduled posts`,
        },
        { status: 400 }
      );
    }

    await prisma.socialAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete social account",
      },
      { status: 500 }
    );
  }
}
