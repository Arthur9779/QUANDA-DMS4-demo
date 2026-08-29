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
  path: {
    initialEyebrow: string;
    initialTitle: string;
    initialIntro: string;
    initialBriefPlaceholder: string;
    initialBriefHint: string;
    initialSubmit: string;
    clarificationTitle: string;
    clarificationIntro: string;
    creativeChoice: string;
    engineeringChoice: string;
    designLabel: string;
    engineeringLabel: string;
    designDescription: string;
    engineeringDescription: string;
    detectedAs: string;
    returnToStart: string;
  };
  engineering: {
    eyebrow: string;
    formTitle: string;
    formIntro: string;
    brief: string;
    briefPlaceholder: string;
    startingPoint: string;
    startingOptions: LabelOption[];
    repository: string;
    repositoryPlaceholder: string;
    location: string;
    locationPlaceholder: string;
    definitionOfDone: string;
    definitionPlaceholder: string;
    platform: string;
    platformOptions: LabelOption[];
    technologies: string;
    technologiesPlaceholder: string;
    experience: string;
    experiencePlaceholder: string;
    deployment: string;
    deploymentPlaceholder: string;
    deadline: string;
    hoursPerDay: string;
    daysPerWeek: string;
    constraints: string;
    constraintsPlaceholder: string;
    blockers: string;
    blockersPlaceholder: string;
    submit: string;
    interpretTitle: string;
    interpretIntro: string;
    productType: string;
    coreFeatures: string;
    suggestedStack: string;
    repositoryContext: string;
    dataApi: string;
    deploymentTarget: string;
    risks: string;
    importantConstraints: string;
    confirm: string;
    edit: string;
    loading: string;
    roadmapEyebrow: string;
    roadmapTitle: string;
    roadmapIntro: string;
    outcome: string;
    whyItMatters: string;
    executor: string;
    dependencies: string;
    agentPrompt: string;
    acceptance: string;
    verification: string;
    expectedArtifact: string;
    humanCheckpoint: string;
    estimates: string;
    failureFallback: string;
    agent: string;
    human: string;
    hybrid: string;
    minutes: string;
    taskCount: string;
    collapse: string;
    expand: string;
    notice: string;
    warnings: string;
    noValue: string;
    validationError: string;
  };
  preparation: {
    eyebrow: string;
    title: string;
    intro: string;
    guidedTitle: string;
    guidedDescription: string;
    guidedDetail: string;
    agenticTitle: string;
    agenticDescription: string;
    agenticDetail: string;
    selectedNote: string;
    guidedEyebrow: string;
    outcome: string;
    why: string;
    checks: string;
    resources: string;
    humanNote: string;
  };
  workflow: {
    ariaLabel: string;
    brief: string;
    review: string;
    prepare: string;
    plan: string;
    completed: string;
    next: string;
    dismiss: string;
  };
  routeEvaluation: {
    eyebrow: string;
    title: string;
    outOf: string;
    recommended: string;
    alternative: string;
    rejected: string;
    tools: string;
    strengths: string;
    tradeoffs: string;
    showEvidence: string;
    showAlternatives: string;
    hideAlternatives: string;
    showDetails: string;
    hideDetails: string;
    whyRejected: string;
    criteria: Record<string, string>;
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
    applicationSearchLabel: string;
    applicationSearchPlaceholder: string;
    applicationSearchHint: string;
    applicationSearching: string;
    applicationNoResults: string;
    selectedApplications: string;
    addApplication: string;
    removeApplication: string;
    addCustomApplication: string;
    customApplicationHint: string;
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
    showInferred: string;
    inferredIntro: string;
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
    previousTutorial: string;
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
    titleLead: "Agentic planner find the most optimal path",
    titleAccent: "for the deadline",
    tagline: "From project brief to a practical learning path.",
    description:
      "QUANDA turns your brief, experience, and available time into a focused production plan—with trustworthy places to learn each skill.",
    start: "Plan my project",
    note: "No account needed · Your work stays on this device",
  },
  path: {
    initialEyebrow: "Start with your project",
    initialTitle: "What do you want to make?",
    initialIntro: "Describe the main thing you need to deliver. QUANDA will choose one focused workflow and ask only for details that matter.",
    initialBriefPlaceholder: "For example: Create a product animation in Blender, or build a portfolio website with a searchable gallery and a Vercel preview.",
    initialBriefHint: "Describe the deliverable, constraints, and deadline if you know them.",
    initialSubmit: "Choose my workflow",
    clarificationTitle: "One quick clarification",
    clarificationIntro: "Your brief could fit both workflows. Choose the primary deliverable so QUANDA keeps the rest of the experience focused.",
    creativeChoice: "A creative or visual artifact",
    engineeringChoice: "Working software or a technical system",
    designLabel: "Design Production",
    engineeringLabel: "Agentic Engineering",
    designDescription: "Creative DNA, skill gaps, verified tutorials, and a production roadmap.",
    engineeringDescription: "A build contract, agent-ready tasks, verification, and human review checkpoints.",
    detectedAs: "QUANDA routed this brief to",
    returnToStart: "Return to the beginning",
  },
  engineering: {
    eyebrow: "Agentic Engineering",
    formTitle: "Describe the build QUANDA should help you execute",
    formIntro: "This is a project brief for a coding agent, not a programming course. QUANDA will turn it into concrete tasks you can supervise and verify.",
    brief: "Technical project brief",
    briefPlaceholder: "For example: Build a Next.js portfolio website with a searchable project gallery, accessible navigation, and a Vercel preview.",
    startingPoint: "Starting point",
    startingOptions: [
      { value: "new_project", label: "New project" },
      { value: "existing_repository", label: "Existing repository" },
      { value: "existing_bug", label: "Existing project with a bug" },
      { value: "existing_feature", label: "Existing project requiring a feature" },
    ],
    repository: "Repository URL",
    repositoryPlaceholder: "https://github.com/you/project",
    location: "Project location",
    locationPlaceholder: "Local folder or workspace name",
    definitionOfDone: "Definition of done",
    definitionPlaceholder: "What must be true for you to accept the delivery?",
    platform: "Target platform",
    platformOptions: [
      { value: "web_application", label: "Web application" },
      { value: "mobile_application", label: "Mobile application" },
      { value: "desktop_application", label: "Desktop application" },
      { value: "api_backend", label: "API / backend" },
      { value: "automation", label: "Automation" },
      { value: "game", label: "Game" },
      { value: "data_project", label: "Data project" },
      { value: "plugin_extension", label: "Plugin / extension" },
      { value: "other", label: "Other technical system" },
    ],
    technologies: "Preferred tools and technologies",
    technologiesPlaceholder: "For example: Next.js, TypeScript, PostgreSQL (optional)",
    experience: "Current technical experience",
    experiencePlaceholder: "For example: comfortable editing React, new to deployment",
    deployment: "Deployment target",
    deploymentPlaceholder: "For example: Vercel preview, local-only, or App Store build",
    deadline: "Deadline",
    hoursPerDay: "Available hours per day",
    daysPerWeek: "Available days per week",
    constraints: "Important project constraints",
    constraintsPlaceholder: "Access, device, privacy, scope, or other limits to keep in mind",
    blockers: "Existing errors or blockers",
    blockersPlaceholder: "Required for an existing bug; otherwise optional",
    submit: "Review my build plan",
    interpretTitle: "Let’s shape your build plan",
    interpretIntro: "Check and correct the technical interpretation before QUANDA creates agent-ready work. These fields remain separate from the design workflow.",
    productType: "Product type",
    coreFeatures: "Core features",
    suggestedStack: "Suggested technology stack",
    repositoryContext: "Repository context",
    dataApi: "Data or API requirements",
    deploymentTarget: "Deployment target",
    risks: "Main technical risks",
    importantConstraints: "Important constraints",
    confirm: "Generate the engineering roadmap",
    edit: "Edit build details",
    loading: "Building your agent-ready plan…",
    roadmapEyebrow: "Agentic Engineering roadmap",
    roadmapTitle: "Execute the production pipeline",
    roadmapIntro: "Each task has an owner, an implementation prompt, acceptance criteria, verification, and a human checkpoint. QUANDA does not claim the agent can do the human-only work.",
    outcome: "Outcome",
    whyItMatters: "Why it matters",
    executor: "Executor",
    dependencies: "Dependencies",
    agentPrompt: "Agent-ready implementation prompt",
    acceptance: "Acceptance criteria",
    verification: "Verification checks",
    expectedArtifact: "Expected artifact",
    humanCheckpoint: "Human review checkpoint",
    estimates: "Estimated effort",
    failureFallback: "If this fails",
    agent: "Agent-executable",
    human: "Human-only",
    hybrid: "Hybrid",
    minutes: "min",
    taskCount: "concrete tasks",
    collapse: "Collapse",
    expand: "Expand",
    notice: "Deterministic fallback used",
    warnings: "Important limits",
    noValue: "Not provided",
    validationError: "Please complete the required build details.",
  },
  preparation: {
    eyebrow: "Choose your preparation route",
    title: "Choose how you want to prepare",
    intro: "Choose one way to move this project forward. QUANDA will show only the selected route, so you are not asked to manage two plans at once.",
    guidedTitle: "Guided tutorials",
    guidedDescription: "Learn the small amount needed to supervise the build.",
    guidedDetail: "Short guidance for repository structure, diffs, tests, and deployment checks.",
    agenticTitle: "Agentic project plan",
    agenticDescription: "Work with Codex or another coding agent on the project itself.",
    agenticDetail: "Concrete tasks with prompts, acceptance criteria, verification, and human checkpoints.",
    selectedNote: "Your selected preparation route is saved on this device.",
    guidedEyebrow: "Guided preparation",
    outcome: "Outcome",
    why: "Why it matters",
    checks: "Checks to run",
    resources: "Verified resources",
    humanNote: "You remain responsible for reviewing changes, running checks, and accepting the final result.",
  },
  workflow: { ariaLabel: "Planning progress", brief: "Brief", review: "Review the plan", prepare: "Choose how to prepare", plan: "Production plan", completed: "complete", next: "Next", dismiss: "Got it" },
  routeEvaluation: {
    eyebrow: "Evidence-backed route choice",
    title: "Why this route is the strongest fit",
    outOf: "out of 100",
    recommended: "Recommended route",
    alternative: "Alternative route",
    rejected: "Rejected route",
    tools: "Tools in this route",
    strengths: "Strengths",
    tradeoffs: "Trade-offs",
    showEvidence: "Show score evidence",
    showAlternatives: "Compare alternative routes",
    hideAlternatives: "Hide alternative routes",
    showDetails: "Show details",
    hideDetails: "Hide details",
    whyRejected: "Why it was rejected",
    criteria: { requirements_fit: "Requirements fit", familiarity: "User familiarity", time_fit: "Deadline and time fit", switching_cost: "Tool switching cost", resources: "Verified resources", risk: "Project risk" },
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
        title: "Prepare, make, finish",
        description: "Choose guidance or an agentic project plan, then check concrete outputs.",
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
      "Search QUANDA’s application knowledge base, then add every tool the assignment requires.",
    noApplication: "No required application",
    applicationSearchLabel: "Search applications",
    applicationSearchPlaceholder: "Try TouchDesigner, Cinema 4D, CapCut, Unity…",
    applicationSearchHint: "Suggestions are restricted to applications and production software.",
    applicationSearching: "Searching applications…",
    applicationNoResults: "No indexed application matches yet.",
    selectedApplications: "Selected applications",
    addApplication: "Add application",
    removeApplication: "Remove application",
    addCustomApplication: "Add “{name}” as an application",
    customApplicationHint: "Use the exact application name required by your assignment.",
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
    title: "Let’s shape your project plan",
    intro:
      "Check and correct the important requirements QUANDA found before continuing. You decide what stays in the plan.",
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
    showInferred: "Show additional suggestions",
    inferredIntro: "These inferred concepts are optional. Open them only if you want to refine the plan further.",
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
    title: "Choose what will help you make this project",
    intro:
      "QUANDA compared the confirmed direction with your experience and kept the smallest useful skill chain for your chosen preparation route.",
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
    previousTutorial: "Previous tutorial",
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
    titleLead: "Trợ lý lập kế hoạch chủ động",
    titleAccent: "",
    tagline: "Từ đề bài dự án đến lộ trình học tập thực tế.",
    description:
      "QUANDA biến đề bài, kinh nghiệm và thời gian của bạn thành kế hoạch sản xuất tập trung—kèm nguồn học đáng tin cậy cho từng kỹ năng.",
    start: "Lập kế hoạch dự án",
    note: "Không cần tài khoản · Dữ liệu được lưu trên thiết bị này",
  },
  path: {
    initialEyebrow: "Bắt đầu từ dự án của bạn",
    initialTitle: "Bạn muốn tạo ra sản phẩm gì?",
    initialIntro: "Mô tả sản phẩm chính bạn cần bàn giao. QUANDA sẽ chọn một quy trình phù hợp và chỉ hỏi thêm những điều cần thiết.",
    initialBriefPlaceholder: "Ví dụ: Làm hoạt hình sản phẩm bằng Blender, hoặc xây website portfolio có gallery tìm kiếm và preview trên Vercel.",
    initialBriefHint: "Mô tả sản phẩm cần tạo, giới hạn và thời hạn nếu bạn đã biết.",
    initialSubmit: "Chọn quy trình",
    clarificationTitle: "Một câu hỏi làm rõ",
    clarificationIntro: "Đề bài của bạn có thể thuộc cả hai quy trình. Hãy chọn sản phẩm chính để QUANDA giữ phần còn lại tập trung.",
    creativeChoice: "Một sản phẩm sáng tạo hoặc hình ảnh",
    engineeringChoice: "Phần mềm hoạt động hoặc hệ thống kỹ thuật",
    designLabel: "Sản xuất thiết kế",
    engineeringLabel: "Kỹ thuật tác nhân",
    designDescription: "DNA sáng tạo, khoảng thiếu kỹ năng, tutorial đã xác minh và lộ trình sản xuất.",
    engineeringDescription: "Hợp đồng xây dựng, nhiệm vụ cho agent, kiểm chứng và điểm review của con người.",
    detectedAs: "QUANDA đã đưa đề bài vào",
    returnToStart: "Quay lại từ đầu",
  },
  engineering: {
    eyebrow: "Kỹ thuật tác nhân",
    formTitle: "Mô tả phần mềm QUANDA sẽ giúp bạn thực thi",
    formIntro: "Đây là đề bài cho coding agent, không phải khóa học lập trình. QUANDA sẽ chuyển nó thành nhiệm vụ cụ thể để bạn giám sát và kiểm chứng.",
    brief: "Đề bài kỹ thuật",
    briefPlaceholder: "Ví dụ: Xây website portfolio Next.js có gallery dự án, điều hướng truy cập được và preview trên Vercel.",
    startingPoint: "Điểm bắt đầu",
    startingOptions: [
      { value: "new_project", label: "Dự án mới" },
      { value: "existing_repository", label: "Repository có sẵn" },
      { value: "existing_bug", label: "Dự án có lỗi" },
      { value: "existing_feature", label: "Dự án cần thêm tính năng" },
    ],
    repository: "URL repository",
    repositoryPlaceholder: "https://github.com/ban/du-an",
    location: "Vị trí dự án",
    locationPlaceholder: "Thư mục local hoặc tên workspace",
    definitionOfDone: "Định nghĩa hoàn thành",
    definitionPlaceholder: "Điều gì phải đúng để bạn chấp nhận bàn giao?",
    platform: "Nền tảng mục tiêu",
    platformOptions: [
      { value: "web_application", label: "Ứng dụng web" },
      { value: "mobile_application", label: "Ứng dụng di động" },
      { value: "desktop_application", label: "Ứng dụng desktop" },
      { value: "api_backend", label: "API / backend" },
      { value: "automation", label: "Tự động hóa" },
      { value: "game", label: "Game" },
      { value: "data_project", label: "Dự án dữ liệu" },
      { value: "plugin_extension", label: "Plugin / extension" },
      { value: "other", label: "Hệ thống kỹ thuật khác" },
    ],
    technologies: "Công cụ và công nghệ muốn dùng",
    technologiesPlaceholder: "Ví dụ: Next.js, TypeScript, PostgreSQL (không bắt buộc)",
    experience: "Kinh nghiệm kỹ thuật hiện tại",
    experiencePlaceholder: "Ví dụ: biết sửa React, mới làm deployment",
    deployment: "Mục tiêu triển khai",
    deploymentPlaceholder: "Ví dụ: preview Vercel, chỉ chạy local hoặc bản build App Store",
    deadline: "Hạn chót",
    hoursPerDay: "Số giờ có thể làm mỗi ngày",
    daysPerWeek: "Số ngày có thể làm mỗi tuần",
    constraints: "Các giới hạn quan trọng của dự án",
    constraintsPlaceholder: "Quyền truy cập, thiết bị, riêng tư, phạm vi hoặc giới hạn khác cần lưu ý",
    blockers: "Lỗi hoặc blocker hiện tại",
    blockersPlaceholder: "Bắt buộc với dự án có lỗi; các trường hợp khác không bắt buộc",
    submit: "Xem kế hoạch xây dựng",
    interpretTitle: "Cùng định hình kế hoạch xây dựng",
    interpretIntro: "Hãy kiểm tra và sửa diễn giải kỹ thuật trước khi QUANDA tạo nhiệm vụ cho agent. Các trường này tách biệt với quy trình thiết kế.",
    productType: "Loại sản phẩm",
    coreFeatures: "Tính năng cốt lõi",
    suggestedStack: "Stack công nghệ đề xuất",
    repositoryContext: "Bối cảnh repository",
    dataApi: "Yêu cầu dữ liệu hoặc API",
    deploymentTarget: "Mục tiêu triển khai",
    risks: "Rủi ro kỹ thuật chính",
    importantConstraints: "Ràng buộc quan trọng",
    confirm: "Tạo lộ trình kỹ thuật",
    edit: "Sửa thông tin xây dựng",
    loading: "Đang tạo kế hoạch cho agent…",
    roadmapEyebrow: "Lộ trình kỹ thuật tác nhân",
    roadmapTitle: "Thực thi pipeline sản xuất",
    roadmapIntro: "Mỗi nhiệm vụ có người thực hiện, prompt triển khai, tiêu chí chấp nhận, kiểm tra và điểm review của con người. QUANDA không tuyên bố agent có thể làm phần chỉ dành cho con người.",
    outcome: "Đầu ra",
    whyItMatters: "Vì sao quan trọng",
    executor: "Người thực hiện",
    dependencies: "Phụ thuộc",
    agentPrompt: "Prompt triển khai cho agent",
    acceptance: "Tiêu chí chấp nhận",
    verification: "Kiểm tra xác minh",
    expectedArtifact: "Artifact mong đợi",
    humanCheckpoint: "Điểm review của con người",
    estimates: "Thời gian ước tính",
    failureFallback: "Nếu bước này thất bại",
    agent: "Agent có thể thực thi",
    human: "Chỉ con người",
    hybrid: "Kết hợp",
    minutes: "phút",
    taskCount: "nhiệm vụ cụ thể",
    collapse: "Thu gọn",
    expand: "Mở rộng",
    notice: "Đã dùng phương án xác định",
    warnings: "Giới hạn quan trọng",
    noValue: "Chưa cung cấp",
    validationError: "Vui lòng hoàn thành các thông tin xây dựng bắt buộc.",
  },
  preparation: {
    eyebrow: "Chọn cách chuẩn bị",
    title: "Chọn cách bạn muốn chuẩn bị cho dự án",
    intro: "Chọn một cách để đưa dự án tiến lên. QUANDA chỉ hiển thị tuyến bạn chọn để bạn không phải quản lý hai kế hoạch cùng lúc.",
    guidedTitle: "Hướng dẫn từng bước",
    guidedDescription: "Học một lượng vừa đủ để giám sát việc xây dựng.",
    guidedDetail: "Hướng dẫn ngắn về cấu trúc repository, diff, test và kiểm tra deployment.",
    agenticTitle: "Kế hoạch dự án với agent",
    agenticDescription: "Làm việc với Codex hoặc coding agent khác trên chính dự án.",
    agenticDetail: "Nhiệm vụ cụ thể kèm prompt, tiêu chí chấp nhận, kiểm tra và điểm review của con người.",
    selectedNote: "Cách chuẩn bị bạn chọn được lưu trên thiết bị này.",
    guidedEyebrow: "Chuẩn bị theo hướng dẫn",
    outcome: "Đầu ra",
    why: "Vì sao quan trọng",
    checks: "Kiểm tra cần chạy",
    resources: "Nguồn đã xác minh",
    humanNote: "Bạn vẫn chịu trách nhiệm review thay đổi, chạy kiểm tra và chấp nhận kết quả cuối.",
  },
  workflow: { ariaLabel: "Tiến độ lập kế hoạch", brief: "Đề bài", review: "Kiểm tra kế hoạch", prepare: "Chọn cách chuẩn bị", plan: "Kế hoạch sản xuất", completed: "đã xong", next: "Tiếp theo", dismiss: "Đã hiểu" },
  routeEvaluation: {
    eyebrow: "Lựa chọn tuyến có bằng chứng",
    title: "Vì sao tuyến này phù hợp nhất",
    outOf: "trên 100",
    recommended: "Tuyến được đề xuất",
    alternative: "Tuyến thay thế",
    rejected: "Tuyến bị loại",
    tools: "Công cụ trong tuyến này",
    strengths: "Điểm mạnh",
    tradeoffs: "Đánh đổi",
    showEvidence: "Xem bằng chứng chấm điểm",
    showAlternatives: "So sánh các tuyến thay thế",
    hideAlternatives: "Ẩn các tuyến thay thế",
    showDetails: "Xem chi tiết",
    hideDetails: "Ẩn chi tiết",
    whyRejected: "Vì sao bị loại",
    criteria: { requirements_fit: "Mức đáp ứng yêu cầu", familiarity: "Mức quen thuộc của bạn", time_fit: "Mức phù hợp thời hạn", switching_cost: "Chi phí đổi công cụ", resources: "Nguồn đã xác minh", risk: "Rủi ro dự án" },
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
        title: "Chuẩn bị, làm, hoàn thành",
        description: "Chọn hướng dẫn hoặc kế hoạch với agent rồi kiểm tra từng đầu ra cụ thể.",
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
      "Tìm trong kho ứng dụng của QUANDA rồi thêm mọi công cụ mà bài tập yêu cầu.",
    noApplication: "Không yêu cầu ứng dụng",
    applicationSearchLabel: "Tìm ứng dụng",
    applicationSearchPlaceholder: "Thử TouchDesigner, Cinema 4D, CapCut, Unity…",
    applicationSearchHint: "Gợi ý chỉ bao gồm ứng dụng và phần mềm sản xuất.",
    applicationSearching: "Đang tìm ứng dụng…",
    applicationNoResults: "Chưa có ứng dụng nào trong danh mục phù hợp.",
    selectedApplications: "Ứng dụng đã chọn",
    addApplication: "Thêm ứng dụng",
    removeApplication: "Xóa ứng dụng",
    addCustomApplication: "Thêm “{name}” làm ứng dụng",
    customApplicationHint: "Dùng đúng tên ứng dụng mà bài tập yêu cầu.",
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
    title: "Cùng định hình kế hoạch dự án",
    intro:
      "Hãy kiểm tra và sửa các yêu cầu quan trọng QUANDA đã tìm thấy trước khi tiếp tục. Bạn quyết định điều gì được giữ trong kế hoạch.",
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
    showInferred: "Hiện thêm đề xuất",
    inferredIntro: "Các khái niệm suy ra này là không bắt buộc. Chỉ mở khi bạn muốn tinh chỉnh kế hoạch thêm.",
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
    title: "Chọn điều giúp bạn hoàn thành dự án",
    intro:
      "QUANDA đã đối chiếu định hướng với kinh nghiệm của bạn và giữ lại chuỗi kỹ năng ngắn nhất hữu ích cho cách chuẩn bị bạn chọn.",
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
    previousTutorial: "Video trước đó",
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
