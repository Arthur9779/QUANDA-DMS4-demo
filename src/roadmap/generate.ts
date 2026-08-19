import { getApplicationName } from "@/src/data/applications";
import {
  calculateAvailableMinutes,
  getDaysRemaining,
  getFeasibilityMessage,
  getFeasibilityStatus,
} from "@/src/lib/feasibility";
import type { RoadmapResponse, RoadmapStage } from "@/src/types";
import type { RoadmapGenerationInput } from "./contracts";
import { ROADMAP_GENERATOR_VERSION } from "./contracts";

function copy(input: RoadmapGenerationInput, en: string, vi: string) {
  return input.projectInput.interfaceLanguage === "vi" ? vi : en;
}

function activeGaps(input: RoadmapGenerationInput) {
  return input.skillGaps.filter((gap) =>
    ["needs_learning", "partial"].includes(gap.status),
  );
}

function selectedForSkill(input: RoadmapGenerationInput, skillId: string) {
  const needIds = new Set(
    input.tutorialNeeds
      .filter((need) => need.skillIds.includes(skillId) && need.status === "active")
      .map((need) => need.id),
  );
  return input.selectedTutorials.find((tutorial) => needIds.has(tutorial.needId));
}

function creativeDirection(input: RoadmapGenerationInput): string {
  const labels = [
    ...input.creativeDna.concepts
      .filter((concept) => concept.status === "user_confirmed")
      .map((concept) => concept.label),
    ...input.creativeDna.unknownConcepts
      .filter((concept) => concept.status === "user_confirmed")
      .map((concept) => concept.raw),
  ];
  return labels.slice(0, 5).join(", ");
}

function makeStage(
  base: Omit<RoadmapStage, "order" | "dependsOnStageIds">,
  order: number,
  dependsOnStageIds: string[] = [],
): RoadmapStage {
  return { ...base, order, dependsOnStageIds };
}

/** Deterministic fallback: production work is planned even when Gemini is unavailable. */
export function createIntegratedFallback(input: RoadmapGenerationInput): RoadmapResponse {
  const project = input.projectInput;
  const appIds = project.requiredApplications;
  const primaryApplication = appIds[0] ?? null;
  const direction = creativeDirection(input);
  const locale = project.interfaceLanguage;
  const isProductAnimationExample = /20[- ]second product animation|hoạt hình sản phẩm.*20 giây/i.test(project.projectBrief);
  const stages: RoadmapStage[] = [];
  const add = (stage: Omit<RoadmapStage, "order" | "dependsOnStageIds">) => {
    stages.push(makeStage(stage, stages.length + 1, stages.length ? [stages.at(-1)!.id] : []));
  };

  add({
    id: "brief",
    title: copy(input, "Define the production scope", "Chốt phạm vi sản xuất"),
    goal: copy(input, "Turn the brief into a delivery checklist and a workable project file.", "Chuyển đề bài thành danh sách bàn giao và tệp dự án có thể làm việc."),
    why: direction
      ? copy(input, `Protect the confirmed direction: ${direction}.`, `Giữ đúng định hướng đã xác nhận: ${direction}.`)
      : copy(input, "A clear scope protects the required deliverable.", "Phạm vi rõ ràng bảo vệ yêu cầu bàn giao."),
    applicationId: primaryApplication,
    skillToLearn: copy(input, "Project setup and requirements", "Thiết lập dự án và yêu cầu"),
    tasks: [
      copy(input, "List the required output and submission criteria", "Liệt kê đầu ra và tiêu chí nộp bắt buộc"),
      copy(input, "Create a named, backed-up working file", "Tạo tệp làm việc có tên rõ ràng và sao lưu"),
    ],
    productionTasks: [
      copy(input, "Create the project structure", "Tạo cấu trúc dự án"),
      copy(input, "Record non-negotiable requirements", "Ghi lại các yêu cầu không thể thay đổi"),
    ],
    learningTasks: [],
    definitionOfDone: [copy(input, "The delivery checklist and working file are ready.", "Danh sách bàn giao và tệp làm việc đã sẵn sàng.")],
    classification: "required",
    creativeDnaIds: [],
    skillIds: [],
    learningMinutes: 15,
    productionMinutes: 30,
    tutorialIds: [],
  });

  add({
    id: "build-core-output",
    title: copy(input, "Build the core project output", "Tạo phần cốt lõi của sản phẩm"),
    goal: copy(input, "Produce a complete, reviewable first pass of the required deliverable.", "Tạo bản đầu tiên hoàn chỉnh, có thể xem xét của sản phẩm bắt buộc."),
    why: copy(input, "A complete first pass exposes missing work before polish.", "Bản đầu tiên hoàn chỉnh cho thấy phần còn thiếu trước khi trau chuốt."),
    applicationId: primaryApplication,
    skillToLearn: copy(input, "Core production workflow", "Quy trình sản xuất cốt lõi"),
    tasks: [
      copy(input, "Make the highest-priority output first", "Làm phần đầu ra ưu tiên cao nhất trước"),
      copy(input, "Keep source work editable for review", "Giữ tệp nguồn có thể chỉnh sửa để xem xét"),
    ],
    productionTasks: [
      copy(input, "Create the first complete pass", "Tạo bản đầu tiên hoàn chỉnh"),
      copy(input, "Check it against the project brief", "Đối chiếu với đề bài"),
    ],
    learningTasks: [],
    definitionOfDone: [copy(input, "A reviewer can see the intended deliverable end to end.", "Người xem có thể xem sản phẩm dự định từ đầu đến cuối.")],
    classification: "required",
    creativeDnaIds: input.creativeDna.concepts.filter((item) => item.status === "user_confirmed").map((item) => item.ontologyId).filter((id): id is string => Boolean(id)),
    skillIds: [],
    learningMinutes: 1,
    productionMinutes: 90,
    tutorialIds: [],
  });

  for (const gap of activeGaps(input).slice(0, 4)) {
    const tutorial = selectedForSkill(input, gap.skillId);
    add({
      id: `apply-${gap.id}`.slice(0, 80),
      title: copy(input, `Apply ${gap.label}`, `Áp dụng ${gap.label}`),
      goal: copy(input, `Use ${gap.label} to move the required project forward.`, `Dùng ${gap.label} để đưa dự án bắt buộc tiến lên.`),
      why: gap.reason,
      applicationId: gap.softwareIds.find((id) => appIds.includes(id)) ?? primaryApplication,
      skillToLearn: gap.label,
      tasks: [
        copy(input, `Learn only the ${gap.label} technique needed for this stage`, `Chỉ học kỹ thuật ${gap.label} cần cho giai đoạn này`),
        copy(input, "Apply it directly to the project output", "Áp dụng trực tiếp vào sản phẩm dự án"),
      ],
      productionTasks: [copy(input, `Apply ${gap.label} in the project file`, `Áp dụng ${gap.label} trong tệp dự án`)],
      learningTasks: tutorial ? [tutorial.tutorial.title] : [gap.label],
      definitionOfDone: [copy(input, `${gap.label} is visible in the project output and checked against the brief.`, `${gap.label} xuất hiện trong sản phẩm và đã được đối chiếu với đề bài.`)],
      classification: gap.priority,
      creativeDnaIds: gap.relatedTechniqueIds,
      skillIds: [gap.skillId],
      learningMinutes: gap.estimatedLearningMinutes ?? 10,
      productionMinutes: gap.priority === "required" ? 45 : 30,
      tutorialIds: tutorial ? [tutorial.tutorial.id] : [],
    });
  }

  for (const applicationId of appIds.slice(1, 3)) {
    add({
      id: `handoff-${applicationId}`.replace(/[^a-z0-9-]/gi, "-").slice(0, 80),
      title: copy(input, `Hand off work to ${getApplicationName(applicationId)}`, `Chuyển giao công việc sang ${getApplicationName(applicationId)}`),
      goal: copy(input, `Prepare compatible work for ${getApplicationName(applicationId)} without losing the required output.`, `Chuẩn bị công việc tương thích cho ${getApplicationName(applicationId)} mà không mất đầu ra bắt buộc.`),
      why: copy(input, "The explicit application requirement is kept in the production flow.", "Yêu cầu ứng dụng rõ ràng được giữ trong quy trình sản xuất."),
      applicationId,
      skillToLearn: copy(input, "File handoff and compatibility", "Bàn giao tệp và khả năng tương thích"),
      tasks: [copy(input, "Export a compatible intermediate file", "Xuất tệp trung gian tương thích"), copy(input, "Open and verify the handoff", "Mở và kiểm tra tệp bàn giao")],
      productionTasks: [copy(input, "Move the approved work into the next application", "Chuyển phần đã duyệt sang ứng dụng kế tiếp")],
      learningTasks: [],
      definitionOfDone: [copy(input, "The handoff opens correctly and remains editable.", "Tệp bàn giao mở đúng và vẫn có thể chỉnh sửa.")],
      classification: "required",
      creativeDnaIds: [],
      skillIds: [],
      learningMinutes: 1,
      productionMinutes: 25,
      tutorialIds: [],
    });
  }

  add({
    id: "review-and-refine",
    title: copy(input, "Review and refine the result", "Rà soát và tinh chỉnh sản phẩm"),
    goal: copy(input, "Use focused feedback to improve the parts that affect the required criteria most.", "Dùng phản hồi có trọng tâm để cải thiện những phần ảnh hưởng nhiều nhất đến tiêu chí bắt buộc."),
    why: copy(input, "A short review protects quality without turning the plan into optional polish.", "Một lượt rà soát ngắn bảo vệ chất lượng mà không biến kế hoạch thành phần trau chuốt tùy chọn."),
    applicationId: primaryApplication,
    skillToLearn: copy(input, "Project quality review", "Rà soát chất lượng dự án"),
    tasks: [copy(input, "Compare the result with the brief", "Đối chiếu sản phẩm với đề bài"), copy(input, "Fix the highest-impact issue", "Sửa vấn đề có tác động lớn nhất")],
    productionTasks: [copy(input, "Run a focused review pass", "Thực hiện một lượt rà soát có trọng tâm")],
    learningTasks: [],
    definitionOfDone: [copy(input, "The highest-impact issue is fixed and the required criteria remain visible.", "Vấn đề có tác động lớn nhất đã được sửa và các tiêu chí bắt buộc vẫn rõ ràng.")],
    classification: "useful",
    creativeDnaIds: [],
    skillIds: [],
    learningMinutes: 1,
    productionMinutes: 25,
    tutorialIds: [],
  });

  add({
    id: "presentation-and-backup",
    title: copy(input, "Prepare presentation and backup", "Chuẩn bị trình bày và sao lưu"),
    goal: copy(input, "Make the result easy to review and recover before delivery.", "Làm sản phẩm dễ xem xét và có thể khôi phục trước khi bàn giao."),
    why: copy(input, "A clear presentation and backup prevent avoidable delivery failures.", "Trình bày rõ ràng và sao lưu giúp tránh lỗi bàn giao có thể phòng ngừa."),
    applicationId: primaryApplication,
    skillToLearn: copy(input, "Presentation and project backup", "Trình bày và sao lưu dự án"),
    tasks: [copy(input, "Prepare the review version", "Chuẩn bị phiên bản để xem xét"), copy(input, "Save a dated backup copy", "Lưu một bản sao lưu có ngày tháng")],
    productionTasks: [copy(input, "Package the review-ready files", "Đóng gói các tệp sẵn sàng để xem xét")],
    learningTasks: [],
    definitionOfDone: [copy(input, "The review version and a recoverable backup are both available.", "Phiên bản xem xét và bản sao lưu có thể khôi phục đều đã sẵn sàng.")],
    classification: "useful",
    creativeDnaIds: [],
    skillIds: [],
    learningMinutes: 1,
    productionMinutes: 20,
    tutorialIds: [],
  });

  add({
    id: "quality-and-delivery",
    title: copy(input, "Quality-check and deliver", "Kiểm tra chất lượng và bàn giao"),
    goal: copy(input, "Verify the final output, export the required format, and retain a backup.", "Kiểm tra đầu ra cuối, xuất đúng định dạng yêu cầu và giữ bản sao lưu."),
    why: copy(input, "Technical delivery mistakes are easiest to fix before submission.", "Lỗi bàn giao kỹ thuật dễ sửa nhất trước khi nộp."),
    applicationId: appIds.at(-1) ?? primaryApplication,
    skillToLearn: copy(input, "Export and quality assurance", "Xuất tệp và đảm bảo chất lượng"),
    tasks: [copy(input, "Check every required criterion", "Kiểm tra từng tiêu chí bắt buộc"), copy(input, "Export and open the final file", "Xuất và mở tệp cuối")],
    productionTasks: [copy(input, "Run final QA", "Kiểm tra chất lượng cuối"), copy(input, "Export the required deliverable", "Xuất đúng đầu ra yêu cầu")],
    learningTasks: [],
    definitionOfDone: [copy(input, "The output opens correctly and meets the stated delivery requirements.", "Đầu ra mở đúng và đáp ứng các yêu cầu bàn giao đã nêu.")],
    classification: "required",
    creativeDnaIds: [],
    skillIds: [],
    learningMinutes: 10,
    productionMinutes: 35,
    tutorialIds: [],
  });

  const totalEstimatedMinutes = stages.reduce((sum, stage) => sum + stage.learningMinutes + stage.productionMinutes, 0);
  const availableMinutes = calculateAvailableMinutes(project.deadline, project.hoursPerDay, project.daysPerWeek);
  const feasibility = getFeasibilityStatus(totalEstimatedMinutes, availableMinutes);
  const excess = Math.max(0, totalEstimatedMinutes - availableMinutes);
  return {
    id: `roadmap-${input.inputFingerprint}`,
    language: locale,
    title: isProductAnimationExample
      ? copy(input, "20-second product animation roadmap", "Lộ trình làm hoạt hình sản phẩm 20 giây")
      : copy(input, "Project-oriented production roadmap", "Lộ trình sản xuất theo dự án"),
    summary: direction
      ? copy(input, `A production plan shaped by the confirmed direction: ${direction}.`, `Kế hoạch sản xuất theo định hướng đã xác nhận: ${direction}.`)
      : copy(input, "A production plan that embeds learning immediately before the work that needs it.", "Kế hoạch sản xuất lồng ghép việc học ngay trước phần việc cần dùng."),
    feasibility: {
      status: feasibility,
      message: getFeasibilityMessage(feasibility, locale),
      daysRemaining: getDaysRemaining(project.deadline),
      availableMinutes,
      estimatedRequiredMinutes: totalEstimatedMinutes,
    },
    totalEstimatedMinutes,
    assumptions: [copy(input, "Learning estimates cover only the selected skill gaps.", "Ước tính học chỉ bao gồm các khoảng thiếu kỹ năng đã chọn.")],
    warnings: excess > 0
      ? [copy(input, `This plan exceeds the available time by approximately ${Math.ceil(excess / 60)} hours. Reduce optional polish before changing required criteria.`, `Kế hoạch này vượt thời gian hiện có khoảng ${Math.ceil(excess / 60)} giờ. Hãy giảm phần trau chuốt tùy chọn trước khi thay đổi tiêu chí bắt buộc.`)]
      : [],
    stages,
    schedule: stages.map((stage, index) => ({
      label: copy(input, `Work block ${index + 1}`, `Buổi làm việc ${index + 1}`),
      stageIds: [stage.id],
      plannedMinutes: stage.learningMinutes + stage.productionMinutes,
      priority: stage.classification === "required" ? "high" : stage.classification === "useful" ? "medium" : "low",
    })),
    source: "fallback",
    notice: copy(input, "QUANDA created this project-aware plan from your confirmed direction, skill gaps, and selected tutorials.", "QUANDA đã tạo kế hoạch theo dự án từ định hướng đã xác nhận, khoảng thiếu kỹ năng và tutorial đã chọn."),
    roadmapGeneratorVersion: ROADMAP_GENERATOR_VERSION,
    inputFingerprint: input.inputFingerprint,
  };
}

export function validateRoadmapForInput(roadmap: RoadmapResponse, input: RoadmapGenerationInput): string[] {
  const errors: string[] = [];
  const selectedTutorialIds = new Set(input.selectedTutorials.map((item) => item.tutorial.id));
  const knownSkillIds = new Set(input.skillGaps.filter((gap) => gap.status === "known").map((gap) => gap.skillId));
  const rejectedConceptIds = new Set(input.creativeDna.concepts.filter((concept) => concept.status === "user_rejected").map((concept) => concept.ontologyId).filter((id): id is string => Boolean(id)));
  const allowedApplications = new Set(input.projectInput.requiredApplications);
  const requiredGaps = input.skillGaps.filter((gap) => gap.status === "needs_learning" && gap.priority === "required");
  const coveredSkills = new Set(roadmap.stages.flatMap((stage) => stage.skillIds ?? []));

  for (const stage of roadmap.stages) {
    for (const tutorialId of stage.tutorialIds) if (!selectedTutorialIds.has(tutorialId)) errors.push(`Tutorial ${tutorialId} was not selected by the tutorial matcher.`);
    for (const skillId of stage.skillIds ?? []) if (knownSkillIds.has(skillId)) errors.push(`Known skill ${skillId} was unnecessarily added.`);
    for (const conceptId of stage.creativeDnaIds ?? []) if (rejectedConceptIds.has(conceptId)) errors.push(`Rejected creative concept ${conceptId} was restored.`);
    if (allowedApplications.size > 0 && stage.applicationId && !allowedApplications.has(stage.applicationId)) errors.push(`Application ${stage.applicationId} is not an explicit requirement.`);
    if ((stage.productionTasks?.length ?? 0) === 0 || (stage.definitionOfDone?.length ?? 0) === 0) errors.push(`Stage ${stage.id} is missing production work or a definition of done.`);
  }
  for (const gap of requiredGaps) if (!coveredSkills.has(gap.skillId)) errors.push(`Required skill gap ${gap.skillId} has no learning support.`);
  for (const applicationId of allowedApplications) if (!roadmap.stages.some((stage) => stage.applicationId === applicationId)) errors.push(`Required application ${applicationId} is missing from the roadmap.`);
  return errors;
}
