import { NextResponse } from "next/server";
import { z } from "zod";
import { searchOntologyByLabel } from "@/src/ontology/runtime";
import { OntologySearchResponseSchema } from "@/src/creative-dna-review/contracts";

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
  const results = searchOntologyByLabel(query.data, { limit: 12 }).map(
    ({ id, label, family, category }) => ({ id, label, family, category }),
  );
  return NextResponse.json(
    OntologySearchResponseSchema.parse({ results }),
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
