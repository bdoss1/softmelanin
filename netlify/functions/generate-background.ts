import type { Handler } from "@netlify/functions";
import { GenerationRequestSchema } from "@soft-melanin/shared";
import { getContentGenerator } from "../../apps/web/lib/engine";
import prisma from "../../apps/web/lib/prisma";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const jobId = body.jobId as string | undefined;

  if (!jobId) {
    return { statusCode: 400, body: "Missing jobId" };
  }

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return { statusCode: 404, body: "Job not found" };
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "running" },
  });

  try {
    const parsedRequest = JSON.parse(job.request);
    const validation = GenerationRequestSchema.safeParse(parsedRequest);
    if (!validation.success) {
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          errors: JSON.stringify(
            validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
          ),
          completedAt: new Date(),
        },
      });
      return { statusCode: 200, body: "Validation failed" };
    }

    const generator = getContentGenerator();
    const response = await generator.generate(validation.data);

    const artifactIds: string[] = [];
    if (response.artifacts.length > 0) {
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
            seedIdea: validation.data.seedIdea,
            monthlyTheme: validation.data.monthlyTheme || null,
          },
        });

        artifact.id = saved.id;
        artifactIds.push(saved.id);
      }

      await prisma.generationSession.create({
        data: {
          seedIdea: validation.data.seedIdea,
          monthlyTheme: validation.data.monthlyTheme || null,
          segments: JSON.stringify(validation.data.segments),
          platforms: JSON.stringify(validation.data.platforms),
          includeProductMentions: validation.data.includeProductMentions || false,
          generateABVariants: validation.data.generateABVariants || false,
          artifactIds: JSON.stringify(artifactIds),
          success: response.success,
          errors: response.errors ? JSON.stringify(response.errors) : null,
        },
      });
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: response.success ? "completed" : "completed_with_errors",
        artifactIds: JSON.stringify(artifactIds),
        errors: response.errors ? JSON.stringify(response.errors) : null,
        completedAt: new Date(),
      },
    });

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errors: JSON.stringify([
          error instanceof Error ? error.message : "Unknown error",
        ]),
        completedAt: new Date(),
      },
    });
    return { statusCode: 500, body: "Generation failed" };
  }
};
