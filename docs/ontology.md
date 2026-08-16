# QUANDA runtime ontology

## Source of truth

`knowledge/quanda.skills` is the canonical, human-maintained ontology. The compiled `src/ontology/generated/ontology.json` file is derived runtime data and must not be edited by hand. The application does not ship or parse the raw `.skills` file in the browser.

The source currently uses this hierarchy:

```text
## numbered family heading
### category heading
- concept label
```

The document title and `Key: value` preamble metadata are also retained by the compiler. Relationships are supported by the PR 0 relationship contract, but the current source contains no explicit relationship records, so the generated relationship list is empty. The compiler does not invent edges from nearby labels.

## Updating the ontology

```bash
edit knowledge/quanda.skills
pnpm ontology:build
pnpm ontology:index
pnpm test
pnpm eval:ontology
pnpm eval:retrieval
pnpm build
```

Commit the canonical source and generated JSON together. Normal production and Sites builds run `pnpm ontology:check`; they fail with a regeneration instruction if the source hash, parser output, or generated file is stale.

## Canonical IDs

IDs are lowercase, ASCII-safe, and derived from the semantic hierarchy rather than list position:

```text
family-slug.category-slug.concept-slug
```

Numeric family ordering such as `1.` is excluded, so moving a family or concept does not rename it. Unicode is normalized and transliterated where practical; specialist punctuation receives readable forms (`C++` becomes `c-plus-plus`, `C#` becomes `c-sharp`, and `p5.js` becomes `p5-js`). IDs longer than the PR 0 limit receive a deterministic hash suffix.

Slash-separated labels remain canonical labels and expose their parts as lexical aliases. Parenthetical disambiguation stays in the display label. Every runtime node retains its source line and column in metadata; its `family`, `category`, and `label` fields preserve the reconstructable canonical path.

## Collision policy

Different labels that produce the same ASCII slug all receive deterministic content-hash suffixes. The result does not depend on source order. Exact duplicate concepts in one family/category are merged into one node, with every source position retained and an `exact_duplicate` diagnostic recorded. Duplicate hierarchy headings and any unresolved canonical ID are fatal compiler errors.

The generated artifact includes compact collision diagnostics because they are useful for curation. It omits a generated timestamp so identical source produces byte-identical output.

## Runtime and retrieval

`src/ontology/runtime.ts` validates the generated artifact once and exposes ID, family, category, exact-label, alias, token, and prefix lookups. Nothing imports it from the current client experience, so the ontology is not added to the initial browser bundle and existing roadmap/tutorial behavior is unchanged.

PR 2 adds a server-side hybrid retrieval layer, deterministic search documents, and an optional Gemini File Search index. See [`ontology-retrieval.md`](ontology-retrieval.md) for setup, freshness, fallback, diagnostics, and evaluation details. PR 3 will classify Creative DNA against canonical IDs, and PR 5 will use those IDs for tutorial classification and matching. Creative DNA UI, tutorial discovery/ranking, and roadmap prompt changes remain intentionally outside this PR.
