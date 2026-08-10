import { describe, expect, it } from "vitest";
import { createCustomApplicationId } from "@/src/data/applications";
import { createQuandaGuide } from "@/src/lib/quandaGuide";
import { resolveTutorialRecommendations } from "@/src/lib/tutorialMatcher";
import type { Locale, RoadmapRequest, RoadmapStage } from "@/src/types";

function requestFor(
  applicationName: string,
  locale: Locale,
  currentExperience: string,
): RoadmapRequest {
  return {
    interfaceLanguage: locale,
    projectBrief:
      locale === "vi"
        ? `Tôi cần hoàn thành dự án bằng ${applicationName} và kiểm tra đầu ra trước khi nộp.`
        : `I need to complete a project in ${applicationName} and verify the output before submission.`,
    deadline: "2026-12-20",
    currentExperience,
    hoursPerDay: 2,
    daysPerWeek: 5,
    tutorialLanguage: locale,
    requiredApplications: [createCustomApplicationId(applicationName)],
    outputType: "other",
    targetQuality: "basic",
  };
}

function stageFor(
  applicationName: string,
  values: Partial<RoadmapStage>,
): RoadmapStage {
  return {
    id: "custom-stage",
    order: 1,
    title: "Implement the authentication flow",
    goal: "A user can sign in and see a clear error when credentials are invalid.",
    why: "This is the main user flow for the project.",
    applicationId: createCustomApplicationId(applicationName),
    skillToLearn: "TypeScript form validation and API error handling",
    tasks: [
      "Connect the form to the authentication endpoint",
      "Render a useful invalid-credentials message",
      "Test successful and failed sign-in attempts",
    ],
    learningMinutes: 45,
    productionMinutes: 120,
    dependsOnStageIds: [],
    tutorialIds: [],
    ...values,
  };
}

describe("contextual QUANDA Guide", () => {
  it("creates an actionable coding guide without inventing a tutorial", () => {
    const request = requestFor(
      "Visual Studio Code",
      "en",
      "Complete beginner with TypeScript and Visual Studio Code",
    );
    const stage = stageFor("Visual Studio Code", {});
    const guide = createQuandaGuide(stage, request, "en");

    expect(guide.kind).toBe("coding");
    expect(guide.tutorialStatus).toBe("unavailable");
    expect(guide.applicationName).toBe("Visual Studio Code");
    expect(guide.steps.length).toBeGreaterThanOrEqual(3);
    expect(guide.steps.length).toBeLessThanOrEqual(6);
    expect(guide.steps.join(" ")).toContain("Visual Studio Code");
    expect(guide.steps).toEqual(expect.arrayContaining(stage.tasks));
    expect(guide.doneWhen).toContain("Visual Studio Code");
    expect(guide.checks.length).toBeGreaterThanOrEqual(2);
    expect(resolveTutorialRecommendations(stage, "en", "en")).toEqual([]);
  });

  it("lets a Vietnamese procedural guide replace the need for a video", () => {
    const request = requestFor("MATLAB", "vi", "Mới bắt đầu sử dụng MATLAB");
    const stage = stageFor("MATLAB", {
      title: "Xuất tệp, đặt tên và sao lưu bài nộp",
      goal: "Tệp kết quả đúng định dạng, mở được và có một bản sao lưu riêng.",
      why: "Kiểm tra bàn giao giúp tránh lỗi kỹ thuật sát hạn nộp.",
      skillToLearn: "Xuất tệp và tổ chức dự án trong MATLAB",
      tasks: [
        "Đặt tên tệp theo quy ước của môn học",
        "Mở lại toàn bộ tệp đã xuất",
        "Lưu tệp nguồn và một bản sao lưu",
      ],
    });
    const guide = createQuandaGuide(stage, request, "vi");

    expect(guide.kind).toBe("procedural");
    expect(guide.tutorialStatus).toBe("not-needed");
    expect(guide.applicationName).toBe("MATLAB");
    expect(guide.steps.join(" ")).toContain("MATLAB");
    expect(guide.doneWhen).toContain("định dạng");
    expect(guide.checks).toHaveLength(4);
  });

  it("adapts checks to a custom non-creative technical tool", () => {
    const request = requestFor(
      "SolidWorks Simulation",
      "en",
      "Intermediate CAD experience",
    );
    const stage = stageFor("SolidWorks Simulation", {
      title: "Run the load simulation",
      goal: "Produce a reproducible stress result using the specified material and load.",
      skillToLearn: "Simulation inputs, units, and result validation",
      tasks: [
        "Assign the specified material",
        "Apply the load and fixture conditions",
        "Recompute and export the stress summary",
      ],
    });
    const guide = createQuandaGuide(stage, request, "en");

    expect(guide.kind).toBe("technical");
    expect(guide.applicationName).toBe("SolidWorks Simulation");
    expect(guide.checks.join(" ")).toMatch(/units|inputs|reproducible/i);
    expect(guide.doneWhen).toContain("SolidWorks Simulation");
  });
});
