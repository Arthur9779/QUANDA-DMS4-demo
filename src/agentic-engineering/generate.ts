import { createHash } from "node:crypto";
import {
  EngineeringInterpretationSchema,
  EngineeringProjectSchema,
  EngineeringRoadmapSchema,
  type EngineeringInterpretation,
  type EngineeringProject,
  type EngineeringRoadmap,
  type EngineeringTask,
} from "@/src/project-path/contracts";

const platformLabels: Record<EngineeringProject["targetPlatform"], string> = {
  web_application: "web application",
  mobile_application: "mobile application",
  desktop_application: "desktop application",
  api_backend: "API/backend system",
  automation: "automation",
  game: "game",
  data_project: "data-processing system",
  plugin_extension: "plugin or extension",
  other: "technical system",
};

function splitRequirements(value: string): string[] {
  const parts = value
    .split(/\n|•|;|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter((item) => item.length >= 8);
  return [...new Set(parts)].slice(0, 8);
}

function stackFor(project: EngineeringProject): string[] {
  const explicit = project.technologies
    ? project.technologies.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
    : [];
  return [...new Set(explicit)].slice(0, 10);
}

function repositoryContext(project: EngineeringProject): string {
  if (project.repositoryUrl) return `Use the repository at ${project.repositoryUrl}.`;
  if (project.projectLocation) return `Use the existing project at ${project.projectLocation}.`;
  return "No existing repository was provided; initialize the project in the user's chosen workspace.";
}

export function interpretEngineeringProject(input: unknown): EngineeringInterpretation {
  const project = EngineeringProjectSchema.parse(input);
  const stack = stackFor(project);
  const features = splitRequirements(project.technicalBrief);
  const risks = [
    project.startingPoint === "new_project"
      ? "The first implementation must prove the riskiest user-visible behaviour before broad build-out."
      : "The existing repository or project context may contain conventions and failures that must be preserved.",
    project.deadline
      ? `The delivery must fit the available time before ${project.deadline}.`
      : "The delivery window is not known.",
  ];
  if (project.existingErrors) risks.push(`Known blocker to reproduce first: ${project.existingErrors}`);
  return EngineeringInterpretationSchema.parse({
    path: "agentic_engineering",
    productType: platformLabels[project.targetPlatform],
    startingPoint: project.startingPoint,
    coreFeatures: features.length > 0 ? features : [project.technicalBrief],
    suggestedTechnologyStack: stack,
    repositoryContext: repositoryContext(project),
    dataAndApiRequirements: /\b(api|database|data|backend|auth|search|integration)\b/i.test(project.technicalBrief)
      ? "The brief mentions data, API, backend, authentication, search, or integration work; identify the contract and failure cases before implementation."
      : "No separate data or API requirement was explicitly provided; keep this surface minimal until the brief requires it.",
    deploymentTarget: project.deploymentTarget || "No deployment target provided; confirm it before the preview step.",
    definitionOfDone: project.definitionOfDone,
    mainRisks: risks,
    importantConstraints: project.constraints ? splitRequirements(project.constraints) : ["No additional constraints were provided."],
    source: "fallback",
  });
}

function task(input: Omit<EngineeringTask, "supervisionResources">): EngineeringTask {
  return { ...input, supervisionResources: [] };
}

export function generateEngineeringRoadmap(
  input: unknown,
  interpretationInput?: unknown,
  options: { notice?: string; source?: EngineeringRoadmap["source"] } = {},
): EngineeringRoadmap {
  const project = EngineeringProjectSchema.parse(input);
  const interpretation = EngineeringInterpretationSchema.parse(
    interpretationInput ?? interpretEngineeringProject(project),
  );
  const stack = interpretation.suggestedTechnologyStack.length > 0
    ? interpretation.suggestedTechnologyStack
    : [platformLabels[project.targetPlatform]];
  const repo = interpretation.repositoryContext;
  const featureLabel = interpretation.coreFeatures[0] ?? "the core user outcome";
  const tasks: EngineeringTask[] = [
    task({
      id: "inspect-or-initialize", order: 1, title: project.startingPoint === "new_project" ? "Initialize the project workspace" : "Inspect the repository and reproduce the current state",
      outcome: project.startingPoint === "new_project" ? `A clean ${platformLabels[project.targetPlatform]} workspace exists with the selected conventions.` : "The agent has documented the repository structure, current commands, and the reported bug or missing feature.",
      whyItMatters: "The agent can only make safe changes when the actual repository, scripts, and starting state are known.", executor: project.startingPoint === "new_project" ? "agent" : "hybrid", dependencies: [], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Inspect the project context before editing. ${repo} Identify the package manager, entry points, existing conventions, test commands, and deployment configuration. Preserve unrelated behaviour and report blockers before implementation.`,
      acceptanceCriteria: ["The repository or workspace location is recorded.", "The existing build, test, and lint commands are identified or the missing commands are explicitly reported.", "The current state can be reproduced before changes."],
      verificationChecks: ["Run the existing type-check, lint, and test commands where available.", "Record any baseline failures separately from new failures."], expectedArtifact: "Repository inspection note and reproducible baseline.", humanReviewCheckpoint: "Confirm the agent is working in the intended repository and that unrelated project files are not being changed.", estimatedAgentMinutes: 35, estimatedHumanReviewMinutes: 10, failureFallback: "If the repository cannot be accessed, pause and ask the user to provide the correct location or a reproducible archive.",
    }),
    task({
      id: "contracts", order: 2, title: "Establish the project contract and acceptance checks", outcome: `The brief becomes a concrete definition of done for ${platformLabels[project.targetPlatform]}.`, whyItMatters: "A coding agent needs observable boundaries instead of a vague request.", executor: "hybrid", dependencies: ["inspect-or-initialize"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Translate the confirmed brief into project-local documentation or tests. Keep the definition of done explicit: ${project.definitionOfDone}. Do not add features that are not required by the brief.`, acceptanceCriteria: ["Every required outcome from the definition of done is represented by a check or documented human decision.", "Out-of-scope work is written down.", "The contract names the expected input, output, and failure behaviour."], verificationChecks: ["Review the contract against the original brief.", "Run the contract tests or checks added by the agent."], expectedArtifact: "Project contract, acceptance checklist, and scope boundary.", humanReviewCheckpoint: "Approve the scope before implementation starts.", estimatedAgentMinutes: 40, estimatedHumanReviewMinutes: 15, failureFallback: "If the brief is underspecified, keep the contract open and ask only for the missing decision that blocks implementation.",
    }),
    task({
      id: "vertical-slice", order: 3, title: `Prove the riskiest path with a thin vertical slice`, outcome: `A minimal end-to-end slice demonstrates ${featureLabel} through the real project boundary.`, whyItMatters: "Early proof exposes integration and deployment risks before the full feature set is built.", executor: "hybrid", dependencies: ["contracts"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Implement the smallest end-to-end slice that proves ${featureLabel}. Use existing project conventions, keep the change reversible, and add focused tests around the riskiest behaviour.`, acceptanceCriteria: ["The primary user or system path works end to end in the local environment.", "The slice uses the actual project boundary rather than a disconnected mock.", "A focused regression test covers the riskiest behaviour."], verificationChecks: ["Run the focused test suite.", "Run the local development or preview command and exercise the slice manually."], expectedArtifact: "Working thin vertical slice with a focused regression test.", humanReviewCheckpoint: "Review the first working slice and confirm the direction before the agent expands scope.", estimatedAgentMinutes: 120, estimatedHumanReviewMinutes: 20, failureFallback: "If the slice fails, keep the failing reproduction and reduce the slice to the smallest failing boundary rather than adding unrelated infrastructure.",
    }),
    task({
      id: "core-features", order: 4, title: "Implement the core features in dependency order", outcome: `The required ${platformLabels[project.targetPlatform]} behaviour is complete for the confirmed scope.`, whyItMatters: "Dependency order prevents polishing or integrating features that the core path cannot support.", executor: "agent", dependencies: ["vertical-slice"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Implement the remaining confirmed requirements in dependency order. Reuse existing components, utilities, and patterns. Keep each change small, add or update focused tests, and stop when the definition of done is satisfied.`, acceptanceCriteria: ["Each in-scope feature is implemented and connected to the working slice.", "Existing routes and behaviour remain intact unless the brief requires a change.", "Focused tests cover normal and important failure cases."], verificationChecks: ["Run type-check and lint.", "Run focused tests after each logical feature group.", "Inspect the diff for unrelated changes."], expectedArtifact: "Core implementation, focused tests, and an auditable diff.", humanReviewCheckpoint: "Review the feature behaviour and diff before integration work.", estimatedAgentMinutes: 180, estimatedHumanReviewMinutes: 30, failureFallback: "If a requirement conflicts with the existing architecture, document the conflict and propose the smallest scoped change for review.",
    }),
    task({
      id: "quality-failures", order: 5, title: "Add failure handling and regression coverage", outcome: "The system explains and safely handles the failure states that matter for the confirmed scope.", whyItMatters: "A happy-path demo is not a reliable deliverable when inputs, services, or permissions fail.", executor: "agent", dependencies: ["core-features"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Audit the implemented flow for invalid input, empty states, network/service failures, permission problems, and loading states that apply to this project. Add focused tests and preserve the current UX conventions.`, acceptanceCriteria: ["Relevant failure states have a deliberate user-visible or logged outcome.", "Regression tests cover the highest-impact failure cases.", "No secrets or credentials are committed."], verificationChecks: ["Run the full relevant test suite.", "Exercise at least one failure path locally.", "Check the diff for credentials and unsafe logging."], expectedArtifact: "Failure-state implementation and regression tests.", humanReviewCheckpoint: "Review whether the failure behaviour is understandable and safe.", estimatedAgentMinutes: 100, estimatedHumanReviewMinutes: 20, failureFallback: "If a failure cannot be reproduced, document the missing environment detail instead of claiming it was verified.",
    }),
    task({
      id: "data-integration", order: 6, title: "Integrate data, APIs, or external services that the brief requires", outcome: interpretation.dataAndApiRequirements.startsWith("No separate") ? "The project confirms that no separate data or API surface is required for the current scope." : "The required data or service contracts work with explicit loading, error, and empty states.", whyItMatters: "Integration boundaries are a common source of hidden failures and should be verified before deployment.", executor: interpretation.dataAndApiRequirements.startsWith("No separate") ? "agent" : "hybrid", dependencies: ["core-features", "quality-failures"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Use the confirmed project contract to implement only required integration work. ${interpretation.dataAndApiRequirements} If no integration is required, verify that the current scope does not need one and document that decision.`, acceptanceCriteria: ["Only required data or service dependencies are introduced.", "The integration contract is explicit or the no-integration decision is documented.", "Secrets come from the intended environment configuration."], verificationChecks: ["Run mocked or local integration tests where appropriate.", "Verify missing credentials fail safely.", "Check environment-variable documentation."], expectedArtifact: "Integrated service boundary or documented no-integration decision.", humanReviewCheckpoint: "Confirm the data source, permissions, and privacy expectations before using real credentials.", estimatedAgentMinutes: 90, estimatedHumanReviewMinutes: 20, failureFallback: "Use a documented local stub only for development and keep the real integration as an explicit follow-up.",
    }),
    task({
      id: "security-quality", order: 7, title: "Run security, quality, and accessibility checks", outcome: "The project passes the checks that apply to its platform and documented constraints.", whyItMatters: "Automated checks catch regressions an agent should not leave for a final human pass.", executor: "agent", dependencies: ["data-integration"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Run the repository's available quality checks and add only the focused checks needed by the confirmed scope. For user-facing software, include keyboard/accessibility checks; for services, include validation and permission checks. Report unavailable checks honestly.`, acceptanceCriteria: ["Applicable type, lint, test, security, and accessibility checks are run or their absence is documented.", "New failures are fixed or clearly reported.", "The final diff has no accidental debug output or secrets."], verificationChecks: ["Run type-check, lint, tests, and build where available.", "Run an accessibility smoke check for interactive UI.", "Review dependency and permission changes."], expectedArtifact: "Validation report with passing checks and explicit limitations.", humanReviewCheckpoint: "Review the checks and decide whether any known limitation blocks delivery.", estimatedAgentMinutes: 70, estimatedHumanReviewMinutes: 20, failureFallback: "Keep the failing command and explain the environment limitation instead of claiming success.",
    }),
    task({
      id: "preview", order: 8, title: "Build and deploy a reviewable preview", outcome: `A preview of the ${platformLabels[project.targetPlatform]} is available at ${project.deploymentTarget || "the intended deployment target"}.`, whyItMatters: "A real preview reveals environment, routing, responsive, and integration problems that local tests cannot prove.", executor: "hybrid", dependencies: ["security-quality"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: `Prepare the project for a reviewable preview using the existing deployment conventions. Do not invent credentials. Document required environment variables and run the production build before deployment.`, acceptanceCriteria: ["The production build completes or the blocking failure is recorded.", "The preview uses the intended environment configuration.", "The preview URL or deployment artifact is recorded for review."], verificationChecks: ["Open the preview and exercise the core path.", "Check browser console and network failures.", "Verify the deployed version matches the reviewed commit."], expectedArtifact: "Reviewable preview deployment or reproducible deployment blocker.", humanReviewCheckpoint: "Review the preview on the target devices and confirm visual and functional behaviour.", estimatedAgentMinutes: 80, estimatedHumanReviewMinutes: 30, failureFallback: "If deployment is unavailable, provide the production build artifact and a local preview command without claiming deployment success.",
    }),
    task({
      id: "delivery", order: 9, title: "Complete human review and final delivery", outcome: `The project is handed over with evidence that it satisfies: ${project.definitionOfDone}.`, whyItMatters: "The agent can prepare evidence, but the user owns subjective approval, access decisions, and final delivery.", executor: "human", dependencies: ["preview"], relevantTechnologies: stack, repositoryContext: repo,
      agentPrompt: "Prepare a concise handoff note containing the final diff summary, verification results, known limitations, environment requirements, and preview or artifact location. Do not mark subjective review complete on the user's behalf.", acceptanceCriteria: ["The user has reviewed the preview or artifact.", "The definition of done is checked item by item.", "Known limitations and required follow-up are recorded.", "The final repository state or handoff location is unambiguous."], verificationChecks: ["Run the final smoke test after the last change.", "Confirm the intended branch, preview, or artifact was delivered.", "Confirm no unreviewed changes remain."], expectedArtifact: "Approved final delivery and handoff note.", humanReviewCheckpoint: "Make the final accept/reject decision and deliver the approved artifact.", estimatedAgentMinutes: 25, estimatedHumanReviewMinutes: 30, failureFallback: "Return to the smallest failed acceptance criterion and create a follow-up task; do not silently broaden the scope.",
    }),
  ];
  const id = createHash("sha256").update(JSON.stringify({ project, interpretation })).digest("hex").slice(0, 12);
  const roadmap = {
    path: "agentic_engineering" as const,
    id: `engineering-${id}`,
    language: project.interfaceLanguage,
    title: project.interfaceLanguage === "vi" ? "Lộ trình kỹ thuật tác nhân cho dự án của bạn" : "Agentic engineering path for your project",
    summary: project.interfaceLanguage === "vi"
      ? `Lộ trình tập trung vào đầu ra phần mềm cụ thể, phối hợp giữa agent và người dùng, với điểm kiểm tra rõ ràng trước khi giao sản phẩm.`
      : `A project-specific build sequence with explicit agent and human ownership, acceptance criteria, and verification at every important boundary.`,
    source: options.source ?? "deterministic",
    notice: options.notice ?? (project.interfaceLanguage === "vi"
      ? "QUANDA đang dùng bộ tạo lộ trình kỹ thuật xác định để giữ kết quả nhất quán và không bịa thông tin khi không có tăng cường AI."
      : "QUANDA used its deterministic engineering generator so the result stays reproducible and does not invent project details when AI enhancement is unavailable."),
    interpretation,
    tasks,
    totalEstimatedAgentMinutes: tasks.reduce((sum, item) => sum + item.estimatedAgentMinutes, 0),
    totalEstimatedHumanReviewMinutes: tasks.reduce((sum, item) => sum + item.estimatedHumanReviewMinutes, 0),
    warnings: [
      "Agent-executable tasks still require the user to review the diff and accept project-specific trade-offs.",
      ...(project.deploymentTarget ? [] : ["No deployment target was provided; confirm it before the preview task."]),
    ],
  };
  return EngineeringRoadmapSchema.parse(roadmap);
}
