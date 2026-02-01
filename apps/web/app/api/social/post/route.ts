// ============================================================================
// Social Post Execution API Routes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LinkedInService } from "@/lib/social/linkedin";
import { SubstackService } from "@/lib/social/substack";
import {
  PostToLinkedInSchema,
  PostToSubstackSchema,
  ContentArtifact,
} from "@soft-melanin/shared";

// POST /api/social/post/linkedin - Post to LinkedIn immediately
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    if (!platform || !["linkedin", "substack"].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid platform. Must be 'linkedin' or 'substack'",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (platform === "linkedin") {
      return handleLinkedInPost(body);
    } else {
      return handleSubstackPost(body);
    }
  } catch (error) {
    console.error("Error posting content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to post content",
      },
      { status: 500 }
    );
  }
}

async function handleLinkedInPost(body: unknown) {
  const validation = PostToLinkedInSchema.safeParse(body);

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

  const { artifactId, socialAccountId } = validation.data;

  // Fetch artifact
  const artifactRecord = await prisma.contentArtifact.findUnique({
    where: { id: artifactId },
  });

  if (!artifactRecord) {
    return NextResponse.json(
      {
        success: false,
        error: "Artifact not found",
      },
      { status: 404 }
    );
  }

  // Fetch social account
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

  if (account.platform !== "linkedin") {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid social account platform",
      },
      { status: 400 }
    );
  }

  // Parse artifact data
  const artifact: ContentArtifact = {
    id: artifactRecord.id,
    platform: artifactRecord.platform as ContentArtifact["platform"],
    segment: artifactRecord.segment as ContentArtifact["segment"],
    hook: artifactRecord.hook,
    body: artifactRecord.body,
    tripleS: JSON.parse(artifactRecord.tripleS),
    soft: JSON.parse(artifactRecord.soft),
    hashtags: JSON.parse(artifactRecord.hashtags),
    seoTags: artifactRecord.seoTags ? JSON.parse(artifactRecord.seoTags) : undefined,
    visual: JSON.parse(artifactRecord.visual),
    productMentions: artifactRecord.productMentions
      ? JSON.parse(artifactRecord.productMentions)
      : undefined,
    growth: JSON.parse(artifactRecord.growth),
    qa: JSON.parse(artifactRecord.qa),
  };

  // Initialize LinkedIn service and post
  const linkedInService = new LinkedInService();
  linkedInService.setAccessToken(account.accessToken);

  const authorType = account.accountType === "company" ? "organization" : "person";
  const result = await linkedInService.createPost(artifact, authorType, account.accountId);

  if (result.success) {
    // Create post history
    await prisma.postHistory.create({
      data: {
        artifactId: artifact.id!,
        platform: "linkedin",
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
        rawResponse: result.rawResponse ? JSON.stringify(result.rawResponse) : null,
      },
    });
  }

  return NextResponse.json({
    success: result.success,
    result,
  });
}

async function handleSubstackPost(body: unknown) {
  const validation = PostToSubstackSchema.safeParse(body);

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

  const { artifactId, socialAccountId, publishNow, sendEmail } = validation.data;

  // Fetch artifact
  const artifactRecord = await prisma.contentArtifact.findUnique({
    where: { id: artifactId },
  });

  if (!artifactRecord) {
    return NextResponse.json(
      {
        success: false,
        error: "Artifact not found",
      },
      { status: 404 }
    );
  }

  // Fetch social account
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

  if (account.platform !== "substack") {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid social account platform",
      },
      { status: 400 }
    );
  }

  // Parse artifact data
  const artifact: ContentArtifact = {
    id: artifactRecord.id,
    platform: artifactRecord.platform as ContentArtifact["platform"],
    segment: artifactRecord.segment as ContentArtifact["segment"],
    hook: artifactRecord.hook,
    body: artifactRecord.body,
    tripleS: JSON.parse(artifactRecord.tripleS),
    soft: JSON.parse(artifactRecord.soft),
    hashtags: JSON.parse(artifactRecord.hashtags),
    seoTags: artifactRecord.seoTags ? JSON.parse(artifactRecord.seoTags) : undefined,
    visual: JSON.parse(artifactRecord.visual),
    productMentions: artifactRecord.productMentions
      ? JSON.parse(artifactRecord.productMentions)
      : undefined,
    growth: JSON.parse(artifactRecord.growth),
    qa: JSON.parse(artifactRecord.qa),
  };

  // Initialize Substack service
  // accessToken format: "email:apiKey", accountId is subdomain
  const [email, apiKey] = account.accessToken.split(":");
  const substackService = new SubstackService();
  substackService.setCredentials(email, apiKey, account.accountId);

  const result = await substackService.postFromArtifact(artifact, {
    publishNow,
    sendEmail,
  });

  if (result.success) {
    // Create post history
    await prisma.postHistory.create({
      data: {
        artifactId: artifact.id!,
        platform: "substack",
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
        rawResponse: result.rawResponse ? JSON.stringify(result.rawResponse) : null,
      },
    });
  }

  return NextResponse.json({
    success: result.success,
    result,
  });
}
