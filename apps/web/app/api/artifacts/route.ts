import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ContentArtifact, Platform, Segment } from "@soft-melanin/shared";

// Type for Prisma content artifact result
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
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const platform = searchParams.get("platform") as Platform | null;
    const segment = searchParams.get("segment") as Segment | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, string> = {};
    if (platform) where.platform = platform;
    if (segment) where.segment = segment;

    // Fetch artifacts
    const artifacts = await prisma.contentArtifact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.contentArtifact.count({ where });

    // Transform to ContentArtifact type
    const transformedArtifacts: ContentArtifact[] = (artifacts as PrismaArtifact[]).map((a: PrismaArtifact) => ({
      id: a.id,
      platform: a.platform as Platform,
      segment: a.segment as Segment,
      hook: a.hook,
      body: a.body,
      tripleS: JSON.parse(a.tripleS),
      soft: JSON.parse(a.soft),
      hashtags: JSON.parse(a.hashtags),
      seoTags: a.seoTags ? JSON.parse(a.seoTags) : undefined,
      visual: JSON.parse(a.visual),
      productMentions: a.productMentions ? JSON.parse(a.productMentions) : undefined,
      growth: JSON.parse(a.growth),
      qa: JSON.parse(a.qa),
      seedIdea: a.seedIdea || undefined,
      monthlyTheme: a.monthlyTheme || undefined,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json({
      artifacts: transformedArtifacts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Fetch artifacts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.contentArtifact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete artifact error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
