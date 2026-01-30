import { NextRequest, NextResponse } from "next/server";
import { getProjects, writeProjects } from "@/lib/data";

const VALID_STATUSES = ["active", "paused", "completed"] as const;
type Status = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is Status {
  return typeof value === "string" && VALID_STATUSES.includes(value as Status);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'id' field" },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const projects = getProjects();
    const index = projects.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `Project with id '${id}' not found` },
        { status: 400 }
      );
    }

    projects[index].status = status;
    writeProjects(projects);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
