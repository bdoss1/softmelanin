import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Missing jobId" },
      { status: 400 }
    );
  }

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  let artifacts = [];
  if (job.artifactIds) {
    const ids = JSON.parse(job.artifactIds) as string[];
    if (ids.length > 0) {
      artifacts = await prisma.contentArtifact.findMany({
        where: { id: { in: ids } },
        orderBy: { createdAt: "asc" },
      });
    }
  }

  return NextResponse.json({
    success: true,
    status: job.status,
    errors: job.errors ? JSON.parse(job.errors) : undefined,
    artifacts,
    completedAt: job.completedAt,
  });
}
