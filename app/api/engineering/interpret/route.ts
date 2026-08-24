import { NextRequest, NextResponse } from "next/server";
import { interpretEngineeringProject } from "@/src/agentic-engineering";
import { EngineeringProjectSchema } from "@/src/project-path/contracts";

export async function POST(request: NextRequest) {
  try {
    const input = EngineeringProjectSchema.parse(await request.json());
    return NextResponse.json(interpretEngineeringProject(input), {
      headers: { "Cache-Control": "no-store", "X-QUANDA-Source": "fallback" },
    });
  } catch {
    return NextResponse.json({ error: "validation", message: "Review the engineering project details." }, { status: 400 });
  }
}
