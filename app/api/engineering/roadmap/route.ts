import { NextRequest, NextResponse } from "next/server";
import { generateEngineeringRoadmap } from "@/src/agentic-engineering";
import { EngineeringInterpretationSchema, EngineeringProjectSchema } from "@/src/project-path/contracts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { project?: unknown; interpretation?: unknown };
    const project = EngineeringProjectSchema.parse(body.project);
    const interpretation = EngineeringInterpretationSchema.parse(body.interpretation);
    return NextResponse.json(generateEngineeringRoadmap(project, interpretation), {
      headers: { "Cache-Control": "no-store", "X-QUANDA-Source": "deterministic" },
    });
  } catch {
    return NextResponse.json({ error: "validation", message: "Review the engineering interpretation." }, { status: 400 });
  }
}
