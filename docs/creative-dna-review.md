# Creative DNA review

PR 4 inserts a user-controlled review between project input and the existing roadmap flow:

```text
Project brief
    ↓
POST /api/project-analysis
    ↓
Creative DNA review
    ↓
User confirmation
    ↓
Existing /api/roadmap continuation
```

The review displays human-readable canonical labels grouped from ontology family and category metadata. Raw ontology IDs remain internal except for the optional development-only details panel.

## Review operations

Pure functions in `src/creative-dna-review/operations.ts` implement confirmation, rejection, canonical additions, free-text additions, restoration, intent editing, and override merging. Removing a concept keeps it with `status: user_rejected`. Canonical additions use `source: user_added` and `status: user_confirmed`. Free-text additions preserve the user's wording as an unknown concept.

Explicit requirements are protected from the normal removal path. The UI requires a separate warning and deliberate confirmation before applying the same rejected status.

Re-analysis does not run after tag edits. When the user intentionally analyzes again, user-added concepts and prior rejections are merged over the new model result so the same-session correction remains authoritative.

## Ontology search

`GET /api/ontology/search?q=` performs deterministic server-side label search over the compiled runtime ontology. It returns at most 12 canonical matches with family and category context. The browser never renders or downloads the full 25,000-concept ontology, and search does not call Gemini.

## Persistence and compatibility

The review is stored locally under `quanda:v1:creative-dna-analysis` as a validated record containing:

- `reviewVersion: 1`
- the project-input fingerprint
- the PR 3 analysis response and edited Creative DNA
- confirmation state, including confirmed, rejected, user-added, and unknown concepts

The fingerprint covers the creative and production inputs while excluding interface and tutorial language, so changing UI language does not make the interpretation stale. Meaningful brief, experience, requirement, deadline, availability, output, or quality changes do.

Invalid or incompatible records are ignored safely. A valid legacy PR 3 analysis payload can be loaded as an unconfirmed version-1 review when the matching saved draft is available.

## Current integration boundary

Confirmation persists Creative DNA and then calls the existing roadmap route with the existing request contract. Creative DNA does not yet drive tutorial ranking or roadmap generation. PR 5 and PR 6 own those integrations.
