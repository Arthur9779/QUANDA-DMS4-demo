import type { EngineeringInterpretation, EngineeringProject } from "@/src/project-path/contracts";
import type { RoadmapRequest } from "@/src/types";
import { calculateAvailableMinutes } from "@/src/lib/feasibility";
import { RouteEvaluationSchema, type RouteCandidate, type RouteCriterion, type RouteCriterionScore, type RouteEvidence } from "./contracts";

type RouteInput = {
  interfaceLanguage: "en" | "vi";
  projectBrief: string;
  currentExperience: string;
  deadline: string;
  hoursPerDay: number;
  daysPerWeek: number;
  tools: string[];
  requiredMinutes: number;
  projectType: string;
  isNewProject: boolean;
  hasExplicitRequirements: boolean;
};

const criterionOrder: RouteCriterion[] = [
  "requirements_fit",
  "familiarity",
  "time_fit",
  "switching_cost",
  "resources",
  "risk",
];

function cleanTools(value: string[]): string[] {
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))].slice(0, 6);
}

function textHas(value: string, candidate: string): boolean {
  const normalized = candidate.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  if (!normalized) return false;
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(normalized);
}

function scoreTime(input: RouteInput, minutes: number): number {
  const available = calculateAvailableMinutes(input.deadline, input.hoursPerDay, input.daysPerWeek);
  if (available <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 * Math.min(1, available / Math.max(1, minutes)))));
}

function makeEvidence(input: RouteInput, routeKind: "declared" | "prototype" | "switch", criterion: RouteCriterion): RouteEvidence[] {
  const vi = input.interfaceLanguage === "vi";
  const tools = input.tools.length > 0 ? input.tools.join(", ") : vi ? "chưa được cung cấp" : "not provided";
  const evidence: RouteEvidence[] = [];
  if (criterion === "requirements_fit") evidence.push({ source: "user_brief", statement: vi ? `Đề bài mô tả đầu ra ${input.projectType} và các yêu cầu cụ thể.` : `The brief describes a ${input.projectType} deliverable and concrete requirements.` });
  if (criterion === "familiarity") evidence.push({ source: "user_profile", statement: input.currentExperience.trim() ? (vi ? `Kinh nghiệm người dùng được ghi nhận: ${input.currentExperience.trim().slice(0, 260)}` : `Recorded user experience: ${input.currentExperience.trim().slice(0, 260)}`) : (vi ? "Chưa cung cấp kinh nghiệm; điểm này không được suy đoán." : "No experience was provided; this score is not inferred."), });
  if (criterion === "time_fit") evidence.push({ source: "deadline", statement: vi ? `Dùng deadline ${input.deadline}, ${input.hoursPerDay} giờ/ngày và ${input.daysPerWeek} ngày/tuần để tính sức chứa.` : `Capacity is calculated from the ${input.deadline} deadline, ${input.hoursPerDay} hours/day, and ${input.daysPerWeek} days/week.` });
  if (criterion === "switching_cost") evidence.push({ source: routeKind === "switch" ? "derived_constraint" : "existing_tools", statement: routeKind === "switch" ? (vi ? `Route này bỏ qua công cụ đã khai báo (${tools}), nên phát sinh chi phí chuyển đổi.` : `This route replaces the declared tools (${tools}), creating switching cost.`) : (vi ? `Route giữ các công cụ đã khai báo: ${tools}.` : `This route keeps the declared tools: ${tools}.`) });
  if (criterion === "resources") evidence.push({ source: input.tools.length > 0 ? "existing_tools" : "system_fallback", statement: input.tools.length > 0 ? (vi ? `Công cụ trong route lấy trực tiếp từ form: ${tools}; chưa tuyên bố có resource ngoài nếu chưa xác minh.` : `The route uses tools from the form: ${tools}; no external resource is claimed without verification.`) : (vi ? "Chưa có công cụ hoặc resource đã xác minh trong dữ liệu đầu vào." : "No declared tool or verified resource exists in the input."), });
  if (criterion === "risk") evidence.push({ source: input.isNewProject ? "user_brief" : "derived_constraint", statement: input.isNewProject ? (vi ? "Dự án mới cần chứng minh luồng rủi ro cao trước khi mở rộng." : "A new project should prove its riskiest path before expanding scope.") : (vi ? "Dự án hiện có cần giữ baseline và tránh thay đổi không liên quan." : "An existing project needs a baseline and protection from unrelated changes."), });
  return evidence;
}

function criteria(input: RouteInput, routeKind: "declared" | "prototype" | "switch", minutes: number): RouteCriterionScore[] {
  const vi = input.interfaceLanguage === "vi";
  const familiarity = input.currentExperience.trim()
    ? input.tools.length === 0 ? 50 : Math.round(50 + (input.tools.filter((tool) => textHas(input.currentExperience, tool)).length / input.tools.length) * 45)
    : 50;
  const values: Record<RouteCriterion, number> = {
    requirements_fit: routeKind === "switch" ? 55 : routeKind === "prototype" ? (input.hasExplicitRequirements ? 85 : 70) : input.hasExplicitRequirements ? 95 : 75,
    familiarity: routeKind === "switch" ? Math.max(20, familiarity - 30) : familiarity,
    time_fit: scoreTime(input, minutes),
    switching_cost: routeKind === "switch" ? 35 : 95,
    resources: input.tools.length > 0 ? routeKind === "switch" ? 40 : 70 : 50,
    risk: routeKind === "switch" ? 40 : routeKind === "prototype" ? (input.isNewProject ? 70 : 78) : input.isNewProject ? 70 : 78,
  };
  const rationales: Record<RouteCriterion, string> = {
    requirements_fit: routeKind === "switch" ? (vi ? "Route không giữ trọn công cụ hoặc yêu cầu đã nêu." : "The route does not preserve all declared tools or requirements.") : input.hasExplicitRequirements ? (vi ? "Giữ các yêu cầu rõ ràng trong đề bài." : "Preserves the explicit requirements in the brief.") : (vi ? "Một phần yêu cầu còn chưa rõ nên cần review." : "Some requirements remain unclear and need review."),
    familiarity: input.currentExperience.trim() ? (vi ? "Điểm chỉ dùng thông tin kinh nghiệm người dùng đã khai báo." : "Uses only the experience stated by the user.") : (vi ? "Không có dữ liệu kinh nghiệm để ưu tiên route." : "No experience data was provided to favour this route."),
    time_fit: vi ? "So sánh thời gian ước tính với sức chứa tính từ deadline và lịch làm việc." : "Compares the estimate with capacity calculated from the deadline and work schedule.",
    switching_cost: routeKind === "switch" ? (vi ? "Cần học và cấu hình lại công cụ ngoài form." : "Requires learning and configuring tools outside the form.") : (vi ? "Không yêu cầu đổi công cụ đã khai báo." : "Does not require changing declared tools."),
    resources: input.tools.length > 0 ? (vi ? "Điểm dựa trên công cụ đã khai báo; resource ngoài chỉ được tính nếu xác minh." : "Based on declared tools; external resources count only when verified.") : (vi ? "Thiếu dữ liệu resource đã xác minh nên dùng điểm trung lập." : "No verified resource data exists, so a neutral score is used."),
    risk: routeKind === "prototype" ? (vi ? "Luồng rủi ro được thử sớm và phần trau chuốt bị trì hoãn." : "The riskiest path is tested early and polish is deferred.") : routeKind === "switch" ? (vi ? "Đổi công cụ tạo thêm rủi ro tích hợp và học lại." : "Changing tools adds integration and relearning risk.") : (vi ? "Giữ scope và công cụ đã xác nhận, nhưng vẫn cần kiểm chứng luồng lõi." : "Keeps the confirmed scope and tools, while still proving the core path."),
  };
  return criterionOrder.map((criterion) => ({ criterion, score: values[criterion], weight: 1 / 6, rationale: rationales[criterion], evidence: makeEvidence(input, routeKind, criterion) }));
}

function candidate(input: RouteInput, id: string, routeKind: "declared" | "prototype" | "switch", title: string, summary: string, steps: string[], status: RouteCandidate["status"], rejectionReason?: string): RouteCandidate {
  const vi = input.interfaceLanguage === "vi";
  const scoreBreakdown = criteria(input, routeKind, routeKind === "prototype" ? Math.round(input.requiredMinutes * 0.9) : routeKind === "switch" ? Math.round(input.requiredMinutes * 1.35) : input.requiredMinutes);
  const score = Math.round(scoreBreakdown.reduce((total, item) => total + item.score * item.weight, 0));
  return {
    id, title, summary, toolSequence: cleanTools(routeKind === "switch" ? [vi ? "Công cụ thay thế chưa được cung cấp" : "Undeclared replacement tools"] : input.tools.length > 0 ? input.tools : [input.projectType]), steps, score, status, scoreBreakdown,
    strengths: routeKind === "prototype" ? [vi ? "Kiểm chứng rủi ro sớm." : "Proves risk early.", vi ? "Giữ công cụ đã khai báo." : "Keeps declared tools."] : routeKind === "switch" ? [vi ? "Có thể phù hợp nếu có lý do dự án cụ thể." : "Could fit if a project-specific reason exists."] : [vi ? "Bám sát yêu cầu đã ghi." : "Follows the recorded requirements.", vi ? "Giảm việc học lại công cụ." : "Reduces relearning tools."],
    tradeoffs: routeKind === "prototype" ? [vi ? "Một số phần hoàn thiện bị lùi lại." : "Some polish is deferred."] : routeKind === "switch" ? [vi ? "Phát sinh chi phí chuyển đổi và rủi ro tích hợp." : "Adds switching cost and integration risk."] : [vi ? "Cần review luồng lõi trước khi mở rộng." : "Needs core-path review before expansion."],
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}

function buildEvaluation(input: RouteInput, candidates: RouteCandidate[], vi: boolean) {
  const ordered = [...candidates].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const recommended = ordered.find((item) => item.status !== "rejected") ?? ordered[0];
  const routes = candidates.map((item) => item.id === recommended.id ? { ...item, status: "recommended" as const } : item);
  return RouteEvaluationSchema.parse({ modelVersion: 1, recommendedRouteId: recommended.id, explanation: vi ? `Route được chọn đạt ${recommended.score}/100 theo cùng sáu tiêu chí. Điểm và evidence dưới đây được tính từ đề bài, kinh nghiệm, thời gian, công cụ đã khai báo và các giới hạn đã biết.` : `The selected route scores ${recommended.score}/100 using the same six criteria. The score and evidence below come from the brief, experience, time, declared tools, and known constraints.`, routes });
}

export function createEngineeringRouteEvaluation(project: EngineeringProject, interpretation: EngineeringInterpretation, requiredMinutes: number) {
  const vi = project.interfaceLanguage === "vi";
  const tools = interpretation.suggestedTechnologyStack.length > 0 ? interpretation.suggestedTechnologyStack : project.technologies?.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) ?? [];
  const input: RouteInput = { interfaceLanguage: project.interfaceLanguage, projectBrief: project.technicalBrief, currentExperience: project.currentExperience, deadline: project.deadline, hoursPerDay: project.hoursPerDay, daysPerWeek: project.daysPerWeek, tools, requiredMinutes, projectType: interpretation.productType, isNewProject: project.startingPoint === "new_project", hasExplicitRequirements: project.definitionOfDone.trim().length > 20 };
  const candidates = [
    candidate(input, "declared-stack", "declared", vi ? "Giữ stack đã khai báo" : "Keep the declared stack", vi ? "Triển khai theo đúng nền tảng và công nghệ người dùng đã ghi, với kiểm chứng luồng rủi ro sớm." : "Build with the platform and technologies recorded by the user, proving the riskiest path early.", [vi ? "Kiểm tra hoặc khởi tạo workspace" : "Inspect or initialize the workspace", vi ? "Chứng minh luồng cốt lõi" : "Prove the core path", vi ? "Triển khai yêu cầu theo phụ thuộc" : "Implement requirements in dependency order", vi ? "Kiểm tra và bàn giao" : "Verify and deliver"], "recommended"),
    candidate(input, "prototype-first", "prototype", vi ? "Prototype trước, hoàn thiện sau" : "Prototype first, polish later", vi ? "Tạo bản dọc nhỏ nhất để giảm rủi ro trước khi triển khai toàn bộ yêu cầu." : "Create the smallest vertical slice to reduce risk before implementing the full requirements.", [vi ? "Chọn luồng rủi ro cao nhất" : "Select the riskiest path", vi ? "Tạo prototype có thể kiểm tra" : "Create a testable prototype", vi ? "Mở rộng theo tiêu chí chấp nhận" : "Expand against acceptance criteria", vi ? "Kiểm tra và bàn giao" : "Verify and deliver"], "alternative"),
  ];
  if (tools.length > 0) candidates.push(candidate(input, "switch-stack", "switch", vi ? "Đổi sang stack chưa khai báo" : "Switch to an undeclared stack", vi ? "Route này được xem xét nhưng không có lý do dự án cụ thể để bỏ công nghệ đã khai báo." : "Considered, but no project-specific reason is provided to leave the declared technologies.", [vi ? "Chọn công cụ thay thế" : "Choose replacement tools", vi ? "Tái tạo workspace và hợp đồng" : "Recreate the workspace and contract", vi ? "Triển khai lại luồng cốt lõi" : "Rebuild the core path"], "rejected", vi ? "Đề bài đã khai báo công nghệ và chưa đưa ra lợi thế cụ thể của việc chuyển đổi." : "The brief declares technologies and gives no specific advantage for switching."));
  return buildEvaluation(input, candidates, vi);
}

export function createDesignRouteEvaluation(project: RoadmapRequest, requiredMinutes: number) {
  const vi = project.interfaceLanguage === "vi";
  const tools = project.requiredApplications;
  const input: RouteInput = { interfaceLanguage: project.interfaceLanguage, projectBrief: project.projectBrief, currentExperience: project.currentExperience, deadline: project.deadline, hoursPerDay: project.hoursPerDay, daysPerWeek: project.daysPerWeek, tools, requiredMinutes, projectType: project.outputType, isNewProject: true, hasExplicitRequirements: project.projectBrief.trim().length > 30 };
  const candidates = [
    candidate(input, "confirmed-tools", "declared", vi ? "Giữ công cụ đã xác nhận" : "Keep the confirmed tools", vi ? "Giữ các ứng dụng đã được yêu cầu và học đúng phần cần dùng cho đầu ra." : "Keep the required applications and learn only what supports the deliverable.", [vi ? "Chốt phạm vi đầu ra" : "Define the deliverable", vi ? "Làm bản đầu tiên" : "Create the first complete pass", vi ? "Rà soát và xuất bản" : "Review and export"], "recommended"),
    candidate(input, "core-output-first", "prototype", vi ? "Làm đầu ra cốt lõi trước" : "Core output first", vi ? "Ưu tiên bản có thể xem được trước, sau đó mới thêm phần trau chuốt không bắt buộc." : "Prioritise a reviewable core output before optional polish.", [vi ? "Tạo bản cốt lõi" : "Create the core pass", vi ? "Đối chiếu tiêu chí bắt buộc" : "Check required criteria", vi ? "Thêm trau chuốt còn lại" : "Add remaining polish"], "alternative"),
  ];
  if (tools.length > 0) candidates.push(candidate(input, "unconfirmed-tool-switch", "switch", vi ? "Đổi sang ứng dụng chưa xác nhận" : "Switch to an unconfirmed application", vi ? "Được xem xét nhưng không có bằng chứng dự án cụ thể để đổi công cụ." : "Considered, but there is no project-specific evidence for changing tools.", [vi ? "Tìm ứng dụng thay thế" : "Find a replacement application", vi ? "Học lại quy trình" : "Relearn the workflow", vi ? "Tái tạo đầu ra" : "Recreate the output"], "rejected", vi ? "Không có lý do cụ thể hoặc bằng chứng về lợi thế của việc đổi ứng dụng." : "No specific reason or evidence establishes an advantage for switching applications."));
  return buildEvaluation(input, candidates, vi);
}
