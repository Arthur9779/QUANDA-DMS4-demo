# QUANDA knowledge contracts v1

This document defines the shared contracts that the ontology compiler, Creative DNA extraction, tutorial retrieval, and roadmap integration must use. These contracts are deliberately not connected to the current product flow yet.

## Versions

| Contract | Version field | Current value |
| --- | --- | --- |
| Creative DNA | `creativeDnaVersion` | `1` |
| Ontology node and relationship | `ontologySchemaVersion` | `1` |
| Tutorial metadata | `tutorialMetadataVersion` | `1` |
| Tutorial matching score | `tutorialMatchScoreVersion` | `1` |
| Evaluation benchmark | `benchmarkVersion` | `1` |

Later revisions must increment the relevant version when they make incompatible changes. Stored project data must be migrated explicitly rather than silently reinterpreted.

## Creative DNA

Creative DNA is a flexible collection of classified concepts, unknown terms, and project constraints. It is not a discipline-specific object with a required field for every medium.

Every concept records provenance:

- `explicit_requirement`: directly required by an assignment or user instruction. Later systems normally treat it as a hard constraint.
- `user_preference`: desired but negotiable, such as an aesthetic preference.
- `ai_inferred`: an interpretation produced by a model. It may include normalized confidence and concise source evidence.
- `user_added`: manually added during review and normally `user_confirmed`.

Concept status is independent of provenance:

- `unconfirmed`: not yet reviewed by the user.
- `user_confirmed`: explicitly accepted by the user.
- `user_rejected`: explicitly rejected and retained as project history.

A rejected concept must not be deleted merely to simplify state. Later inference must not silently re-add it in the same project state. Reconsideration requires new explicit evidence and must remain visible to the review process.

Confidence uses the inclusive `0–1` range. It is useful for AI classifications and debugging but is not required for explicit requirements or direct user edits. Evidence stores only observable input fields and short excerpts; it must never contain private reasoning or chain-of-thought.

Unknown concepts are valid creative information. A phrase such as `neo-y2k eco-rave` may be preserved verbatim with optional nearest ontology IDs instead of being forced into an inaccurate node.

## Ontology

Ontology nodes have stable IDs, labels, normalized labels, families, categories, aliases, descriptions, and forward-compatible metadata. The PR 1 compiler generates deterministic canonical IDs and a validated runtime artifact from `knowledge/quanda.skills`; see `docs/ontology.md`.

Relationships are typed. `sourceId` and `targetId` preserve direction for relationships such as `requires`, `prerequisite_of`, and `implemented_with`. Symmetric meanings such as `similar_to` still use an explicit direction in storage; a compiler or retrieval layer may materialize the reverse edge when needed.

The raw source remains canonical. Runtime consumers use the compiled artifact and never reparse the `.skills` file on each request.

## Tutorial metadata

The target tutorial contract separates provider identity, verification state, content classification, software compatibility, skills, techniques, prerequisites, aesthetics, production stages, outputs, difficulty, and tutorial breadth.

Future retrieval priority is:

1. Verified QUANDA catalogue.
2. Previously indexed and classified tutorials.
3. Live external discovery such as YouTube search.
4. No suitable tutorial.

Live discovery must not be the only source, and an empty result is preferable to a misleading recommendation.

## Tutorial matching score

The v1 score contract reserves normalized signals for required skill, application, technique, production stage, output, experience, language, version, available time, prerequisites, reliability, and specificity. It also reserves penalties for conflicts, staleness, unverified content, broken links, prerequisite mismatch, and excessive breadth.

Aesthetic similarity is a secondary bonus. It must never outweigh technical relevance. Broken links and direct topic conflicts may be configured as hard rejections.

The score schema is a contract only. PR 5 will choose weights, calibrate thresholds, and implement ranking.

## Over-teaching

`overTeachingRate` measures recommendations that introduce substantial irrelevant foundations or prerequisites when a narrower viable path exists. For example, recommending a five-hour complete Blender course to an intermediate user who only needs toon shading counts as over-teaching.

The rate is:

```text
recommendations marked as over-teaching
÷
all recommendations
```

Human-labelled fixtures provide the initial signal. Later PRs may add duration, prerequisite, and breadth heuristics without changing the metric's meaning.

## Deferred work

PRs 2–6 will add semantic retrieval, Creative DNA inference, review UI, live tutorial classification/ranking, and roadmap integration. No current Gemini prompt, tutorial recommendation, form, or roadmap behavior is changed by the ontology compiler.
