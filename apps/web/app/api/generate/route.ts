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
            tripleS: artifact.tripleS,
            soft: artifact.soft,
            hashtags: artifact.hashtags,
            seoTags: artifact.seoTags || null,
            visual: artifact.visual,
            productMentions: artifact.productMentions || null,
            growth: artifact.growth,
            qa: artifact.qa,
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
          segments: validatedRequest.segments,
          platforms: validatedRequest.platforms,
          includeProductMentions: validatedRequest.includeProductMentions || false,
          generateABVariants: validatedRequest.generateABVariants || false,
          artifactIds: artifactIds,
          success: response.success,
          errors: response.errors || null,
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
