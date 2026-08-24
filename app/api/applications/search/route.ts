import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApplicationSearchResponseSchema,
  searchApplications,
} from "@/src/application-search";

export const runtime = "nodejs";

const SearchQuerySchema = z.string().trim().min(2).max(80);

export async function GET(request: Request) {
  const query = SearchQuerySchema.safeParse(
    new URL(request.url).searchParams.get("q") ?? "",
  );
  if (!query.success) {
    return NextResponse.json(
      { error: "validation", message: "Search with at least two characters." },
      { status: 400 },
    );
  }
  return NextResponse.json(
    ApplicationSearchResponseSchema.parse({
      results: searchApplications(query.data, 10),
    }),
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
