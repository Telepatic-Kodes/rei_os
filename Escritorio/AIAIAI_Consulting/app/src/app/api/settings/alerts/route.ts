import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AlertConfigSchema } from "@/lib/schemas";
import { loadAlertConfig, saveAlertConfig } from "@/lib/alert-config";

export async function GET() {
  try {
    const config = loadAlertConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Failed to load alert config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = AlertConfigSchema.parse(body);
    saveAlertConfig(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return NextResponse.json(
        { error: "Validation failed", details: messages },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save alert config" },
      { status: 500 }
    );
  }
}
