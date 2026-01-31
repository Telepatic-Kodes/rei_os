import { NextResponse } from "next/server";
import { getActiveAlerts } from "@/lib/alert-evaluator";

export async function GET() {
  try {
    const alerts = await getActiveAlerts();
    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ alerts: [] });
  }
}
