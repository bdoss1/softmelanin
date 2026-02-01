// ============================================================================
// Scheduled Post Execution API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getSchedulerService } from "@/lib/social/scheduler";

// POST /api/social/scheduled/execute - Execute a scheduled post immediately
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduledPostId } = body;

    if (!scheduledPostId) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduled post ID is required",
        },
        { status: 400 }
      );
    }

    const scheduler = getSchedulerService();
    const result = await scheduler.executePostNow(scheduledPostId);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error("Error executing scheduled post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute scheduled post",
      },
      { status: 500 }
    );
  }
}
