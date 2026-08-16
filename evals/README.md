# QUANDA evaluation benchmark

The v1 benchmark provides deterministic fixtures for measuring tutorial accuracy before any live Gemini, embedding, or YouTube work is introduced.

## Dataset

`briefs.v1.json` contains 25 cases: 18 English and 7 Vietnamese cases. It covers 3D, animation, graphic design, branding, motion graphics, illustration, UI/UX, creative coding, audio, music, photography, filmmaking, interactive installation, traditional-media emulation, and cross-application workflows.

Expected concepts use semantic labels until PR 1 supplies canonical ontology IDs. `acceptableAnyOf` supports genuinely ambiguous interpretations, and `preserveAsUnknown` identifies terms that should not be force-mapped.

## Run

```bash
pnpm eval
```

Optional paths may be supplied:

```bash
pnpm eval -- evals/briefs.v1.json evals/fixtures/naive-software-first.json
```

The runner validates both files, requires one prediction for every benchmark case, computes metrics from the labelled predictions, and prints a summary. It never calls Gemini or an external tutorial provider.

## Metrics

- **Application correctness:** expected application IDs represented among recommendations divided by all expected application IDs.
- **Required concept coverage:** required concepts covered by recommendations divided by all required concepts.
- **Precision@3:** acceptable recommendations in the first three ranks divided by three slots per case.
- **Irrelevant tutorial rate:** irrelevant recommendations divided by all recommendations.
- **Language match:** recommendations with a known language that satisfy the requested language preference.
- **Version match:** recommendations labelled compatible divided by all recommendations with a version judgement.
- **Prerequisite fit:** recommendations labelled as fitting the user's experience divided by all recommendations with a prerequisite judgement.
- **Over-teaching rate:** recommendations labelled substantially broader than necessary divided by all recommendations.
- **Verified/indexed tutorial rate:** verified or indexed recommendations divided by all recommendations.
- **Skill specificity:** recommendations labelled as addressing the required skill rather than generic software learning.

Rates where lower is better are irrelevant tutorial rate and over-teaching rate. All other rates are higher-is-better.

## Baseline fixture

`fixtures/naive-software-first.json` intentionally models weak application-first behavior. It frequently returns complete beginner courses, ignores experience, misses Vietnamese preferences, and covers only part of cross-application workflows. Its purpose is to prove that the runner exposes current failure patterns; it is not a production output snapshot.

## Add a case

1. Add a unique kebab-case ID and input to `briefs.v1.json`.
2. Record required, preferred, acceptable inferred, ambiguous, forbidden, unknown, application, tutorial-topic, and prerequisite expectations.
3. Add a prediction with the same `caseId` to every maintained fixture.
4. Run `pnpm eval` and `pnpm test`.

Do not change existing case meaning silently. Introduce a new benchmark version when expectations become incompatible.
