import { NextRequest, NextResponse } from "next/server";
import { GenerationRequestSchema } from "@soft-melanin/shared";
import { getSharedGenerator } from "@/lib/engine";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = GenerationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const validatedRequest = parseResult.data;

    // Get the content generator
    const generator = getSharedGenerator();

    // Generate content
    const response = await generator.generate(validatedRequest);

    // Save artifacts to database
    if (response.artifacts.length > 0) {
      const artifactIds: string[] = [];

      for (const artifact of response.artifacts) {
        const saved = await prisma.contentArtifact.create({
          data: {
            platform: artifact.platform,
            segment: artifact.segment,
            hook: artifact.hook,
            body: artifact.body,
            tripleS: JSON.stringify(artifact.tripleS),
            soft: JSON.stringify(artifact.soft),
            hashtags: JSON.stringify(artifact.hashtags),
            seoTags: artifact.seoTags ? JSON.stringify(artifact.seoTags) : null,
            visual: JSON.stringify(artifact.visual),
            productMentions: artifact.productMentions
              ? JSON.stringify(artifact.productMentions)
              : null,
            growth: JSON.stringify(artifact.growth),
            qa: JSON.stringify(artifact.qa),
            seedIdea: validatedRequest.seedIdea,
            monthlyTheme: validatedRequest.monthlyTheme || null,
          },
        });

        artifact.id = saved.id;
        artifactIds.push(saved.id);
      }

      // Save the generation session
      await prisma.generationSession.create({
        data: {
          seedIdea: validatedRequest.seedIdea,
          monthlyTheme: validatedRequest.monthlyTheme || null,
          segments: JSON.stringify(validatedRequest.segments),
          platforms: JSON.stringify(validatedRequest.platforms),
          includeProductMentions: validatedRequest.includeProductMentions || false,
          generateABVariants: validatedRequest.generateABVariants || false,
          artifactIds: JSON.stringify(artifactIds),
          success: response.success,
          errors: response.errors ? JSON.stringify(response.errors) : null,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: [error instanceof Error ? error.message : "Internal server error"],
      },
      { status: 500 }
    );
  }
}
