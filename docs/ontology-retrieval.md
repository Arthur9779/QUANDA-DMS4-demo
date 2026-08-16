# Ontology semantic retrieval

QUANDA retrieves a small, relevant set of canonical ontology concepts before any downstream reasoning. The full ontology remains the source of truth, but it is never inserted wholesale into a model prompt.

```text
knowledge/quanda.skills
        |
        v
ontology compiler --> ontology.json --> search-documents.jsonl
                                              |
                                              v
                                   Gemini File Search store
                                              |
user brief --> deterministic query builder --> hybrid retrieval
                                              |
                         exact + semantic + lexical + fallback
                                              |
                                     canonical node IDs
```

## Backend choice

The managed provider is [Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search), called through the Gemini Interactions API. File Search provides persistent indexed storage and semantic retrieval, while Gemini structured output constrains the response to canonical ontology IDs. QUANDA still validates and hydrates every returned ID from the local compiled ontology.

This provider is isolated behind `OntologyRetriever`. The deterministic local retriever is always available for development, tests, missing credentials, stale indexes, timeouts, provider errors, and invalid provider output. A future vector database can replace the managed adapter without changing callers.

## Search documents

`src/ontology/generated/search-documents.jsonl` contains one compact document per canonical node. Each record includes only the node ID and honest searchable text derived from its label, aliases, family, category, and description. It does not invent explanatory prose or relationships.

The accompanying manifest records:

- Ontology schema version and canonical source hash
- Document count
- SHA-256 of the generated JSONL

Both generated files are deterministic and committed with the canonical source. Production builds run `pnpm ontology:check`, which rejects stale ontology or search artifacts.

## Build and index workflow

After editing `knowledge/quanda.skills`:

```bash
pnpm ontology:build
pnpm ontology:index
pnpm ontology:index:status
pnpm eval:retrieval
```

`ontology:index` creates a fresh File Search store by default, uploads the generated JSONL once, waits for indexing, and records a local manifest at `.quanda/ontology-index.json`. It prints the store name and ontology hash that must be copied into deployment environment variables. Indexing is separate from runtime requests and is never performed during a user request or production build.

To reuse an explicitly chosen store, pass `--store=fileSearchStores/...` to the index command. A new ontology source hash must still be indexed and deployed with the matching `GEMINI_FILE_SEARCH_ONTOLOGY_HASH`.

## Environment variables

| Variable | Required for live retrieval | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Server-only Gemini API key. |
| `GEMINI_BASE_URL` | No | Defaults to Google's `v1beta` API endpoint. |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.1-flash-lite`. |
| `GEMINI_FILE_SEARCH_STORE` | Yes | Resource name of the indexed File Search store. |
| `GEMINI_FILE_SEARCH_ONTOLOGY_HASH` | Yes | Canonical ontology source hash indexed in that store. |
| `GEMINI_FILE_SEARCH_EMBEDDING_MODEL` | No | Store embedding model; defaults to `models/gemini-embedding-2`. |
| `GEMINI_RETRIEVAL_MODEL` | No | Model used for retrieval interactions; falls back to `GEMINI_MODEL`. |
| `GEMINI_RETRIEVAL_TIMEOUT_MS` | No | Semantic-provider timeout, clamped to 250–15,000 ms. |

The current canonical source hash is available in `src/ontology/generated/ontology.json` and `search-documents.manifest.json`. If the configured hash differs, live retrieval is disabled and the local retriever is used rather than querying a stale index.

## Runtime behavior

The deterministic query builder prioritizes project intent, explicit applications, output, quality, and tutorial language. Experience is deliberately placed last and marked as prerequisite context so a phrase such as “I know Blender” does not turn Blender into the primary creative goal.

The hybrid retriever:

1. Finds exact required and explicitly named concepts locally.
2. Requests semantic candidates when the File Search configuration is current.
3. Adds lexical candidates and merges by canonical ID.
4. Applies family/category filters and a 10–150 result bound (default 60).
5. Diversifies repeated labels and families while preserving exact matches.
6. Caches identical requests briefly using the ontology source hash in the key.
7. Falls back safely when the managed provider cannot be used.

Diagnostics expose the backend, candidate sources, fallback reason, latency, cache state, configured/current source hashes, and filters. The full query is included only when explicitly enabled for local diagnostics.

Use the offline or live diagnostic CLI:

```bash
pnpm ontology:search -- "Bauhaus generative poster reacting to music"
pnpm ontology:search:live -- "TouchDesigner hand-tracking installation" --app=TouchDesigner
```

## Evaluation

`pnpm eval:retrieval` runs the PR 0 bilingual benchmark without network access. It reports mapped candidate recall, required-concept recall, irrelevant candidate rate, average candidate count, family diversity, and fallback cases. Expected labels that do not map unambiguously to the current ontology are reported separately rather than guessed.

The offline score is a reproducible fallback baseline, not a claim about live File Search quality. Live-provider evaluation requires an indexed store and credentials and should be recorded separately.

Creative DNA classification, the review UI, tutorial discovery/ranking, and roadmap prompt integration remain deferred to their respective PRs.
