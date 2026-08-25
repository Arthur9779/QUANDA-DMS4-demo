import { createHash } from "node:crypto";
import {
  EngineeringGuidedPlanSchema,
  type EngineeringGuidedPlan,
  type EngineeringInterpretation,
  type EngineeringProject,
} from "@/src/project-path/contracts";

const resources = [
  {
    label: "Codex overview",
    url: "https://developers.openai.com/codex",
    reason: "Understand how a coding agent works across a repository and where human supervision remains necessary.",
  },
  {
    label: "Review a GitHub pull request",
    url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request",
    reason: "Use a concrete review loop for inspecting the agent's diff before merging.",
  },
];

export function generateEngineeringGuidedPlan(
  project: EngineeringProject,
  interpretation: EngineeringInterpretation,
): EngineeringGuidedPlan {
  const id = createHash("sha256").update(JSON.stringify({ project, interpretation, method: "guided_tutorials" })).digest("hex").slice(0, 12);
  const vi = project.interfaceLanguage === "vi";
  return EngineeringGuidedPlanSchema.parse({
    path: "agentic_engineering",
    method: "guided_tutorials",
    id: `engineering-guided-${id}`,
    language: project.interfaceLanguage,
    title: vi ? "Chuẩn bị xây dựng theo hướng dẫn" : "Prepare with guided supervision",
    summary: vi
      ? "Một chuỗi hướng dẫn ngắn để bạn đọc cấu trúc dự án, theo dõi thay đổi của agent và tự kiểm tra kết quả. Đây không phải khóa học lập trình tổng quát."
      : "A short set of supervision guides for understanding the project, reviewing agent changes, and checking the result. This is not a general programming course.",
    steps: [
      {
        id: "understand-repository",
        title: vi ? "Đọc cấu trúc repository trước khi giao việc" : "Understand the repository before delegating work",
        outcome: vi ? `Bạn xác định được entry point, script và quy ước của ${interpretation.repositoryContext}.` : `You can identify the entry points, scripts, and conventions in ${interpretation.repositoryContext}.`,
        whyItMatters: vi ? "Agent chỉ an toàn khi làm việc trên đúng repository và đúng quy ước hiện có." : "An agent is safer when it works in the intended repository and follows its existing conventions.",
        checks: vi ? ["Ghi lại package manager và lệnh test/build hiện có.", "Xác nhận repository hoặc thư mục làm việc là đúng."] : ["Record the package manager and available test/build commands.", "Confirm the repository or workspace is the intended one."],
        resources,
      },
      {
        id: "review-diffs",
        title: vi ? "Đọc diff và pull request của agent" : "Review the agent's diff and pull request",
        outcome: vi ? "Bạn có thể đối chiếu thay đổi với definition of done trước khi chấp nhận." : "You can compare the proposed changes with the definition of done before accepting them.",
        whyItMatters: vi ? "Agent có thể hoàn thành code nhưng không tự quyết định thay đổi có đúng ý bạn hay không." : "An agent can produce code, but it cannot decide whether a change matches your intent without your review.",
        checks: vi ? ["Kiểm tra file thay đổi có nằm trong phạm vi không.", "Đọc test và phần xử lý lỗi cùng với diff."] : ["Check that changed files stay within scope.", "Read the tests and failure handling alongside the diff."],
        resources: [resources[1]],
      },
      {
        id: "run-verification",
        title: vi ? "Chạy kiểm tra và diễn giải lỗi" : "Run verification and interpret failures",
        outcome: vi ? `Bạn xác minh được các tiêu chí quan trọng cho ${interpretation.productType} và biết khi nào cần quay lại agent.` : `You can verify the important checks for the ${interpretation.productType} and know when to send a failure back to the agent.`,
        whyItMatters: vi ? "Kết quả chỉ đáng tin khi có lệnh kiểm tra hoặc review rõ ràng, không chỉ dựa vào lời agent." : "A result is trustworthy only when it has explicit checks or human review, not just an agent's claim.",
        checks: vi ? ["Chạy test, type-check, lint hoặc build phù hợp.", "Ghi riêng lỗi nền có sẵn và lỗi mới phát sinh."] : ["Run the applicable tests, type-check, lint, or build.", "Separate baseline failures from regressions introduced by the change."],
        resources: [],
      },
      {
        id: "review-delivery",
        title: vi ? "Kiểm tra preview và bàn giao" : "Review the preview and hand off",
        outcome: vi ? "Bạn tự chấp nhận hoặc từ chối sản phẩm dựa trên definition of done." : "You accept or reject the deliverable against the definition of done.",
        whyItMatters: vi ? "Preview, quyền truy cập và quyết định bàn giao là trách nhiệm của con người." : "Preview behaviour, access decisions, and final acceptance remain human responsibilities.",
        checks: vi ? ["Mở preview hoặc artifact trên thiết bị mục tiêu.", "Đánh dấu từng tiêu chí hoàn thành và ghi limitation còn lại."] : ["Open the preview or artifact on the target device.", "Check each acceptance criterion and record remaining limitations."],
        resources: [],
      },
    ],
  });
}
