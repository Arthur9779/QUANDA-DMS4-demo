import type { Locale } from "@/src/types";

interface LabelOption {
  value: string;
  label: string;
}

export interface Translation {
  nav: {
    howItWorks: string;
    loadExample: string;
    languageLabel: string;
    primaryLabel: string;
    homeLabel: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    tagline: string;
    description: string;
    start: string;
    note: string;
  };
  how: {
    eyebrow: string;
    title: string;
    steps: Array<{ title: string; description: string }>;
  };
  form: {
    eyebrow: string;
    title: string;
    intro: string;
    required: string;
    optional: string;
    brief: string;
    briefPlaceholder: string;
    briefHint: string;
    deadline: string;
    experience: string;
    experiencePlaceholder: string;
    hoursPerDay: string;
    daysPerWeek: string;
    tutorialLanguage: string;
    applications: string;
    noApplication: string;
    outputType: string;
    targetQuality: string;
    submit: string;
    demoBadge: string;
    demoDescription: string;
    availableStudyTime: string;
    privacy: string;
    errorsTitle: string;
    errors: {
      projectBrief: string;
      deadline: string;
      currentExperience: string;
      hoursPerDay: string;
      daysPerWeek: string;
      generic: string;
    };
    tutorialOptions: LabelOption[];
    outputOptions: LabelOption[];
    qualityOptions: LabelOption[];
  };
  results: {
    eyebrow: string;
    demo: string;
    totalTime: string;
    deadline: string;
    availableTime: string;
    learning: string;
    production: string;
    goal: string;
    why: string;
    application: string;
    skill: string;
    tasks: string;
    dependencies: string;
    tutorials: string;
    noTutorial: string;
    youtubeVideo: string;
    version: string;
    watchYoutube: string;
    durationUnknown: string;
    languageNames: Record<"en" | "vi", string>;
    level: Record<"beginner" | "intermediate" | "advanced", string>;
    schedule: string;
    assumptions: string;
    warnings: string;
    edit: string;
    regenerate: string;
    startOver: string;
    stage: string;
    markComplete: string;
    completed: string;
    completeTitle: string;
    completeMessage: string;
    startOverConfirm: string;
    days: string;
    hours: string;
    minutes: string;
    status: Record<"comfortable" | "tight" | "unrealistic", string>;
    priority: Record<"high" | "medium" | "low", string>;
  };
  calendar: {
    eyebrow: string;
    title: string;
    intro: string;
    ariaLabel: string;
    controlsLabel: string;
    previousMonth: string;
    nextMonth: string;
    today: string;
    deadlineLegend: string;
    dayPlan: string;
    task: string;
    taskPlaceholder: string;
    deadline: string;
    add: string;
    emptyTasks: string;
    clearDay: string;
    of: string;
    complete: string;
    taskSingular: string;
    taskPlural: string;
    deleteTask: string;
  };
  loading: {
    eyebrow: string;
    title: string;
    statuses: string[];
  };
  errors: {
    rateLimit: string;
    networkFallback: string;
    timeoutFallback: string;
    malformedFallback: string;
    api: string;
  };
}

const en: Translation = {
  nav: {
    howItWorks: "How it works",
    loadExample: "Load example",
    languageLabel: "Interface language",
    primaryLabel: "Primary navigation",
    homeLabel: "QUANDA home",
  },
  hero: {
    eyebrow: "A practical co-pilot for creative projects",
    titleLead: "Make the deadline feel",
    titleAccent: "doable.",
    tagline: "From project brief to a practical learning path.",
    description:
      "QUANDA turns your brief, experience, and available time into a focused production plan—with trustworthy places to learn each skill.",
    start: "Plan my project",
    note: "No account needed · Your work stays on this device",
  },
  how: {
    eyebrow: "How it works",
    title: "From a blank page to a clear next step",
    steps: [
      {
        title: "Describe the project",
        description: "Share the deliverable, what you know, and your deadline.",
      },
      {
        title: "Receive a roadmap",
        description: "Get a realistic sequence of learning and production tasks.",
      },
      {
        title: "Learn, make, finish",
        description: "Follow curated tutorials and check off concrete outputs.",
      },
    ],
  },
  form: {
    eyebrow: "Tell us what you are making",
    title: "Shape your project plan",
    intro:
      "A little context helps QUANDA build a sequence that fits your skills, tools, and actual week.",
    required: "Required",
    optional: "Optional",
    brief: "Project brief",
    briefPlaceholder:
      "For example: I need to create a 20-second product animation for a university assignment. The final output should be a 1080p MP4 with simple sound.",
    briefHint: "30–2,000 characters",
    deadline: "Deadline",
    experience: "Current experience",
    experiencePlaceholder: "Photoshop: intermediate; Blender: beginner",
    hoursPerDay: "Hours per study day",
    daysPerWeek: "Study days per week",
    tutorialLanguage: "Preferred tutorial language",
    applications: "Required application(s)",
    noApplication: "No required application",
    outputType: "Desired output type",
    targetQuality: "Target quality",
    submit: "Generate my roadmap",
    demoBadge: "Demo mode",
    demoDescription:
      "No API key is configured, so QUANDA will use a dependable sample roadmap.",
    availableStudyTime: "Available study time",
    privacy: "Your brief is used only to create this roadmap.",
    errorsTitle: "Please review these details",
    errors: {
      projectBrief: "Project brief must be between 30 and 2,000 characters.",
      deadline: "Choose today or a future deadline.",
      currentExperience: "Tell us briefly what you already know.",
      hoursPerDay: "Hours per day must be between 0.5 and 12.",
      daysPerWeek: "Days per week must be between 1 and 7.",
      generic: "Check this field and try again.",
    },
    tutorialOptions: [
      { value: "en", label: "English" },
      { value: "vi", label: "Vietnamese" },
      { value: "either", label: "Either" },
    ],
    outputOptions: [
      { value: "video", label: "Video / Animation" },
      { value: "3d", label: "3D asset" },
      { value: "graphic", label: "Graphic design" },
      { value: "uiux", label: "UI/UX prototype" },
      { value: "audio", label: "Audio project" },
      { value: "photo", label: "Photography" },
      { value: "other", label: "Other" },
    ],
    qualityOptions: [
      { value: "basic", label: "Basic submission" },
      { value: "portfolio", label: "Portfolio-ready" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  results: {
    eyebrow: "Your production path",
    demo: "Reliable demo roadmap",
    totalTime: "Total estimated time",
    deadline: "Time to deadline",
    availableTime: "Available study time",
    learning: "Learning",
    production: "Production",
    goal: "Goal",
    why: "Why it matters",
    application: "Application",
    skill: "Skill to learn",
    tasks: "Production tasks",
    dependencies: "Depends on",
    tutorials: "Tutorials",
    noTutorial: "No verified YouTube video matches this stage yet.",
    youtubeVideo: "YouTube video",
    version: "Software version",
    watchYoutube: "Watch on YouTube",
    durationUnknown: "Self-paced",
    languageNames: { en: "English", vi: "Vietnamese" },
    level: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    },
    schedule: "Suggested work blocks",
    assumptions: "Assumptions",
    warnings: "Scope notes",
    edit: "Edit input",
    regenerate: "Regenerate",
    startOver: "Start over",
    stage: "Stage",
    markComplete: "Mark stage complete",
    completed: "Complete",
    completeTitle: "Roadmap complete",
    completeMessage:
      "You have checked off every planned stage. Review the final deliverable once more before submitting.",
    startOverConfirm:
      "Start over and clear this saved draft, roadmap, and completion progress?",
    days: "days",
    hours: "hours",
    minutes: "min",
    status: {
      comfortable: "Comfortable",
      tight: "Tight",
      unrealistic: "Needs a smaller scope",
    },
    priority: {
      high: "High priority",
      medium: "Medium priority",
      low: "Low priority",
    },
  },
  calendar: {
    eyebrow: "Your project garden",
    title: "Keep every deadline in view.",
    intro:
      "Select a day, add a task, and let the month hold the details. Everything is saved on this device.",
    ariaLabel: "Project calendar",
    controlsLabel: "Calendar controls",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    today: "Today",
    deadlineLegend: "Task deadline",
    dayPlan: "Day plan",
    task: "Task",
    taskPlaceholder: "What needs to get done?",
    deadline: "Deadline",
    add: "Add to calendar",
    emptyTasks: "No tasks yet. Add a small, concrete next step above.",
    clearDay: "A clear day — add something when you are ready.",
    of: "of",
    complete: "complete",
    taskSingular: "task",
    taskPlural: "tasks",
    deleteTask: "Delete task",
  },
  loading: {
    eyebrow: "Building your path",
    title: "Turning the brief into a practical sequence",
    statuses: [
      "Reading your brief",
      "Identifying production stages",
      "Matching tutorials",
      "Checking the deadline",
    ],
  },
  errors: {
    rateLimit: "Too many requests. Please wait a moment and try again.",
    networkFallback:
      "QUANDA could not reach the service, so a reliable demo roadmap has been generated instead.",
    timeoutFallback:
      "The AI service took too long, so a reliable demo roadmap has been generated instead.",
    malformedFallback:
      "The AI response could not be safely validated, so a reliable demo roadmap has been generated instead.",
    api: "QUANDA could not generate a roadmap. Please check your details and try again.",
  },
};

const vi: Translation = {
  nav: {
    howItWorks: "Cách hoạt động",
    loadExample: "Tải ví dụ",
    languageLabel: "Ngôn ngữ giao diện",
    primaryLabel: "Điều hướng chính",
    homeLabel: "Trang chủ QUANDA",
  },
  hero: {
    eyebrow: "Trợ lý thực tế cho dự án sáng tạo",
    titleLead: "Biến deadline thành",
    titleAccent: "điều khả thi.",
    tagline: "Từ đề bài dự án đến lộ trình học tập thực tế.",
    description:
      "QUANDA biến đề bài, kinh nghiệm và thời gian của bạn thành kế hoạch sản xuất tập trung—kèm nguồn học đáng tin cậy cho từng kỹ năng.",
    start: "Lập kế hoạch dự án",
    note: "Không cần tài khoản · Dữ liệu được lưu trên thiết bị này",
  },
  how: {
    eyebrow: "Cách hoạt động",
    title: "Từ trang giấy trắng đến bước tiếp theo rõ ràng",
    steps: [
      {
        title: "Mô tả dự án",
        description: "Chia sẻ sản phẩm cần làm, kỹ năng hiện có và thời hạn.",
      },
      {
        title: "Nhận lộ trình",
        description: "Nhận chuỗi nhiệm vụ học tập và sản xuất thực tế.",
      },
      {
        title: "Học, làm, hoàn thành",
        description: "Theo video hướng dẫn đã tuyển chọn và đánh dấu từng đầu ra cụ thể.",
      },
    ],
  },
  form: {
    eyebrow: "Hãy cho biết bạn đang làm gì",
    title: "Định hình kế hoạch dự án",
    intro:
      "Một ít bối cảnh giúp QUANDA tạo trình tự phù hợp với kỹ năng, công cụ và quỹ thời gian thực tế của bạn.",
    required: "Bắt buộc",
    optional: "Không bắt buộc",
    brief: "Đề bài dự án",
    briefPlaceholder:
      "Ví dụ: Tôi cần làm video hoạt hình sản phẩm dài 20 giây cho bài tập đại học. Sản phẩm cuối là MP4 1080p có âm thanh đơn giản.",
    briefHint: "30–2.000 ký tự",
    deadline: "Thời hạn",
    experience: "Kinh nghiệm hiện tại",
    experiencePlaceholder: "Photoshop: trung cấp; Blender: mới bắt đầu",
    hoursPerDay: "Số giờ mỗi ngày học",
    daysPerWeek: "Số ngày học mỗi tuần",
    tutorialLanguage: "Ngôn ngữ video hướng dẫn ưu tiên",
    applications: "Ứng dụng bắt buộc",
    noApplication: "Không yêu cầu ứng dụng",
    outputType: "Loại sản phẩm mong muốn",
    targetQuality: "Mức chất lượng",
    submit: "Tạo lộ trình cho tôi",
    demoBadge: "Chế độ demo",
    demoDescription:
      "Chưa cấu hình API key, vì vậy QUANDA sẽ dùng lộ trình mẫu đáng tin cậy.",
    availableStudyTime: "Thời gian học hiện có",
    privacy: "Đề bài chỉ được dùng để tạo lộ trình này.",
    errorsTitle: "Vui lòng kiểm tra các thông tin sau",
    errors: {
      projectBrief: "Đề bài phải dài từ 30 đến 2.000 ký tự.",
      deadline: "Chọn hôm nay hoặc một ngày trong tương lai.",
      currentExperience: "Hãy mô tả ngắn gọn những gì bạn đã biết.",
      hoursPerDay: "Số giờ mỗi ngày phải từ 0,5 đến 12.",
      daysPerWeek: "Số ngày mỗi tuần phải từ 1 đến 7.",
      generic: "Hãy kiểm tra trường này và thử lại.",
    },
    tutorialOptions: [
      { value: "en", label: "Tiếng Anh" },
      { value: "vi", label: "Tiếng Việt" },
      { value: "either", label: "Cả hai" },
    ],
    outputOptions: [
      { value: "video", label: "Video / Hoạt hình" },
      { value: "3d", label: "Mô hình 3D" },
      { value: "graphic", label: "Thiết kế đồ họa" },
      { value: "uiux", label: "Bản mẫu UI/UX" },
      { value: "audio", label: "Dự án âm thanh" },
      { value: "photo", label: "Nhiếp ảnh" },
      { value: "other", label: "Khác" },
    ],
    qualityOptions: [
      { value: "basic", label: "Bài nộp cơ bản" },
      { value: "portfolio", label: "Sẵn sàng cho hồ sơ năng lực" },
      { value: "unsure", label: "Chưa chắc" },
    ],
  },
  results: {
    eyebrow: "Lộ trình sản xuất của bạn",
    demo: "Lộ trình demo đáng tin cậy",
    totalTime: "Tổng thời gian ước tính",
    deadline: "Thời gian đến hạn",
    availableTime: "Thời gian học hiện có",
    learning: "Học",
    production: "Sản xuất",
    goal: "Mục tiêu",
    why: "Vì sao quan trọng",
    application: "Ứng dụng",
    skill: "Kỹ năng cần học",
    tasks: "Nhiệm vụ sản xuất",
    dependencies: "Phụ thuộc",
    tutorials: "Video hướng dẫn",
    noTutorial: "Chưa có video YouTube đã xác minh phù hợp với giai đoạn này.",
    youtubeVideo: "Video YouTube",
    version: "Phiên bản phần mềm",
    watchYoutube: "Xem trên YouTube",
    durationUnknown: "Tự học theo tiến độ",
    languageNames: { en: "Tiếng Anh", vi: "Tiếng Việt" },
    level: {
      beginner: "Mới bắt đầu",
      intermediate: "Trung cấp",
      advanced: "Nâng cao",
    },
    schedule: "Buổi làm việc đề xuất",
    assumptions: "Giả định",
    warnings: "Lưu ý về phạm vi",
    edit: "Sửa thông tin",
    regenerate: "Tạo lại",
    startOver: "Bắt đầu lại",
    stage: "Giai đoạn",
    markComplete: "Đánh dấu giai đoạn hoàn thành",
    completed: "Đã hoàn thành",
    completeTitle: "Đã hoàn thành lộ trình",
    completeMessage:
      "Bạn đã hoàn thành mọi giai đoạn. Hãy xem lại sản phẩm cuối một lần nữa trước khi nộp.",
    startOverConfirm:
      "Bắt đầu lại và xóa đề bài, lộ trình cùng tiến độ đã lưu?",
    days: "ngày",
    hours: "giờ",
    minutes: "phút",
    status: {
      comfortable: "Thoải mái",
      tight: "Khá sát",
      unrealistic: "Cần giảm phạm vi",
    },
    priority: {
      high: "Ưu tiên cao",
      medium: "Ưu tiên vừa",
      low: "Ưu tiên thấp",
    },
  },
  calendar: {
    eyebrow: "Khu vườn dự án",
    title: "Nhìn rõ mọi hạn chót.",
    intro:
      "Chọn một ngày, thêm công việc và để lịch tháng lưu giữ chi tiết. Mọi thứ được lưu trên thiết bị này.",
    ariaLabel: "Lịch dự án",
    controlsLabel: "Điều khiển lịch",
    previousMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    today: "Hôm nay",
    deadlineLegend: "Hạn công việc",
    dayPlan: "Kế hoạch trong ngày",
    task: "Công việc",
    taskPlaceholder: "Bạn cần hoàn thành việc gì?",
    deadline: "Hạn chót",
    add: "Thêm vào lịch",
    emptyTasks: "Chưa có công việc. Hãy thêm một bước nhỏ và cụ thể ở trên.",
    clearDay: "Ngày này còn trống — hãy thêm việc khi bạn sẵn sàng.",
    of: "trên",
    complete: "đã hoàn thành",
    taskSingular: "công việc",
    taskPlural: "công việc",
    deleteTask: "Xóa công việc",
  },
  loading: {
    eyebrow: "Đang xây dựng lộ trình",
    title: "Biến đề bài thành trình tự thực tế",
    statuses: [
      "Đang đọc đề bài",
      "Đang xác định các giai đoạn sản xuất",
      "Đang ghép video hướng dẫn phù hợp",
      "Đang kiểm tra thời hạn",
    ],
  },
  errors: {
    rateLimit: "Có quá nhiều yêu cầu. Vui lòng chờ một chút rồi thử lại.",
    networkFallback:
      "QUANDA không thể kết nối với dịch vụ, nên hệ thống đã tạo một lộ trình mẫu đáng tin cậy để thay thế.",
    timeoutFallback:
      "Dịch vụ AI phản hồi quá lâu, nên hệ thống đã tạo một lộ trình mẫu đáng tin cậy để thay thế.",
    malformedFallback:
      "Phản hồi AI không thể được xác thực an toàn, nên hệ thống đã tạo một lộ trình mẫu đáng tin cậy để thay thế.",
    api: "QUANDA không thể tạo lộ trình. Vui lòng kiểm tra thông tin và thử lại.",
  },
};

export const translations = { en, vi };

export function getTranslation(locale: Locale): Translation {
  const value = translations[locale];
  if (process.env.NODE_ENV === "development" && !value) {
    console.warn(`[QUANDA] Missing translations for locale: ${locale}`);
  }
  return value ?? translations.en;
}
