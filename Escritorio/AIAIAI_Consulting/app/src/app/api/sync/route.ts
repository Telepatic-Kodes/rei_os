import { NextResponse } from "next/server";
import { runAllSyncs } from "@/lib/sync-manager";

/**
 * Manual sync trigger endpoint.
 * POST /api/sync triggers immediate sync of all data sources.
 */
export async function POST() {
  try {
    const result = await runAllSyncs();

    if (result.status === "skipped") {
      return NextResponse.json(
        {
          success: false,
          error: "Sync already in progress",
        },
        { status: 409 }
      );
    }

    if (result.status === "error") {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Sync failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      durationMs: result.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
