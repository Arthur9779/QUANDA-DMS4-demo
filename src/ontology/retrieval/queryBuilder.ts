export interface OntologyProjectQueryInput {
  projectBrief: string;
  currentExperience?: string;
  requiredApplications?: string[];
  outputType?: string;
  qualityTarget?: string;
  tutorialLanguage?: "en" | "vi" | "either";
}

function clean(value: string | undefined, maximumLength: number): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, maximumLength);
}

export function buildOntologyRetrievalQuery(
  input: OntologyProjectQueryInput,
): string {
  const brief = clean(input.projectBrief, 3_000);
  if (!brief) throw new Error("A project brief is required for ontology retrieval");

  const sections = [`PRIMARY PROJECT INTENT\n${brief}`];
  const applications = (input.requiredApplications ?? [])
    .map((application) => clean(application, 200))
    .filter(Boolean);
  if (applications.length > 0) {
    sections.push(`EXPLICIT REQUIRED APPLICATIONS\n${applications.join(", ")}`);
  }

  const outputType = clean(input.outputType, 240);
  if (outputType) sections.push(`DELIVERABLE / OUTPUT\n${outputType}`);

  const qualityTarget = clean(input.qualityTarget, 240);
  if (qualityTarget) sections.push(`QUALITY TARGET\n${qualityTarget}`);

  if (input.tutorialLanguage) {
    sections.push(`TUTORIAL LANGUAGE CONTEXT\n${input.tutorialLanguage}`);
  }

  const experience = clean(input.currentExperience, 1_200);
  if (experience) {
    sections.push(
      `SECONDARY EXPERIENCE CONTEXT — use for prerequisites only, not creative intent\n${experience}`,
    );
  }

  return sections.join("\n\n");
}
