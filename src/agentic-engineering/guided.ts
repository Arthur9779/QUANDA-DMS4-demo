import { createHash } from "node:crypto";
import {
  EngineeringGuidedPlanSchema,
  type EngineeringGuidedPlan,
  type EngineeringInterpretation,
  type EngineeringProject,
} from "@/src/project-path/contracts";

function resources(vi: boolean) {
  return [
    {
      label: vi ? "Tổng quan về Codex" : "Codex overview",
      url: "https://developers.openai.com/codex",
      reason: vi ? "Hiểu coding agent làm việc trong repository như thế nào và khi nào vẫn cần con người giám sát." : "Understand how a coding agent works across a repository and where human supervision remains necessary.",
    },
    {
      label: vi ? "Review pull request trên GitHub" : "Review a GitHub pull request",
      url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request",
      reason: vi ? "Dùng một vòng review cụ thể để kiểm tra diff của agent trước khi merge." : "Use a concrete review loop for inspecting the agent's diff before merging.",
    },
  ];
}

export function generateEngineeringGuidedPlan(
  project: EngineeringProject,
  interpretation: EngineeringInterpretation,
): EngineeringGuidedPlan {
  const id = createHash("sha256").update(JSON.stringify({ project, interpretation, method: "guided_tutorials" })).digest("hex").slice(0, 12);
  const vi = project.interfaceLanguage === "vi";
  const resourceList = resources(vi);
  const tools = project.technologies?.trim() || interpretation.suggestedTechnologyStack.join(", ") || (vi ? "chưa chốt công cụ" : "the selected project tools");
  const experience = project.currentExperience.trim();
  const schedule = vi
    ? `${project.hoursPerDay} giờ/ngày trong ${project.daysPerWeek} ngày/tuần, trước ${project.deadline}`
    : `${project.hoursPerDay} hours/day across ${project.daysPerWeek} days/week, before ${project.deadline}`;
  const constraints = project.constraints?.trim() || (vi ? "Không có giới hạn bổ sung được nêu." : "No additional constraints were provided.");
  return EngineeringGuidedPlanSchema.parse({
    path: "agentic_engineering",
    method: "guided_tutorials",
    id: `engineering-guided-${id}`,
    language: project.interfaceLanguage,
    title: vi ? "Chuẩn bị xây dựng theo hướng dẫn" : "Prepare with guided supervision",
    summary: vi
      ? `Bốn bước tập trung cho ${interpretation.productType}, dùng ${tools}, phù hợp với ${schedule}. Kinh nghiệm hiện tại: ${experience}. Đây không phải khóa học lập trình tổng quát.`
      : `Four focused steps for this ${interpretation.productType}, using ${tools}, within ${schedule}. Current experience: ${experience}. This is not a general programming course.`,
    steps: [
      {
        id: "understand-repository",
        title: vi ? "Đọc cấu trúc repository trước khi giao việc" : "Understand the repository before delegating work",
        outcome: vi ? `Bạn xác định được entry point, script và quy ước của ${interpretation.repositoryContext}, rồi đối chiếu với công cụ ${tools}.` : `You can identify the entry points, scripts, and conventions in ${interpretation.repositoryContext}, then relate them to the selected tools: ${tools}.`,
        whyItMatters: vi ? "Agent chỉ an toàn khi làm việc trên đúng repository và đúng quy ước hiện có." : "An agent is safer when it works in the intended repository and follows its existing conventions.",
        checks: vi ? [`Ghi lại package manager và lệnh test/build phù hợp với ${tools}.`, "Xác nhận repository hoặc thư mục làm việc là đúng.", `Đối chiếu các bước đầu với kinh nghiệm hiện tại: ${experience}.`] : [`Record the package manager and test/build commands relevant to ${tools}.`, "Confirm the repository or workspace is the intended one.", `Keep the first handoff appropriate for your current experience: ${experience}.`],
        resources: resourceList,
      },
      {
        id: "review-diffs",
        title: vi ? "Đọc diff và pull request của agent" : "Review the agent's diff and pull request",
        outcome: vi ? "Bạn có thể đối chiếu thay đổi với definition of done trước khi chấp nhận." : "You can compare the proposed changes with the definition of done before accepting them.",
        whyItMatters: vi ? "Agent có thể hoàn thành code nhưng không tự quyết định thay đổi có đúng ý bạn hay không." : "An agent can produce code, but it cannot decide whether a change matches your intent without your review.",
        checks: vi ? ["Kiểm tra file thay đổi có nằm trong phạm vi không.", "Đọc test và phần xử lý lỗi cùng với diff."] : ["Check that changed files stay within scope.", "Read the tests and failure handling alongside the diff."],
        resources: [resourceList[1]],
      },
      {
        id: "run-verification",
        title: vi ? "Chạy kiểm tra và diễn giải lỗi" : "Run verification and interpret failures",
        outcome: vi ? `Bạn xác minh được các tiêu chí quan trọng cho ${interpretation.productType} và biết khi nào cần quay lại agent.` : `You can verify the important checks for the ${interpretation.productType} and know when to send a failure back to the agent.`,
        whyItMatters: vi ? "Kết quả chỉ đáng tin khi có lệnh kiểm tra hoặc review rõ ràng, không chỉ dựa vào lời agent." : "A result is trustworthy only when it has explicit checks or human review, not just an agent's claim.",
        checks: vi ? [`Chạy test, type-check, lint hoặc build phù hợp trong quỹ ${schedule}.`, "Ghi riêng lỗi nền có sẵn và lỗi mới phát sinh.", `Không để các giới hạn ngoài phạm vi bị bỏ qua: ${constraints}`] : [`Run the applicable tests, type-check, lint, or build within ${schedule}.`, "Separate baseline failures from regressions introduced by the change.", `Keep the project constraints visible: ${constraints}`],
        resources: [],
      },
      {
        id: "review-delivery",
        title: vi ? "Kiểm tra preview và bàn giao" : "Review the preview and hand off",
        outcome: vi ? `Bạn tự chấp nhận hoặc từ chối sản phẩm dựa trên definition of done, mục tiêu ${project.deploymentTarget || "bàn giao đã chọn"} và hạn ${project.deadline}.` : `You accept or reject the deliverable against the definition of done, the ${project.deploymentTarget || "selected handoff target"}, and the ${project.deadline} deadline.`,
        whyItMatters: vi ? "Preview, quyền truy cập và quyết định bàn giao là trách nhiệm của con người." : "Preview behaviour, access decisions, and final acceptance remain human responsibilities.",
        checks: vi ? [`Mở preview hoặc artifact trên thiết bị mục tiêu ${project.targetPlatform}.`, `Đánh dấu từng tiêu chí hoàn thành trước ${project.deadline} và ghi limitation còn lại.`, `Xác nhận các giới hạn: ${constraints}`] : [`Open the preview or artifact on the ${project.targetPlatform} target.`, `Check each acceptance criterion before ${project.deadline} and record remaining limitations.`, `Confirm the stated constraints: ${constraints}`],
        resources: [],
      },
    ],
  });
}
