import {
  getApplicationName,
  isSupportedApplicationId,
} from "@/src/data/applications";
import type { Locale, RoadmapRequest, RoadmapStage } from "@/src/types";

export type QuandaGuideKind =
  | "procedural"
  | "coding"
  | "technical"
  | "visual"
  | "general";

export interface QuandaGuide {
  applicationName: string;
  kind: QuandaGuideKind;
  tutorialStatus: "not-needed" | "unavailable";
  steps: string[];
  doneWhen: string;
  checks: string[];
}

function searchable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function resolveApplicationId(
  stage: RoadmapStage,
  request: RoadmapRequest,
): string | null {
  if (stage.applicationId && isSupportedApplicationId(stage.applicationId)) {
    return stage.applicationId;
  }

  const selectedApplicationIds = request.requiredApplications.filter(
    isSupportedApplicationId,
  );
  if (selectedApplicationIds.length === 1) return selectedApplicationIds[0];

  const stageText = searchable(
    `${stage.title} ${stage.goal} ${stage.skillToLearn} ${stage.tasks.join(" ")}`,
  );
  return (
    selectedApplicationIds.find((applicationId) =>
      stageText.includes(searchable(getApplicationName(applicationId))),
    ) ?? null
  );
}

function classifyStage(
  stage: RoadmapStage,
  applicationName: string,
): QuandaGuideKind {
  const coreText = searchable(
    `${applicationName} ${stage.title} ${stage.goal} ${stage.skillToLearn}`,
  );
  const text = searchable(
    `${applicationName} ${stage.title} ${stage.goal} ${stage.skillToLearn} ${stage.tasks.join(" ")}`,
  );

  if (
    includesAny(coreText, [
      "export",
      "final delivery",
      "deliver files",
      "submission",
      "submit",
      "handoff",
      "hand off",
      "backup",
      "back up",
      "file name",
      "filename",
      "naming convention",
      "project organization",
      "project organisation",
      "archive",
      "package files",
      "xuat tep",
      "xuat file",
      "bai nop",
      "nop bai",
      "ban giao",
      "sao luu",
      "dat ten tep",
      "dat ten file",
      "to chuc du an",
      "dong goi",
    ])
  ) {
    return "procedural";
  }

  if (
    includesAny(text, [
      "coding",
      "codebase",
      "source code",
      "programming",
      "function",
      "component",
      "api",
      "debug",
      "compile",
      "repository",
      "database",
      "frontend",
      "backend",
      "authentication",
      "javascript",
      "typescript",
      "python",
      "game engine",
      "visual studio code",
      "vscode",
      "coding environment",
      "integrated development environment",
      "unity",
      "unreal",
      "lap trinh",
      "ma nguon",
      "go loi",
      "bien dich",
      "co so du lieu",
      "xac thuc",
      "cong cu game",
    ])
  ) {
    return "coding";
  }

  if (
    includesAny(text, [
      "simulation",
      "cad",
      "circuit",
      "engineering",
      "calculation",
      "dataset",
      "data analysis",
      "spreadsheet",
      "matlab",
      "solidworks",
      "autocad",
      "revit",
      "arduino",
      "mo phong",
      "mach dien",
      "ky thuat",
      "tinh toan",
      "phan tich du lieu",
      "bang tinh",
    ])
  ) {
    return "technical";
  }

  if (
    includesAny(text, [
      "modeling",
      "modelling",
      "material",
      "lighting",
      "animation",
      "layout",
      "colour",
      "color",
      "typography",
      "illustration",
      "sketch",
      "wireframe",
      "interface",
      "compositing",
      "render",
      "dung hinh",
      "vat lieu",
      "anh sang",
      "hoat hinh",
      "bo cuc",
      "mau sac",
      "kieu chu",
      "minh hoa",
      "giao dien",
      "ket xuat",
    ])
  ) {
    return "visual";
  }

  return "general";
}

function experienceLevel(experience: string): "beginner" | "experienced" | "regular" {
  const value = searchable(experience);
  if (
    includesAny(value, [
      "beginner",
      "new to",
      "never used",
      "first time",
      "no experience",
      "complete beginner",
      "moi bat dau",
      "chua tung",
      "lan dau",
      "chua co kinh nghiem",
    ])
  ) {
    return "beginner";
  }
  if (
    includesAny(value, [
      "advanced",
      "expert",
      "professional",
      "experienced",
      "nang cao",
      "chuyen nghiep",
      "nhieu kinh nghiem",
    ])
  ) {
    return "experienced";
  }
  return "regular";
}

function createOpeningStep(
  locale: Locale,
  kind: QuandaGuideKind,
  level: ReturnType<typeof experienceLevel>,
  stage: RoadmapStage,
  applicationName: string,
): string {
  if (locale === "vi") {
    if (kind === "procedural") {
      return `Trong ${applicationName}, xác nhận tên tệp, định dạng, nơi lưu và hạn nộp cần dùng cho “${stage.title}”.`;
    }
    if (kind === "coding") {
      return level === "beginner"
        ? `Mở dự án trong ${applicationName}, chạy phiên bản hiện tại một lần và xác định tệp hoặc hệ thống liên quan đến ${stage.skillToLearn}.`
        : `Trong ${applicationName}, xác định hành vi mong đợi và cách kiểm tra nhanh nhất cho “${stage.title}” trước khi sửa mã.`;
    }
    if (kind === "technical") {
      return level === "beginner"
        ? `Mở một bản sao trong ${applicationName}; kiểm tra đơn vị, dữ liệu đầu vào và thiết lập ban đầu trước khi thực hiện ${stage.skillToLearn}.`
        : `Trong ${applicationName}, ghi lại đầu vào, ràng buộc và kết quả cần đạt cho “${stage.title}” trước khi thay đổi thiết lập.`;
    }
    if (kind === "visual") {
      return level === "beginner"
        ? `Mở một bản sao tệp gần nhất trong ${applicationName} và chọn một tham chiếu rõ ràng cho ${stage.skillToLearn}.`
        : `Trong ${applicationName}, chốt tiêu chí hình ảnh cần đạt cho “${stage.title}” trước khi tinh chỉnh.`;
    }
    return level === "beginner"
      ? `Mở dự án trong ${applicationName}, tạo một bản sao an toàn và xác định đầu ra của “${stage.title}”.`
      : `Trong ${applicationName}, chuyển mục tiêu “${stage.title}” thành một danh sách đầu ra có thể kiểm tra.`;
  }

  if (kind === "procedural") {
    return `In ${applicationName}, confirm the required file name, format, destination, and deadline for “${stage.title}”.`;
  }
  if (kind === "coding") {
    return level === "beginner"
      ? `Open the project in ${applicationName}, run the current version once, and locate the files or systems involved in ${stage.skillToLearn}.`
      : `In ${applicationName}, define the expected behavior and fastest verification method for “${stage.title}” before editing code.`;
  }
  if (kind === "technical") {
    return level === "beginner"
      ? `Open a duplicate in ${applicationName}; confirm units, inputs, and baseline settings before changing ${stage.skillToLearn}.`
      : `In ${applicationName}, record the inputs, constraints, and expected result for “${stage.title}” before changing settings.`;
  }
  if (kind === "visual") {
    return level === "beginner"
      ? `Open a copy of the latest file in ${applicationName} and choose one clear reference for ${stage.skillToLearn}.`
      : `In ${applicationName}, define the visual acceptance criteria for “${stage.title}” before refining.`;
  }
  return level === "beginner"
    ? `Open the project in ${applicationName}, create a safe working copy, and identify the output for “${stage.title}”.`
    : `In ${applicationName}, turn the goal for “${stage.title}” into a short, checkable output list.`;
}

function createValidationStep(
  locale: Locale,
  kind: QuandaGuideKind,
  stage: RoadmapStage,
  applicationName: string,
): string {
  if (locale === "vi") {
    if (kind === "coding") {
      return `Chạy lại luồng hoặc lệnh liên quan trong ${applicationName} và ghi lại lỗi còn lại trước khi kết thúc giai đoạn.`;
    }
    if (kind === "technical") {
      return `Tính toán hoặc mở lại kết quả trong ${applicationName}, rồi so sánh với mục tiêu: ${stage.goal}`;
    }
    return `Xem lại kết quả trong ${applicationName} và đối chiếu trực tiếp với mục tiêu: ${stage.goal}`;
  }
  if (kind === "coding") {
    return `Run the affected flow or command again in ${applicationName} and record any remaining error before closing the stage.`;
  }
  if (kind === "technical") {
    return `Recompute or reopen the result in ${applicationName}, then compare it directly with this goal: ${stage.goal}`;
  }
  return `Review the result in ${applicationName} and compare it directly with this goal: ${stage.goal}`;
}

function createChecks(
  locale: Locale,
  kind: QuandaGuideKind,
  level: ReturnType<typeof experienceLevel>,
  applicationName: string,
): string[] {
  const checksByLocale: Record<Locale, Record<QuandaGuideKind, string[]>> = {
    en: {
      procedural: [
        "Match the required file name, format, dimensions or version, and destination exactly.",
        "Open the delivered file outside the active work session and inspect it from start to finish.",
        "Keep the editable source and a separate backup; do not overwrite the only copy.",
      ],
      coding: [
        "Run the exact user flow or command changed in this stage, including one failure or edge case.",
        "Check the console, test output, and build output; leave no unexplained errors.",
        `Confirm dependencies and project files are saved for the version used by ${applicationName}.`,
      ],
      technical: [
        "Recheck units, coordinate systems, inputs, and tolerances before accepting the output.",
        "Reopen or recompute the result and confirm that it is reproducible.",
        "Compare the exported result with the required format and technical constraints.",
      ],
      visual: [
        "Inspect the result at its final size or playback speed, not only in the editor view.",
        "Check for missing assets, fonts, links, clipping, or unintended default settings.",
        "Compare the result with the chosen reference and the stage goal before polishing further.",
      ],
      general: [
        "Compare every output with the stage goal before moving on.",
        "Keep the source editable and save a separate review copy.",
      ],
    },
    vi: {
      procedural: [
        "Khớp chính xác tên tệp, định dạng, kích thước hoặc phiên bản và nơi lưu được yêu cầu.",
        "Mở tệp bàn giao ngoài phiên làm việc hiện tại và kiểm tra từ đầu đến cuối.",
        "Giữ tệp nguồn có thể chỉnh sửa và một bản sao lưu riêng; không ghi đè bản duy nhất.",
      ],
      coding: [
        "Chạy đúng luồng người dùng hoặc lệnh đã thay đổi, gồm ít nhất một trường hợp lỗi hoặc biên.",
        "Kiểm tra console, kết quả kiểm thử và kết quả build; không để lỗi chưa giải thích.",
        `Xác nhận các dependency và tệp dự án đã được lưu cho phiên bản dùng trong ${applicationName}.`,
      ],
      technical: [
        "Kiểm tra lại đơn vị, hệ tọa độ, dữ liệu đầu vào và dung sai trước khi chấp nhận kết quả.",
        "Mở lại hoặc tính toán lại kết quả để xác nhận có thể tái tạo.",
        "So sánh tệp xuất với định dạng và ràng buộc kỹ thuật được yêu cầu.",
      ],
      visual: [
        "Kiểm tra kết quả ở kích thước hoặc tốc độ phát cuối, không chỉ trong khung chỉnh sửa.",
        "Kiểm tra tài sản, phông chữ, liên kết bị thiếu, phần bị cắt và thiết lập mặc định ngoài ý muốn.",
        "So sánh kết quả với tham chiếu đã chọn và mục tiêu giai đoạn trước khi trau chuốt thêm.",
      ],
      general: [
        "So sánh từng đầu ra với mục tiêu giai đoạn trước khi chuyển tiếp.",
        "Giữ tệp nguồn có thể chỉnh sửa và lưu một bản riêng để xem lại.",
      ],
    },
  };

  const checks = [...checksByLocale[locale][kind]];
  if (level === "beginner" && checks.length < 4) {
    checks.push(
      locale === "vi"
        ? "Thay đổi từng thao tác hoặc thiết lập một, rồi kiểm tra kết quả trước khi tiếp tục."
        : "Change one operation or setting at a time, then check the result before continuing.",
    );
  }
  return checks.slice(0, 4);
}

function createDoneWhen(
  locale: Locale,
  kind: QuandaGuideKind,
  stage: RoadmapStage,
  applicationName: string,
): string {
  if (locale === "vi") {
    if (kind === "procedural") {
      return `Gói bàn giao mở đúng, dùng đúng tên và định dạng, đồng thời đáp ứng mục tiêu: ${stage.goal}`;
    }
    if (kind === "coding") {
      return `Hành vi cần đạt chạy đúng trong ${applicationName}, kiểm tra liên quan đã qua và mục tiêu này được đáp ứng: ${stage.goal}`;
    }
    if (kind === "technical") {
      return `Kết quả trong ${applicationName} có thể tái tạo, đúng ràng buộc và đáp ứng mục tiêu: ${stage.goal}`;
    }
    return `Kết quả đã được xem lại trong ${applicationName}, mọi nhiệm vụ đã được kiểm tra và mục tiêu này được đáp ứng: ${stage.goal}`;
  }

  if (kind === "procedural") {
    return `The delivery package opens correctly, uses the required name and format, and meets this goal: ${stage.goal}`;
  }
  if (kind === "coding") {
    return `The intended behavior works in ${applicationName}, the relevant check passes, and this goal is met: ${stage.goal}`;
  }
  if (kind === "technical") {
    return `The result is reproducible in ${applicationName}, meets its constraints, and satisfies this goal: ${stage.goal}`;
  }
  return `The result has been reviewed in ${applicationName}, every task is checked, and this goal is met: ${stage.goal}`;
}

export function createQuandaGuide(
  stage: RoadmapStage,
  request: RoadmapRequest,
  locale: Locale,
): QuandaGuide {
  const applicationId = resolveApplicationId(stage, request);
  const applicationName = applicationId
    ? getApplicationName(applicationId)
    : locale === "vi"
      ? "công cụ đã chọn"
      : "your selected tool";
  const kind = classifyStage(stage, applicationName);
  const level = experienceLevel(request.currentExperience);
  const steps = [
    createOpeningStep(locale, kind, level, stage, applicationName),
    ...stage.tasks.slice(0, 4),
  ];

  if (steps.length < 3) {
    steps.push(createValidationStep(locale, kind, stage, applicationName));
  }

  return {
    applicationName,
    kind,
    tutorialStatus: kind === "procedural" ? "not-needed" : "unavailable",
    steps: steps.slice(0, 6),
    doneWhen: createDoneWhen(locale, kind, stage, applicationName),
    checks: createChecks(locale, kind, level, applicationName),
  };
}
