import { NextResponse } from "next/server";
import { matchProjectTutorials } from "@/src/tutorial-matching";
import { TutorialMatchingRequestSchema } from "@/src/tutorial-matching/contracts";

const MAX_BODY_BYTES = 120_000;

export async function POST(request: Request) {
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = TutorialMatchingRequestSchema.safeParse(value);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    return NextResponse.json(await matchProjectTutorials(parsed.data));
  } catch {
    return NextResponse.json({ error: "matching_failed" }, { status: 500 });
  }
}
