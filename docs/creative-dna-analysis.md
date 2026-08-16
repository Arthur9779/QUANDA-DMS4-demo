# Ontology-backed Creative DNA analysis

PR 3 adds a server-side project-analysis capability without connecting it to the visible roadmap flow.

```text
Project input
    ↓
PR 2 ontology retrieval (maximum 60 candidates)
    ↓
one Gemini structured classification call
    ↓
canonical ID and provenance validation
    ↓
Creative DNA v1
```

## Boundary and contracts

`POST /api/project-analysis` accepts the project brief, experience, required applications, output, quality target, interface language, and tutorial language. Deadline and availability may be included as constraints. The API key remains server-side, and the response never contains prompts or secrets.

The result reuses `CreativeDNASchema` from `src/contracts/knowledge.ts`. It remains a flexible collection of canonical concepts, unknown wording, and constraints rather than a discipline-specific object. Current experience is returned separately as capability context so it cannot be mistaken for a style.

## Classification

The classifier receives only the bounded candidate set returned by PR 2. It uses one low-temperature Gemini request with a strict JSON Schema. `GEMINI_CLASSIFICATION_MODEL` controls the model and falls back to `GEMINI_MODEL`.

Every returned ontology ID is checked against both the compiled ontology and the allowed candidate set. Exact required applications can be added deterministically even if semantic retrieval omitted them. Accepted concept labels, families, and categories are always overwritten with local canonical metadata.

Provenance priority during deduplication is:

```text
explicit_requirement > user_added > user_preference > ai_inferred
```

Evidence is limited to a source field and an observable excerpt present in that field. Unsupported excerpts are removed. Conflicting concepts with different canonical IDs remain present for PR 4 review.

## Unknown concepts

Invented or disallowed ontology IDs are rejected. Their original model label can be preserved as an unknown concept. User phrases such as `neo-y2k eco-rave` are also preserved directly with optional nearest candidate IDs; nearest IDs are suggestions, not confirmed classifications.

## Deterministic fallback

When Gemini is not configured, times out, fails, or returns invalid output, analysis still preserves:

- Exact required applications and hard constraints
- Directly named canonical concepts
- Original unknown aesthetic wording
- The original project intent and capability context

The response is marked `source: "fallback"`; fallback inferences use conservative confidence and do not pretend to be model insights.

## Developer commands

Offline inspection requires no API key:

```bash
pnpm creative-dna -- "I want a Bauhaus poster reacting to music"
pnpm creative-dna --json -- "I want a neo-y2k eco-rave look"
pnpm eval:creative-dna
```

Live classification uses the configured semantic index and Gemini key:

```bash
pnpm creative-dna:live -- "Create a TouchDesigner installation" --app=TouchDesigner
```

## Deferred

PR 4 will add the Creative DNA review/editing UI. Image-reference analysis, tutorial ranking, and roadmap integration remain deferred to later PRs.
