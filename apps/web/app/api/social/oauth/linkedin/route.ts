// ============================================================================
// LinkedIn OAuth Routes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LinkedInService } from "@/lib/social/linkedin";

// GET /api/social/oauth/linkedin - Initiate OAuth flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get("accountType") || "founder";

    const linkedInService = new LinkedInService();

    // Generate a state parameter for security
    const state = Buffer.from(
      JSON.stringify({
        accountType,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const authUrl = linkedInService.getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating LinkedIn OAuth:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate OAuth",
      },
      { status: 500 }
    );
  }
}

// POST /api/social/oauth/linkedin - Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization code is required",
        },
        { status: 400 }
      );
    }

    // Parse state
    let accountType = "founder";
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        accountType = stateData.accountType || "founder";
      } catch {
        // Ignore state parsing errors
      }
    }

    const linkedInService = new LinkedInService();

    // Exchange code for token
    const tokenResponse = await linkedInService.exchangeCodeForToken(code);

    // Set the access token
    linkedInService.setAccessToken(tokenResponse.access_token);

    // Get profile info
    const profile = await linkedInService.getProfile();

    // Calculate token expiry
    const tokenExpiry = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    // Create or update the social account
    const accountName = `${profile.localizedFirstName} ${profile.localizedLastName}`;

    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        platform_accountId: {
          platform: "linkedin",
          accountId: profile.id,
        },
      },
    });

    let account;
    if (existingAccount) {
      account = await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accountName,
          accountType,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
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
    } else {
      account = await prisma.socialAccount.create({
        data: {
          platform: "linkedin",
          accountType,
          accountName,
          accountId: profile.id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
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
    }

    // If this is a company account, also try to get organizations
    let organizations: Awaited<ReturnType<LinkedInService["getOrganizations"]>> = [];
    if (accountType === "company") {
      try {
        organizations = await linkedInService.getOrganizations();
      } catch {
        // Organization access may not be available
      }
    }

    return NextResponse.json({
      success: true,
      account,
      profile: {
        id: profile.id,
        name: accountName,
        picture: profile.profilePicture,
      },
      organizations,
    });
  } catch (error) {
    console.error("Error in LinkedIn OAuth callback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "OAuth callback failed",
      },
      { status: 500 }
    );
  }
}
