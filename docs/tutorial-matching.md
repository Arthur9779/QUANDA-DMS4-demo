# Skill gaps and precise tutorial matching

PR 5 inserts a focused learning-path review after Creative DNA confirmation and before the existing roadmap route.

```text
Confirmed Creative DNA
→ required project skills
→ compare with user capability
→ minimum prerequisite chain
→ Tutorial Needs
→ tutorial discovery and classification
→ deterministic ranking
→ user-reviewed tutorial choices
```

The system teaches contextual skills rather than treating an application name as a request for a complete software course. Capability statements can mark relevant foundations as known, partial, or needing learning. Prerequisite expansion is cycle-safe, limited to two levels, topologically ordered, and deduplicated.

## Discovery and Tutorial DNA

`TutorialDiscoveryProvider` keeps downstream matching independent of YouTube. The default tiered provider uses:

1. verified QUANDA catalogue;
2. indexed, technique-specific resources;
3. optional official YouTube Data API discovery when `YOUTUBE_API_KEY` is available;
4. a no-match result instead of a fabricated URL.

Only provider video IDs create YouTube links. Focused queries contain software, skill, level, and `tutorial`; the private project brief is never sent to discovery providers.

Tutorial metadata is normalized into versioned Tutorial DNA. Classification is cached by provider ID, metadata hash, classifier version, and the ontology-backed IDs already present in the record. The current deterministic classifier does not require Gemini or transcripts.

## Ranking v1

Positive weights total 100:

| Signal | Weight |
| --- | ---: |
| required skill | 24 |
| technique | 18 |
| required software | 10 |
| prerequisite fit | 9 |
| output | 7 |
| source quality | 7 |
| user level | 6 |
| language | 5 |
| software version | 4 |
| specificity | 4 |
| recency | 3 |
| aesthetic | 3 |

Penalties are: wrong software `-45` (reliable mismatches are pre-filtered), prerequisite mismatch up to `-18`, broad course `-30`, excessive duration up to `-12`, stale `-10`, and unverified `-5`. Broken resources are rejected. Low classification confidence moderates the score by up to three points.

Tie-breaking is deterministic: score, source quality, specificity, duration, then stable tutorial ID. One selected resource per need prevents duplicate recommendations. A broad course is not impossible: when a beginner has several relevant foundations, its breadth penalty is removed, but it must still contain the required skill.

## Corrections and persistence

The learning-plan UI supports `I already know this`, `Need help`, `Not relevant`, `Replace`, `Too advanced`, and `Too long` without another AI request. Replacements keep rejected provider IDs and never immediately return the same resource. Decisions are stored at `quanda:v1:learning-plan` with learning-plan and ranking versions plus the project fingerprint. Matching the same project again merges these decisions; changed project inputs invalidate the saved plan.

## Evaluation and scope boundary

`pnpm eval:tutorials` runs six critical offline cases without Gemini, YouTube, or network access. `pnpm tutorial:match --case <id>` prints the explainable chain and selected resources for review.

PR 5 keeps `/api/roadmap` unchanged. PR 6 will use the confirmed Creative DNA, skill gaps, and selected tutorials as roadmap dependencies and separate learning time from production time.
