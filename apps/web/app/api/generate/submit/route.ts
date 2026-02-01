import { NextRequest, NextResponse } from "next/server";
import { GenerationRequestSchema } from "@soft-melanin/shared";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const body = await request.json();
  const validation = GenerationRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        errors: validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      },
      { status: 400 }
    );
  }

  const job = await prisma.generationJob.create({
    data: {
      status: "queued",
      request: JSON.stringify(validation.data),
    },
  });

  const origin = new URL(request.url).origin;
  const backgroundUrl = `${origin}/.netlify/functions/generate-background`;

  void fetch(backgroundUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id }),
  });

  return NextResponse.json({
    success: true,
    jobId: job.id,
    requestId,
  });
}
