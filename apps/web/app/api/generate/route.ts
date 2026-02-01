import { NextRequest, NextResponse } from "next/server";
import { GenerationRequestSchema } from "@soft-melanin/shared";
import { getSharedGenerator } from "@/lib/engine";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    console.log("[generate]", { requestId, event: "request_start" });
    const body = await request.json();
    console.log("[generate]", { requestId, event: "request_body_received" });

    // Validate request
    const parseResult = GenerationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.warn("[generate]", {
        requestId,
        event: "validation_failed",
        errors: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const validatedRequest = parseResult.data;
    console.log("[generate]", {
      requestId,
      event: "validation_passed",
      segments: validatedRequest.segments,
      platforms: validatedRequest.platforms,
    });

    // Get the content generator
    const generator = getSharedGenerator();
    console.log("[generate]", { requestId, event: "generator_ready" });

    // Generate content
    const response = await generator.generate(validatedRequest);
    console.log("[generate]", {
      requestId,
      event: "generation_complete",
      success: response.success,
      artifactCount: response.artifacts?.length ?? 0,
      errorCount: response.errors?.length ?? 0,
    });

    // Save artifacts to database
    if (response.artifacts.length > 0) {
      console.log("[generate]", { requestId, event: "db_write_start" });
      const artifactIds: string[] = [];

      for (const artifact of response.artifacts) {
        console.log("[generate]", {
          requestId,
          event: "db_write_artifact",
          platform: artifact.platform,
          segment: artifact.segment,
        });
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
      console.log("[generate]", { requestId, event: "db_write_session" });
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
      console.log("[generate]", { requestId, event: "db_write_complete", artifactCount: artifactIds.length });
    }

    console.log("[generate]", {
      requestId,
      event: "request_complete",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[generate]", {
      requestId,
      event: "request_error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        errors: [error instanceof Error ? error.message : "Internal server error"],
      },
      { status: 500 }
    );
  }
}
