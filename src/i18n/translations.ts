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
    applicationSupportCopy: string;
    noApplication: string;
    otherApplication: string;
    otherApplicationLabel: string;
    otherApplicationPlaceholder: string;
    outputType: string;
    targetQuality: string;
    submit: string;
    availableStudyTime: string;
    privacy: string;
    errorsTitle: string;
    errors: {
      projectBrief: string;
      deadline: string;
      currentExperience: string;
      hoursPerDay: string;
      daysPerWeek: string;
      requiredApplications: string;
      generic: string;
    };
    tutorialOptions: LabelOption[];
    outputOptions: LabelOption[];
    qualityOptions: LabelOption[];
  };
  review: {
    eyebrow: string;
    title: string;
    intro: string;
    intentLabel: string;
    intentHint: string;
    requirements: string;
    groups: Record<
      | "creativeDirection"
      | "medium"
      | "visualQualities"
      | "techniques"
      | "subject"
      | "motionInteraction"
      | "toolsSoftware"
      | "codingTechnology"
      | "output"
      | "moreDetails",
      string
    >;
    required: string;
    preference: string;
    suggested: string;
    addedByYou: string;
    notSure: string;
    addConcept: string;
    removeConcept: string;
    editRequirement: string;
    requirementWarning: string;
    searchTitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchHint: string;
    searching: string;
    noResults: string;
    closeSearch: string;
    addResult: string;
    cantFind: string;
    customLabel: string;
    customPlaceholder: string;
    addOwn: string;
    ownWording: string;
    ownWordingHelp: string;
    removed: string;
    removedHint: string;
    restore: string;
    showMore: string;
    showLess: string;
    editDetails: string;
    analyzeAgain: string;
    staleTitle: string;
    staleMessage: string;
    fallbackTitle: string;
    fallbackMessage: string;
    confirm: string;
    confirmHint: string;
    loadingTitle: string;
    loadingStatuses: string[];
    errorTitle: string;
    errorMessage: string;
    retry: string;
    debugDetails: string;
    constraintLabels: {
      deliverable: string;
      deadline: string;
      targetQuality: string;
      hoursPerDay: string;
      daysPerWeek: string;
    };
  };
  learning: {
    eyebrow: string;
    title: string;
    intro: string;
    alreadyKnow: string;
    needForProject: string;
    knownEmpty: string;
    estimate: string;
    skillReason: string;
    prerequisiteReason: string;
    required: string;
    useful: string;
    optional: string;
    whyTutorial: string;
    whyTutorialCopy: string;
    useThis: string;
    replace: string;
    alreadyKnowThis: string;
    needHelp: string;
    notRelevant: string;
    tooAdvanced: string;
    tooLong: string;
    noTutorial: string;
    noTutorialHelp: string;
    continue: string;
    saved: string;
    loadingTitle: string;
    loadingStatuses: string[];
    errorTitle: string;
    errorMessage: string;
    retry: string;
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
    definitionOfDone: string;
    dependencies: string;
    tutorials: string;
    noTutorial: string;
    quandaGuide: string;
    guideSteps: string;
    guideDoneWhen: string;
    guideChecks: string;
    guideNoVideoNeeded: string;
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
    routeEvidence: {
      locale: "en" | "vi";
      eyebrow: string;
      title: string;
      intro: string;
      selectedRoute: string;
      selected: string;
      routesConsidered: string;
      notSelected: string;
      skippedLearning: string;
      timeAvoided: string;
      noTimeEstimate: string;
      decisionBasis: string;
      output: string;
      deadline: string;
      availableTime: string;
      requiredApplications: string;
      statedExperience: string;
    };
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
        title: "Check the direction",
        description: "Correct QUANDA's interpretation before it shapes your path.",
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
    applicationSupportCopy:
      "Can’t find your tool? Choose ‘Other’ and enter any application, platform, coding environment, or software you need.",
    noApplication: "No required application",
    otherApplication: "Other",
    otherApplicationLabel: "Other application, tool, or platform",
    otherApplicationPlaceholder: "For example: Cinema 4D, Canva, Unity, or CapCut",
    outputType: "Desired output type",
    targetQuality: "Target quality",
    submit: "Understand my project",
    availableStudyTime: "Available study time",
    privacy: "Your brief is used only to understand and plan this project.",
    errorsTitle: "Please review these details",
    errors: {
      projectBrief: "Project brief must be between 30 and 2,000 characters.",
      deadline: "Choose today or a future deadline.",
      currentExperience: "Tell us briefly what you already know.",
      hoursPerDay: "Hours per day must be between 0.5 and 12.",
      daysPerWeek: "Days per week must be between 1 and 7.",
      requiredApplications: "Enter the other application, tool, or platform you need to use.",
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
  review: {
    eyebrow: "Check the direction",
    title: "QUANDA understood your project",
    intro:
      "Check the direction below before I build your learning path. Remove anything that feels wrong or add something I missed.",
    intentLabel: "Project intent",
    intentHint: "You can refine this summary, or leave it as it is.",
    requirements: "Project requirements",
    groups: {
      creativeDirection: "Creative direction",
      medium: "Medium",
      visualQualities: "Visual qualities",
      techniques: "Techniques",
      subject: "Subject",
      motionInteraction: "Motion / interaction",
      toolsSoftware: "Tools & software",
      codingTechnology: "Coding / technology",
      output: "Output",
      moreDetails: "More details",
    },
    required: "Required by brief",
    preference: "Preference",
    suggested: "Suggested",
    addedByYou: "Added by you",
    notSure: "Not sure?",
    addConcept: "Add concept",
    removeConcept: "Remove {label}",
    editRequirement: "Edit requirement: {label}",
    requirementWarning:
      "This was detected as a required project constraint. Remove it only if the requirement is incorrect.",
    searchTitle: "Add to your Creative DNA",
    searchLabel: "Search concepts",
    searchPlaceholder: "Try Y2K, fisheye, toon shading…",
    searchHint: "Search uses QUANDA's knowledge base, not another AI request.",
    searching: "Searching…",
    noResults: "No matching concepts yet. Refine the search or keep your own wording.",
    closeSearch: "Close concept search",
    addResult: "Add {label}",
    cantFind: "Can't find it? Add your own description",
    customLabel: "Your wording",
    customPlaceholder: "For example: neo-y2k eco rave",
    addOwn: "Keep my wording",
    ownWording: "Your wording",
    ownWordingHelp:
      "QUANDA will keep your wording even if it is not yet in the knowledge base.",
    removed: "Removed suggestions",
    removedHint: "These stay recorded and will not be silently re-added.",
    restore: "Restore {label}",
    showMore: "Show {count} more",
    showLess: "Show less",
    editDetails: "Edit project details",
    analyzeAgain: "Analyze again",
    staleTitle: "Your project details changed",
    staleMessage:
      "Analyze again to refresh QUANDA's interpretation before continuing.",
    fallbackTitle: "A careful starting point",
    fallbackMessage:
      "QUANDA couldn't fully analyze the project online, so this review uses the project details it could identify. You can still correct it.",
    confirm: "Looks right — continue",
    confirmHint: "Your corrections will be saved on this device.",
    loadingTitle: "Understanding your project",
    loadingStatuses: [
      "Reading your project details",
      "Identifying creative direction",
      "Mapping relevant concepts",
      "Checking project requirements",
    ],
    errorTitle: "QUANDA couldn't analyze the project",
    errorMessage:
      "Try again, or edit the project details. Your draft is still saved on this device.",
    retry: "Try analysis again",
    debugDetails: "Developer details",
    constraintLabels: {
      deliverable: "Output",
      deadline: "Deadline",
      targetQuality: "Target quality",
      hoursPerDay: "hours/day",
      daysPerWeek: "days/week",
    },
  },
  learning: {
    eyebrow: "Your minimum learning path",
    title: "Learn only what this project needs",
    intro:
      "QUANDA compared the confirmed direction with your experience, then kept the smallest useful skill chain.",
    alreadyKnow: "You already know",
    needForProject: "Skills to learn for this project",
    knownEmpty: "No project-relevant skills were marked as known yet.",
    estimate: "Estimated learning time",
    skillReason: "Required by the confirmed project direction.",
    prerequisiteReason: "A minimum prerequisite for a required project skill.",
    required: "Required",
    useful: "Useful",
    optional: "Optional",
    whyTutorial: "Why this tutorial?",
    whyTutorialCopy: "It is the strongest focused match for this skill, software, level, and available time.",
    useThis: "Use this",
    replace: "Replace",
    alreadyKnowThis: "I already know this",
    needHelp: "Need help",
    notRelevant: "Not relevant",
    tooAdvanced: "Too advanced",
    tooLong: "Too long",
    noTutorial: "No suitable verified tutorial found",
    noTutorialHelp: "QUANDA will keep the skill in your plan without inventing a link.",
    continue: "Continue to my roadmap",
    saved: "Your choices are saved on this device.",
    loadingTitle: "Building your focused learning path",
    loadingStatuses: [
      "Identifying what you need to learn",
      "Checking minimum prerequisites",
      "Finding focused tutorials",
      "Removing broad and repeated resources",
    ],
    errorTitle: "QUANDA couldn't match tutorials",
    errorMessage: "Try again. Your confirmed Creative DNA is still saved.",
    retry: "Try matching again",
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
    definitionOfDone: "Definition of done",
    dependencies: "Depends on",
    tutorials: "Tutorials",
    noTutorial: "No verified YouTube video matches this stage yet.",
    quandaGuide: "QUANDA Guide",
    guideSteps: "Practical steps",
    guideDoneWhen: "Done when",
    guideChecks: "Common checks",
    guideNoVideoNeeded:
      "This practical stage can be completed with the guide below; no video is required.",
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
    routeEvidence: {
      locale: "en",
      eyebrow: "Route evidence",
      title: "Why this is the shortest viable route",
      intro: "QUANDA compared practical tool routes against your output, experience, deadline, and available time.",
      selectedRoute: "Selected route",
      selected: "Selected",
      routesConsidered: "Routes considered",
      notSelected: "Not selected",
      skippedLearning: "What QUANDA removed",
      timeAvoided: "Estimated learning avoided",
      noTimeEstimate: "No time estimate shown because no relevant prior tool experience was provided.",
      decisionBasis: "Decision evidence",
      output: "Output",
      deadline: "Deadline",
      availableTime: "Available time",
      requiredApplications: "Selected applications",
      statedExperience: "Stated experience",
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
        title: "Kiểm tra định hướng",
        description: "Chỉnh cách QUANDA hiểu dự án trước khi tạo lộ trình.",
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
    applicationSupportCopy:
      "Không thấy công cụ bạn cần? Chọn ‘Khác’ và nhập bất kỳ ứng dụng, nền tảng, môi trường lập trình hoặc phần mềm nào.",
    noApplication: "Không yêu cầu ứng dụng",
    otherApplication: "Khác",
    otherApplicationLabel: "Ứng dụng, công cụ hoặc nền tảng khác",
    otherApplicationPlaceholder: "Ví dụ: Cinema 4D, Canva, Unity hoặc CapCut",
    outputType: "Loại sản phẩm mong muốn",
    targetQuality: "Mức chất lượng",
    submit: "Phân tích dự án của tôi",
    availableStudyTime: "Thời gian học hiện có",
    privacy: "Đề bài chỉ được dùng để hiểu và lập kế hoạch cho dự án này.",
    errorsTitle: "Vui lòng kiểm tra các thông tin sau",
    errors: {
      projectBrief: "Đề bài phải dài từ 30 đến 2.000 ký tự.",
      deadline: "Chọn hôm nay hoặc một ngày trong tương lai.",
      currentExperience: "Hãy mô tả ngắn gọn những gì bạn đã biết.",
      hoursPerDay: "Số giờ mỗi ngày phải từ 0,5 đến 12.",
      daysPerWeek: "Số ngày mỗi tuần phải từ 1 đến 7.",
      requiredApplications: "Hãy nhập ứng dụng, công cụ hoặc nền tảng bạn cần sử dụng.",
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
  review: {
    eyebrow: "Kiểm tra định hướng",
    title: "QUANDA đã hiểu dự án của bạn",
    intro:
      "Hãy kiểm tra định hướng bên dưới trước khi QUANDA tạo lộ trình học. Xóa điều chưa đúng hoặc thêm điều còn thiếu.",
    intentLabel: "Ý định dự án",
    intentHint: "Bạn có thể chỉnh bản tóm tắt này hoặc giữ nguyên.",
    requirements: "Yêu cầu dự án",
    groups: {
      creativeDirection: "Định hướng sáng tạo",
      medium: "Phương tiện",
      visualQualities: "Đặc điểm hình ảnh",
      techniques: "Kỹ thuật",
      subject: "Chủ thể",
      motionInteraction: "Chuyển động / tương tác",
      toolsSoftware: "Công cụ & phần mềm",
      codingTechnology: "Lập trình / công nghệ",
      output: "Đầu ra",
      moreDetails: "Chi tiết khác",
    },
    required: "Bắt buộc theo đề bài",
    preference: "Mong muốn",
    suggested: "QUANDA đề xuất",
    addedByYou: "Bạn đã thêm",
    notSure: "Chưa chắc?",
    addConcept: "Thêm khái niệm",
    removeConcept: "Xóa {label}",
    editRequirement: "Sửa yêu cầu: {label}",
    requirementWarning:
      "Điều này được xác định là yêu cầu bắt buộc của dự án. Chỉ xóa nếu yêu cầu đó không chính xác.",
    searchTitle: "Thêm vào DNA sáng tạo",
    searchLabel: "Tìm khái niệm",
    searchPlaceholder: "Thử Y2K, fisheye, toon shading…",
    searchHint: "Tìm kiếm dùng kho kiến thức của QUANDA, không gửi thêm yêu cầu AI.",
    searching: "Đang tìm…",
    noResults: "Chưa có kết quả phù hợp. Hãy đổi từ khóa hoặc giữ cách diễn đạt của bạn.",
    closeSearch: "Đóng tìm kiếm khái niệm",
    addResult: "Thêm {label}",
    cantFind: "Không tìm thấy? Thêm mô tả của bạn",
    customLabel: "Cách diễn đạt của bạn",
    customPlaceholder: "Ví dụ: neo-y2k eco rave",
    addOwn: "Giữ cách diễn đạt này",
    ownWording: "Cách diễn đạt của bạn",
    ownWordingHelp:
      "QUANDA sẽ giữ nguyên cách bạn diễn đạt dù khái niệm chưa có trong kho kiến thức.",
    removed: "Đề xuất đã xóa",
    removedHint: "Những mục này vẫn được ghi nhận và sẽ không tự xuất hiện lại.",
    restore: "Khôi phục {label}",
    showMore: "Hiện thêm {count} mục",
    showLess: "Thu gọn",
    editDetails: "Sửa thông tin dự án",
    analyzeAgain: "Phân tích lại",
    staleTitle: "Thông tin dự án đã thay đổi",
    staleMessage:
      "Hãy phân tích lại để cập nhật cách QUANDA hiểu dự án trước khi tiếp tục.",
    fallbackTitle: "Điểm bắt đầu thận trọng",
    fallbackMessage:
      "QUANDA chưa thể phân tích đầy đủ trực tuyến, nên phần này dùng những chi tiết hệ thống đã xác định được. Bạn vẫn có thể chỉnh sửa.",
    confirm: "Đúng hướng — tiếp tục",
    confirmHint: "Các chỉnh sửa sẽ được lưu trên thiết bị này.",
    loadingTitle: "Đang hiểu dự án của bạn",
    loadingStatuses: [
      "Đang đọc thông tin dự án",
      "Đang xác định định hướng sáng tạo",
      "Đang liên kết các khái niệm phù hợp",
      "Đang kiểm tra yêu cầu dự án",
    ],
    errorTitle: "QUANDA chưa thể phân tích dự án",
    errorMessage:
      "Hãy thử lại hoặc sửa thông tin dự án. Bản nháp vẫn được lưu trên thiết bị này.",
    retry: "Thử phân tích lại",
    debugDetails: "Chi tiết dành cho lập trình viên",
    constraintLabels: {
      deliverable: "Đầu ra",
      deadline: "Hạn chót",
      targetQuality: "Mức chất lượng",
      hoursPerDay: "giờ/ngày",
      daysPerWeek: "ngày/tuần",
    },
  },
  learning: {
    eyebrow: "Lộ trình học tối thiểu",
    title: "Chỉ học những gì dự án này cần",
    intro:
      "QUANDA đã đối chiếu định hướng được xác nhận với kinh nghiệm của bạn và giữ lại chuỗi kỹ năng ngắn nhất có ích.",
    alreadyKnow: "Bạn đã biết",
    needForProject: "Kỹ năng cần học cho dự án này",
    knownEmpty: "Chưa có kỹ năng liên quan đến dự án được đánh dấu là đã biết.",
    estimate: "Thời gian học ước tính",
    skillReason: "Kỹ năng này cần thiết cho định hướng dự án đã xác nhận.",
    prerequisiteReason: "Kiến thức nền tối thiểu cho một kỹ năng bắt buộc của dự án.",
    required: "Bắt buộc",
    useful: "Hữu ích",
    optional: "Không bắt buộc",
    whyTutorial: "Vì sao chọn video này?",
    whyTutorialCopy: "Đây là lựa chọn tập trung phù hợp nhất với kỹ năng, phần mềm, trình độ và quỹ thời gian của bạn.",
    useThis: "Dùng video này",
    replace: "Đổi video",
    alreadyKnowThis: "Tôi đã biết kỹ năng này",
    needHelp: "Tôi cần hỗ trợ",
    notRelevant: "Không liên quan",
    tooAdvanced: "Quá nâng cao",
    tooLong: "Quá dài",
    noTutorial: "Chưa tìm thấy video đã xác minh phù hợp",
    noTutorialHelp: "QUANDA sẽ giữ kỹ năng trong kế hoạch mà không bịa đường dẫn.",
    continue: "Tiếp tục đến lộ trình",
    saved: "Lựa chọn của bạn được lưu trên thiết bị này.",
    loadingTitle: "Đang tạo lộ trình học tập trung",
    loadingStatuses: [
      "Đang xác định kỹ năng cần học",
      "Đang kiểm tra kiến thức nền tối thiểu",
      "Đang tìm video tập trung",
      "Đang loại nguồn quá rộng và trùng lặp",
    ],
    errorTitle: "QUANDA chưa thể ghép video hướng dẫn",
    errorMessage: "Hãy thử lại. DNA sáng tạo đã xác nhận vẫn được lưu.",
    retry: "Thử ghép lại",
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
    definitionOfDone: "Hoàn thành khi",
    dependencies: "Phụ thuộc",
    tutorials: "Video hướng dẫn",
    noTutorial: "Chưa có video YouTube đã xác minh phù hợp với giai đoạn này.",
    quandaGuide: "Hướng dẫn QUANDA",
    guideSteps: "Các bước thực hiện",
    guideDoneWhen: "Hoàn thành khi",
    guideChecks: "Điểm cần kiểm tra",
    guideNoVideoNeeded:
      "Giai đoạn thực hành này có thể hoàn thành theo hướng dẫn dưới đây; không bắt buộc có video.",
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
    routeEvidence: {
      locale: "vi",
      eyebrow: "Bằng chứng chọn lộ trình",
      title: "Vì sao đây là lộ trình khả thi ngắn nhất",
      intro: "QUANDA so sánh các tuyến công cụ dựa trên sản phẩm, kinh nghiệm, hạn chót và thời gian bạn có.",
      selectedRoute: "Lộ trình được chọn",
      selected: "Được chọn",
      routesConsidered: "Các lộ trình đã cân nhắc",
      notSelected: "Không chọn",
      skippedLearning: "QUANDA đã loại bỏ",
      timeAvoided: "Thời gian học ước tính tránh được",
      noTimeEstimate: "Không hiển thị ước tính vì chưa có kinh nghiệm công cụ liên quan.",
      decisionBasis: "Cơ sở quyết định",
      output: "Sản phẩm",
      deadline: "Hạn chót",
      availableTime: "Thời gian có thể dành",
      requiredApplications: "Ứng dụng đã chọn",
      statedExperience: "Kinh nghiệm đã khai báo",
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
