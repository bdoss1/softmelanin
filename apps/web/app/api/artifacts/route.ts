import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ContentArtifact, Platform, Segment, TripleS, SOFTFramework, Visual, Growth, QAValidation } from "@soft-melanin/shared";

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

    // Transform to ContentArtifact type (Prisma Json type auto-deserializes)
    const transformedArtifacts: ContentArtifact[] = artifacts.map((a) => ({
      id: a.id,
      platform: a.platform as Platform,
      segment: a.segment as Segment,
      hook: a.hook,
      body: a.body,
      tripleS: a.tripleS as unknown as TripleS,
      soft: a.soft as unknown as SOFTFramework,
      hashtags: a.hashtags as unknown as string[],
      seoTags: a.seoTags as unknown as string[] | undefined,
      visual: a.visual as unknown as Visual,
      productMentions: a.productMentions as unknown as ContentArtifact["productMentions"],
      growth: a.growth as unknown as Growth,
      qa: a.qa as unknown as QAValidation,
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
