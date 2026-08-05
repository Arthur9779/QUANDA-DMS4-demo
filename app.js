const TASK_STORAGE_KEY = "quanda-calendar-tasks-v2";

const copy = {
  en: {
    skip: "Skip to content", navHow: "How it works", loadExample: "Load example",
    heroEyebrow: "A practical co-pilot for creative projects", heroLine1: "Make the", heroLine2: "deadline feel", heroAccent: "doable.",
    heroTagline: "From project brief to a practical learning path.",
    heroDescription: "QUANDA turns your brief, experience, and available time into a focused production plan—with trustworthy places to learn each skill.",
    planProject: "Plan my project", privacy: "No account needed · Your work stays on this device",
    howEyebrow: "How it works", howTitle: "From a blank page to a clear next step",
    step1Title: "Describe the project", step1Body: "Share the deliverable, what you know, and your deadline.",
    step2Title: "Receive a roadmap", step2Body: "Get a realistic sequence of learning and production tasks.",
    step3Title: "Learn, make, finish", step3Body: "Follow curated tutorials and check off concrete outputs.",
    formEyebrow: "Tell us what you are making", formTitle: "Shape your project plan",
    formIntro: "A little context helps QUANDA build a sequence that fits your skills, tools, and actual week.",
    briefLabel: "Project brief", required: "Required", briefRange: "30–2,000 characters", deadlineLabel: "Deadline",
    experienceLabel: "Current experience", studyTime: "◷ Available study time", hoursPerDay: "Hours per study day",
    daysPerWeek: "Study days per week", tutorialLanguage: "Preferred tutorial language", outputType: "Desired output type",
    optional: "Optional", applications: "Required application(s)", noApplication: "No required application",
    quality: "Target quality", qualityBasic: "Basic submission", qualityPortfolio: "Portfolio-ready", qualityUnsure: "Not sure",
    generate: "Generate my roadmap", formPrivacy: "Your brief is used only to create this roadmap.",
    calendarEyebrow: "Your project garden", calendarTitle: "Keep every deadline in view.",
    calendarIntro: "Select a day, add a task, and let the month hold the details. Everything is saved on this device.",
    today: "Today", deadlineLegend: "Task deadline", dayPlan: "Day plan", taskLabel: "Task", addCalendar: "Add to calendar",
    emptyTasks: "No tasks yet. Add a small, concrete next step above.", clearDay: "A clear day — add something when you are ready.",
    complete: "complete", of: "of", taskPlaceholder: "What needs to get done?",
    briefPlaceholder: "For example: I need to create a 20-second product animation for a university assignment. The final output should be a 1080p MP4 with simple sound.",
    experiencePlaceholder: "Photoshop: intermediate; Blender: beginner",
    roadmapEyebrow: "Your production path", roadmapTitle: "Focused production roadmap",
    roadmapSummary: "A structured sequence that protects the deadline while keeping learning and production work separate.",
    totalTime: "Total estimated time", feasibility: "Achievable with focus",
    feasibilityBody: "Protect the high-priority stages and review progress before the final export.",
    deadlineTime: "Time to deadline", availableTime: "Available study time", days: "days", hours: "hours",
    stage: "Stage", markComplete: "Mark stage complete", goal: "Goal", why: "Why it matters", application: "Application",
    skill: "Skill to learn", learning: "Learning", production: "Production", productionTasks: "Production tasks", resources: "Tutorials",
    noTutorial: "No verified YouTube video matches this stage yet.", watchYoutube: "Watch on YouTube", youtubeVideo: "YouTube video", softwareVersion: "Software version",
    schedule: "Suggested work blocks", assumptions: "Assumptions", scope: "Scope notes", priority: "High priority",
    editInput: "Edit input", regenerate: "Regenerate", startOver: "Start over",
  },
  vi: {
    skip: "Bỏ qua đến nội dung", navHow: "Cách hoạt động", loadExample: "Tải ví dụ",
    heroEyebrow: "Trợ lý thực tế cho dự án sáng tạo", heroLine1: "Biến deadline", heroLine2: "thành", heroAccent: "điều khả thi.",
    heroTagline: "Từ đề bài dự án đến lộ trình học tập thực tế.",
    heroDescription: "QUANDA biến đề bài, kinh nghiệm và thời gian của bạn thành kế hoạch sản xuất tập trung—kèm nguồn học đáng tin cậy cho từng kỹ năng.",
    planProject: "Lập kế hoạch dự án", privacy: "Không cần tài khoản · Dữ liệu được lưu trên thiết bị này",
    howEyebrow: "Cách hoạt động", howTitle: "Từ trang giấy trắng đến bước tiếp theo rõ ràng",
    step1Title: "Mô tả dự án", step1Body: "Chia sẻ sản phẩm cần làm, kỹ năng hiện có và thời hạn.",
    step2Title: "Nhận lộ trình", step2Body: "Nhận chuỗi nhiệm vụ học tập và sản xuất thực tế.",
    step3Title: "Học, làm, hoàn thành", step3Body: "Theo video hướng dẫn đã tuyển chọn và đánh dấu từng đầu ra cụ thể.",
    formEyebrow: "Hãy cho biết bạn đang làm gì", formTitle: "Định hình kế hoạch dự án",
    formIntro: "Một ít bối cảnh giúp QUANDA tạo trình tự phù hợp với kỹ năng, công cụ và quỹ thời gian thực tế của bạn.",
    briefLabel: "Đề bài dự án", required: "Bắt buộc", briefRange: "30–2.000 ký tự", deadlineLabel: "Thời hạn",
    experienceLabel: "Kinh nghiệm hiện tại", studyTime: "◷ Thời gian học hiện có", hoursPerDay: "Số giờ mỗi ngày học",
    daysPerWeek: "Số ngày học mỗi tuần", tutorialLanguage: "Ngôn ngữ video hướng dẫn ưu tiên", outputType: "Loại sản phẩm mong muốn",
    optional: "Không bắt buộc", applications: "Ứng dụng bắt buộc", noApplication: "Không yêu cầu ứng dụng",
    quality: "Mức chất lượng", qualityBasic: "Bài nộp cơ bản", qualityPortfolio: "Sẵn sàng cho hồ sơ năng lực", qualityUnsure: "Chưa chắc",
    generate: "Tạo lộ trình cho tôi", formPrivacy: "Đề bài chỉ được dùng để tạo lộ trình này.",
    calendarEyebrow: "Khu vườn dự án", calendarTitle: "Nhìn rõ mọi hạn chót.",
    calendarIntro: "Chọn một ngày, thêm công việc và để lịch tháng lưu giữ chi tiết. Mọi thứ được lưu trên thiết bị này.",
    today: "Hôm nay", deadlineLegend: "Hạn công việc", dayPlan: "Kế hoạch trong ngày", taskLabel: "Công việc", addCalendar: "Thêm vào lịch",
    emptyTasks: "Chưa có công việc. Hãy thêm một bước nhỏ và cụ thể ở trên.", clearDay: "Hôm nay còn trống — thêm việc khi bạn sẵn sàng.",
    complete: "hoàn thành", of: "trên", taskPlaceholder: "Bạn cần hoàn thành việc gì?",
    briefPlaceholder: "Ví dụ: Tôi cần làm video hoạt hình sản phẩm dài 20 giây cho bài tập đại học. Sản phẩm cuối là MP4 1080p có âm thanh đơn giản.",
    experiencePlaceholder: "Photoshop: trung cấp; Blender: mới bắt đầu",
    roadmapEyebrow: "Lộ trình sản xuất của bạn", roadmapTitle: "Lộ trình sản xuất tập trung",
    roadmapSummary: "Một trình tự rõ ràng giúp bảo vệ hạn chót và tách riêng thời gian học với thời gian sản xuất.",
    totalTime: "Tổng thời gian ước tính", feasibility: "Khá sát",
    feasibilityBody: "Ưu tiên các giai đoạn quan trọng và kiểm tra tiến độ trước lần xuất cuối.",
    deadlineTime: "Thời gian đến hạn", availableTime: "Thời gian có thể dành", days: "ngày", hours: "giờ",
    stage: "Giai đoạn", markComplete: "Đánh dấu giai đoạn hoàn thành", goal: "Mục tiêu", why: "Vì sao quan trọng", application: "Ứng dụng",
    skill: "Kỹ năng cần học", learning: "Học", production: "Sản xuất", productionTasks: "Nhiệm vụ sản xuất", resources: "Video hướng dẫn",
    noTutorial: "Chưa có video YouTube đã xác minh phù hợp với giai đoạn này.", watchYoutube: "Xem trên YouTube", youtubeVideo: "Video YouTube", softwareVersion: "Phiên bản phần mềm",
    schedule: "Buổi làm việc đề xuất", assumptions: "Giả định", scope: "Lưu ý về phạm vi", priority: "Ưu tiên cao",
    editInput: "Sửa thông tin", regenerate: "Tạo lại", startOver: "Bắt đầu lại",
  },
};

const stageCopy = {
  en: [
    { title: "Foundation and workflow", goal: "A clear setup and production approach", why: "Removes tool friction before the important making begins.", skill: "Workspace and core workflow", tasks: ["Confirm the deliverable and technical requirements", "Set up files, folders, and the working canvas"], resource: "Beginner workflow and interface fundamentals" },
    { title: "Core technique study", goal: "Enough skill to build the first complete pass", why: "Targets only the technique the final output actually needs.", skill: "Primary production technique", tasks: ["Complete one focused tutorial", "Recreate the technique in a small practice file"], resource: "Focused technique tutorial for the selected application" },
    { title: "First complete version", goal: "A full draft from start to finish", why: "Exposes gaps while there is still time to solve them.", skill: "End-to-end production", tasks: ["Build every required section at draft quality", "Check duration, dimensions, and file requirements"], resource: "End-to-end project walkthrough" },
    { title: "Review and refinement", goal: "A coherent, presentation-ready result", why: "Focused review improves quality without expanding the scope.", skill: "Critique and refinement", tasks: ["Review against the brief", "Fix the highest-impact visual and technical issues"], resource: "Quality-control and troubleshooting guide" },
    { title: "Export and handoff", goal: "A verified final file ready to submit", why: "Export problems are easiest to fix before the last hour.", skill: "Export and delivery settings", tasks: ["Export using the required format", "Open and verify the final file on another device"], resource: "Export settings for the selected output type" },
  ],
  vi: [
    { title: "Nền tảng và quy trình", goal: "Thiết lập rõ ràng và cách sản xuất phù hợp", why: "Loại bỏ vướng mắc công cụ trước khi bắt đầu phần quan trọng.", skill: "Không gian làm việc và quy trình cốt lõi", tasks: ["Xác nhận sản phẩm và yêu cầu kỹ thuật", "Thiết lập tệp, thư mục và khung làm việc"], resource: "Kiến thức giao diện và quy trình cho người mới" },
    { title: "Học kỹ thuật cốt lõi", goal: "Đủ kỹ năng để tạo phiên bản hoàn chỉnh đầu tiên", why: "Chỉ tập trung vào kỹ thuật mà sản phẩm cuối thực sự cần.", skill: "Kỹ thuật sản xuất chính", tasks: ["Hoàn thành một hướng dẫn tập trung", "Thực hành lại kỹ thuật trong một tệp nhỏ"], resource: "Hướng dẫn kỹ thuật cho ứng dụng đã chọn" },
    { title: "Phiên bản hoàn chỉnh đầu tiên", goal: "Bản nháp đầy đủ từ đầu đến cuối", why: "Phát hiện thiếu sót khi vẫn còn thời gian xử lý.", skill: "Sản xuất toàn quy trình", tasks: ["Tạo đủ mọi phần ở chất lượng bản nháp", "Kiểm tra thời lượng, kích thước và yêu cầu tệp"], resource: "Hướng dẫn dự án từ đầu đến cuối" },
    { title: "Đánh giá và tinh chỉnh", goal: "Kết quả nhất quán, sẵn sàng trình bày", why: "Đánh giá có trọng tâm giúp tăng chất lượng mà không mở rộng phạm vi.", skill: "Phản biện và tinh chỉnh", tasks: ["Đối chiếu với đề bài", "Sửa các vấn đề hình ảnh và kỹ thuật quan trọng nhất"], resource: "Hướng dẫn kiểm soát chất lượng và xử lý lỗi" },
    { title: "Xuất tệp và bàn giao", goal: "Tệp cuối đã kiểm tra, sẵn sàng nộp", why: "Lỗi xuất tệp dễ sửa hơn trước giờ cuối.", skill: "Thiết lập xuất và bàn giao", tasks: ["Xuất đúng định dạng yêu cầu", "Mở và kiểm tra tệp cuối trên thiết bị khác"], resource: "Thiết lập xuất cho loại sản phẩm đã chọn" },
  ],
};

const tutorialsByStage = [
  [
    { id: "K7__BjW4UWE", title: "Blender 5.0 Beginner Tutorial", author: "Polygon Runway", version: "Blender 5.0", language: "English", languageVi: "Tiếng Anh", minutes: 72 },
    { id: "zNPhUvszRi4", title: "Download and Get Familiar with Blender", author: "Dstudioooo", version: "Blender 4.x–5.x", language: "Vietnamese", languageVi: "Tiếng Việt", minutes: 9 },
  ],
  [
    { id: "z-Xl9tGqH14", title: "Beginner Blender Tutorial (2026)", author: "Blender Guru", version: "Blender 5.x", language: "English", languageVi: "Tiếng Anh", minutes: 260 },
    { id: "pRnDdRzVz6k", title: "Animate a Vietnamese Flag in Blender", author: "Đình Văn Media", version: "Blender 4.x–5.x", language: "Vietnamese", languageVi: "Tiếng Việt", minutes: 11 },
  ],
  [
    { id: "KMjTLE0z80k", title: "Add Color and Basic Textures in Blender", author: "SpaceCat 3D", version: "Blender 4.x–5.x", language: "English", languageVi: "Tiếng Anh", minutes: 7 },
  ],
  [
    { id: "vamZ-hAQQnY", title: "Five Common Blender Texture Errors and Fixes", author: "Blender Player", version: "Blender 4.x–5.x", language: "Vietnamese", languageVi: "Tiếng Việt", minutes: 4 },
  ],
  [],
];

const taskCategories = ["sage", "peach", "lavender", "sky", "butter"];

let currentLanguage = "en";
const today = new Date();
today.setHours(12, 0, 0, 0);
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
let selectedDate = new Date(today);
let tasks = loadTasks();
let generatedMilestones = [];

const $ = (selector) => document.querySelector(selector);
const planningForm = $("#planning-form");
const brief = $("#projectBrief");
const experience = $("#experience");
const deadlineInput = $("#deadline");
const generateButton = planningForm.querySelector('button[type="submit"]');
const results = $("#roadmap-results");

function pad(value) { return String(value).padStart(2, "0"); }
function dateKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function dateFromKey(key) { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day, 12); }
function sameDate(first, second) { return dateKey(first) === dateKey(second); }
function locale() { return currentLanguage === "vi" ? "vi-VN" : "en-US"; }
function make(tag, className, text) { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; }
function taskCategory(task) {
  if (task.category && taskCategories.includes(task.category)) return task.category;
  const hash = [...task.title].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return taskCategories[hash % taskCategories.length];
}

function loadTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((task) => task && typeof task.title === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline)) : [];
  } catch { return []; }
}

function saveTasks() { localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks)); }

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelector(".hero").classList.toggle("hero-vi", language === "vi");
  document.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy[language][element.dataset.i18n];
    if (value) element.textContent = value;
  });
  brief.placeholder = copy[language].briefPlaceholder;
  experience.placeholder = copy[language].experiencePlaceholder;
  $("#task-title").placeholder = copy[language].taskPlaceholder;
  const tutorialOptions = $("#tutorialLanguage").options;
  tutorialOptions[0].textContent = language === "vi" ? "Tiếng Anh" : "English";
  tutorialOptions[1].textContent = language === "vi" ? "Tiếng Việt" : "Vietnamese";
  tutorialOptions[2].textContent = language === "vi" ? "Cả hai" : "Either";
  const outputLabels = language === "vi"
    ? ["Video / Hoạt hình", "Mô hình 3D", "Thiết kế đồ họa", "Bản mẫu UI/UX", "Dự án âm thanh", "Nhiếp ảnh", "Khác"]
    : ["Video / Animation", "3D asset", "Graphic design", "UI/UX prototype", "Audio project", "Photography", "Other"];
  Array.from($("#outputType").options).forEach((option, index) => { option.textContent = outputLabels[index]; });
  renderCalendar();
  renderTaskPanel();
  if (!results.hidden) {
    renderRoadmap();
    syncRoadmapMilestones();
  }
}

document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => applyLanguage(button.dataset.language)));

const defaultDeadline = new Date(today);
defaultDeadline.setDate(today.getDate() + 7);
deadlineInput.value = dateKey(defaultDeadline);
deadlineInput.min = dateKey(today);

function updateFormState() {
  $("#brief-count").textContent = `${brief.value.length.toLocaleString(locale())}/2,000`;
  const valid = brief.value.trim().length >= 30 && experience.value.trim().length > 0 && Boolean(deadlineInput.value);
  generateButton.disabled = !valid;
  generateButton.setAttribute("aria-disabled", String(!valid));
}

planningForm.addEventListener("input", updateFormState);

$("#plan-project").addEventListener("click", () => $("#project-form").scrollIntoView({ behavior: "smooth" }));

$("#load-example").addEventListener("click", () => {
  brief.value = currentLanguage === "vi"
    ? "Tôi cần tạo một video hoạt hình sản phẩm dài 20 giây cho bài tập đại học. Tôi dùng Photoshop ở mức trung cấp nhưng chưa từng dùng Blender. Bài tập hết hạn sau bảy ngày và cần xuất MP4 1080p có âm thanh đơn giản."
    : "I need to create a 20-second product animation for a university assignment. I know Photoshop at an intermediate level, but I have never used Blender. The project is due in seven days. The final output should be a 1080p MP4 with simple sound.";
  experience.value = currentLanguage === "vi" ? "Photoshop: trung cấp; Blender: hoàn toàn mới" : "Photoshop: intermediate; Blender: complete beginner";
  deadlineInput.value = dateKey(defaultDeadline);
  $("#hoursPerDay").value = "2";
  $("#daysPerWeek").value = "6";
  $("#tutorialLanguage").value = "either";
  $("#outputType").value = "video";
  $("#no-application").checked = false;
  document.querySelectorAll("#application-grid input").forEach((input) => { input.checked = input.value === "Blender"; });
  planningForm.querySelector('input[name="targetQuality"][value="basic"]').checked = true;
  updateFormState();
  $("#project-form").scrollIntoView({ behavior: "smooth" });
});

$("#no-application").addEventListener("change", (event) => {
  if (event.currentTarget.checked) document.querySelectorAll("#application-grid input").forEach((input) => { input.checked = false; });
});

document.querySelectorAll("#application-grid input").forEach((input) => input.addEventListener("change", () => {
  if (input.checked) $("#no-application").checked = false;
  if (![...document.querySelectorAll("#application-grid input")].some((item) => item.checked)) $("#no-application").checked = true;
}));

planningForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateFormState();
  if (generateButton.disabled) return;
  renderRoadmap();
  syncRoadmapMilestones();
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

function selectedApplications() {
  const checked = [...document.querySelectorAll("#application-grid input:checked")].map((input) => input.value);
  return checked.length ? checked.join(", ") : (currentLanguage === "vi" ? "Linh hoạt" : "Flexible");
}

function metricIcon(type) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("metric-icon");
  const paths = type === "calendar"
    ? ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"]
    : type === "timer"
      ? ["M10 2h4", "M12 14l3-3", "M12 6a8 8 0 1 1-8 8 8 8 0 0 1 8-8"]
      : ["M12 6v6h4", "M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2"];
  paths.forEach((data) => { const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", data); svg.append(path); });
  return svg;
}

function appendFact(list, label, value, iconType) {
  const wrap = make("div");
  const term = make("dt");
  if (iconType) term.append(metricIcon(iconType));
  term.append(document.createTextNode(label));
  wrap.append(term, make("dd", "", value));
  list.append(wrap);
}

function renderRoadmap() {
  const c = copy[currentLanguage];
  const dueDate = dateFromKey(deadlineInput.value);
  const totalDays = Math.max(1, Math.ceil((dueDate - today) / 86400000));
  const hoursPerDay = Number($("#hoursPerDay").value) || 2;
  const daysPerWeek = Number($("#daysPerWeek").value) || 5;
  const availableHours = Math.max(hoursPerDay, Math.round((totalDays / 7) * daysPerWeek * hoursPerDay));
  const stages = stageCopy[currentLanguage];
  const ratios = [.12, .32, .58, .8, 1];
  generatedMilestones = stages.map((stage, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + Math.max(1, Math.round(totalDays * ratios[index])));
    return { title: stage.title, deadline: dateKey(date > dueDate ? dueDate : date) };
  });

  results.replaceChildren();
  const hero = make("div", "results-hero");
  const heroCopy = make("div");
  const labels = make("div", "results-labels");
  labels.append(make("p", "eyebrow", c.roadmapEyebrow));
  const heading = make("h2", "", c.roadmapTitle);
  heading.id = "roadmap-title";
  const summary = make("p", "results-summary", c.roadmapSummary);
  heroCopy.append(labels, heading, summary);
  const totalCard = make("div", "total-card");
  totalCard.append(metricIcon("clock"), make("span", "", c.totalTime), make("strong", "", `${Math.min(availableHours, Math.max(8, totalDays * 2))} ${c.hours}`));
  hero.append(heroCopy, totalCard);

  const feasibility = make("section", "feasibility-card status-good");
  const feasibilityStatus = make("div", "feasibility-status");
  feasibilityStatus.append(make("span", "status-icon", "✓"));
  const feasibilityText = make("div");
  feasibilityText.append(make("span", "", c.feasibility), make("p", "", c.feasibilityBody));
  feasibilityStatus.append(feasibilityText);
  const feasibilityFacts = make("dl");
  appendFact(feasibilityFacts, c.deadlineTime, `${totalDays} ${c.days}`, "calendar");
  appendFact(feasibilityFacts, c.availableTime, `${availableHours} ${c.hours}`, "timer");
  feasibility.append(feasibilityStatus, feasibilityFacts);

  const timeline = make("div", "timeline");
  timeline.setAttribute("aria-label", c.roadmapEyebrow);
  stages.forEach((stage, index) => {
    const article = make("article", "stage-card");
    const rail = make("div", "stage-rail");
    rail.setAttribute("aria-hidden", "true");
    rail.append(make("span", "", pad(index + 1)));
    const content = make("div", "stage-content");
    const stageHeading = make("div", "stage-heading");
    const stageTitle = make("div");
    stageTitle.append(make("p", "stage-kicker", `${c.stage} ${index + 1}`), make("h3", "", stage.title));
    const completionLabel = make("label", "completion-control");
    const completionInput = make("input");
    completionInput.type = "checkbox";
    completionInput.dataset.testid = "stage-completion";
    completionLabel.append(completionInput, make("span", "", "✓"), document.createTextNode(c.markComplete));
    stageHeading.append(stageTitle, completionLabel);
    const goals = make("div", "stage-goal");
    const goal = make("div"); goal.append(make("strong", "", c.goal), make("p", "", stage.goal));
    const why = make("div"); why.append(make("strong", "", c.why), make("p", "", stage.why));
    goals.append(goal, why);
    const facts = make("dl", "stage-facts");
    appendFact(facts, c.application, selectedApplications());
    appendFact(facts, c.skill, stage.skill);
    appendFact(facts, c.learning, `${Math.max(30, Math.round(availableHours * 60 * .18 / stages.length))} min`);
    appendFact(facts, c.production, `${Math.max(45, Math.round(availableHours * 60 * .66 / stages.length))} min`);
    const lower = make("div", "stage-lower");
    const taskBlock = make("div");
    taskBlock.append(make("h4", "", c.productionTasks));
    const taskList = make("ul", "task-list");
    stage.tasks.forEach((task) => taskList.append(make("li", "", task)));
    taskBlock.append(taskList);
    const tutorialList = make("div", "tutorial-list");
    tutorialList.append(make("h4", "", c.resources));
    const stageTutorials = tutorialsByStage[index];
    if (!stageTutorials.length) {
      tutorialList.append(make("p", "tutorial-empty", c.noTutorial));
    }
    stageTutorials.forEach((tutorial) => {
      const url = `https://www.youtube.com/watch?v=${tutorial.id}`;
      const tutorialCard = make("article", "tutorial-card");
      const thumbnail = make("a", "tutorial-thumbnail");
      thumbnail.href = url;
      thumbnail.target = "_blank";
      thumbnail.rel = "noreferrer";
      thumbnail.setAttribute("aria-label", `${c.watchYoutube}: ${tutorial.title}`);
      thumbnail.style.backgroundImage = `url("https://i.ytimg.com/vi/${tutorial.id}/hqdefault.jpg")`;
      const topLine = make("div", "tutorial-topline");
      topLine.append(make("span", "source-badge badge-youtube", c.youtubeVideo));
      const details = make("dl");
      appendFact(details, c.application, "Blender");
      appendFact(details, c.softwareVersion, tutorial.version);
      appendFact(details, c.tutorialLanguage, currentLanguage === "vi" ? tutorial.languageVi : tutorial.language);
      appendFact(details, "", `${tutorial.minutes} ${currentLanguage === "vi" ? "phút" : "min"}`, "clock");
      const watchLink = make("a", "tutorial-link");
      watchLink.href = url;
      watchLink.target = "_blank";
      watchLink.rel = "noreferrer";
      watchLink.append(document.createTextNode(c.watchYoutube), make("span", "tutorial-link-icon", "↗"));
      tutorialCard.append(thumbnail, topLine, make("h5", "", tutorial.title), make("p", "", tutorial.author), details, watchLink);
      tutorialList.append(tutorialCard);
    });
    lower.append(taskBlock, tutorialList);
    content.append(stageHeading, goals, facts, lower);
    article.append(rail, content);
    timeline.append(article);
  });

  const resultsGrid = make("div", "results-grid");
  const schedule = make("section", "schedule-card");
  schedule.append(make("h3", "", c.schedule));
  const scheduleList = make("ol");
  generatedMilestones.forEach((milestone, index) => {
    const item = make("li");
    item.append(make("span", "", stages[index].title), make("strong", "", new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(dateFromKey(milestone.deadline))), make("small", "", c.priority));
    scheduleList.append(item);
  });
  schedule.append(scheduleList);
  const notesColumn = make("div", "notes-column");
  const assumptions = make("section", "note-card"); assumptions.append(make("h3", "", c.assumptions));
  const assumptionsList = make("ul");
  [currentLanguage === "vi" ? "Phạm vi dự án giữ nguyên sau khi tạo lộ trình." : "The project scope stays fixed after the roadmap is generated.", currentLanguage === "vi" ? "Mỗi buổi học tạo ra một đầu ra cụ thể." : "Every learning session produces a concrete output."].forEach((text) => assumptionsList.append(make("li", "", text)));
  assumptions.append(assumptionsList);
  const scope = make("section", "note-card warning-card"); scope.append(make("h3", "", c.scope));
  const scopeList = make("ul");
  [currentLanguage === "vi" ? "Bảo vệ thời gian xuất và kiểm tra tệp cuối." : "Protect time for export and final-file verification.", currentLanguage === "vi" ? "Không thêm kỹ thuật mới sau giai đoạn bản nháp." : "Avoid adding new techniques after the draft stage."].forEach((text) => scopeList.append(make("li", "", text)));
  scope.append(scopeList); notesColumn.append(assumptions, scope); resultsGrid.append(schedule, notesColumn);

  const actions = make("div", "results-actions");
  const editButton = make("button", "button button-secondary", `← ${c.editInput}`); editButton.type = "button";
  editButton.addEventListener("click", () => $("#project-form").scrollIntoView({ behavior: "smooth" }));
  const regenerateButton = make("button", "button button-secondary", `↻ ${c.regenerate}`); regenerateButton.type = "button";
  regenerateButton.addEventListener("click", () => { renderRoadmap(); syncRoadmapMilestones(); });
  const resetButton = make("button", "button button-text", `× ${c.startOver}`); resetButton.type = "button";
  resetButton.addEventListener("click", resetPlanning);
  actions.append(editButton, regenerateButton, resetButton);
  results.append(hero, feasibility, timeline, resultsGrid, actions);
}

function resetPlanning() {
  planningForm.reset();
  brief.value = "";
  experience.value = "";
  deadlineInput.value = dateKey(defaultDeadline);
  $("#no-application").checked = true;
  results.hidden = true;
  results.replaceChildren();
  generatedMilestones = [];
  tasks = tasks.filter((task) => task.source !== "roadmap");
  saveTasks();
  renderCalendar();
  renderTaskPanel();
  updateFormState();
  $("#project-form").scrollIntoView({ behavior: "smooth" });
}

function syncRoadmapMilestones() {
  const knownStageTitles = new Set([...stageCopy.en, ...stageCopy.vi].map((stage) => stage.title));
  tasks = tasks.filter((task) => task.source !== "roadmap" && !knownStageTitles.has(task.title));
  generatedMilestones.forEach((milestone, index) => {
    tasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${Math.random()}`,
      title: milestone.title,
      deadline: milestone.deadline,
      category: taskCategories[index % taskCategories.length],
      source: "roadmap",
      done: false,
      createdAt: new Date().toISOString(),
    });
  });
  saveTasks();
  renderCalendar();
  renderTaskPanel();
}

const monthTitle = $("#month-title");
const todayLabel = $("#today-label");
const calendarGrid = $("#calendar-grid");
const taskPanelTitle = $("#task-panel-title");
const taskCount = $("#task-count");
const taskListPanel = $("#task-list");
const taskForm = $("#task-form");
const taskTitleInput = $("#task-title");
const taskDeadlineInput = $("#task-deadline");

function longDate(date) { return new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date); }

function renderCalendar() {
  const c = copy[currentLanguage];
  monthTitle.textContent = new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }).format(visibleMonth);
  todayLabel.textContent = `${c.today} · ${new Intl.DateTimeFormat(locale(), { weekday: "short", day: "numeric", month: "short" }).format(today)}`;
  const weekdayNames = currentLanguage === "vi" ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  $("#weekday-row").replaceChildren(...weekdayNames.map((name) => make("span", "", name)));
  calendarGrid.replaceChildren();
  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first); start.setDate(first.getDate() - offset);
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start); day.setDate(start.getDate() + index);
    const key = dateKey(day);
    const dayTasks = tasks.filter((task) => task.deadline === key);
    const button = make("button", "calendar-day");
    button.type = "button"; button.dataset.date = key; button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${longDate(day)}${dayTasks.length ? `, ${dayTasks.length} ${currentLanguage === "vi" ? "công việc" : "task"}` : ""}`);
    if (day.getMonth() !== visibleMonth.getMonth()) button.classList.add("is-outside");
    if (sameDate(day, today)) { button.classList.add("is-today"); button.setAttribute("aria-current", "date"); }
    if (sameDate(day, selectedDate)) button.classList.add("is-selected");
    button.append(make("span", "day-number", String(day.getDate())));
    if (dayTasks.length) {
      const wrap = make("span", "day-tasks");
      dayTasks.slice(0, 2).forEach((task) => wrap.append(make("span", `day-task task-color-${taskCategory(task)}${task.done ? " is-done" : ""}`, task.title)));
      if (dayTasks.length > 2) wrap.append(make("span", "more-tasks", `+${dayTasks.length - 2}`));
      button.append(wrap);
    }
    button.addEventListener("click", () => {
      selectedDate = day;
      if (day.getMonth() !== visibleMonth.getMonth() || day.getFullYear() !== visibleMonth.getFullYear()) visibleMonth = new Date(day.getFullYear(), day.getMonth(), 1, 12);
      renderCalendar(); renderTaskPanel();
    });
    calendarGrid.append(button);
  }
}

function renderTaskPanel() {
  const c = copy[currentLanguage];
  const key = dateKey(selectedDate);
  const selectedTasks = tasks.filter((task) => task.deadline === key);
  taskPanelTitle.textContent = new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long" }).format(selectedDate);
  taskCount.textContent = selectedTasks.length ? `${selectedTasks.filter((task) => task.done).length} ${c.of} ${selectedTasks.length} ${c.complete}` : c.clearDay;
  taskDeadlineInput.value = key;
  taskListPanel.replaceChildren();
  if (!selectedTasks.length) { taskListPanel.append(make("p", "empty-tasks", c.emptyTasks)); return; }
  selectedTasks.forEach((task) => {
    const item = make("article", `task-item task-color-${taskCategory(task)}${task.done ? " is-done" : ""}`);
    const checkbox = make("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(task.done);
    checkbox.setAttribute("aria-label", `${task.title}: ${c.complete}`);
    checkbox.addEventListener("change", () => { task.done = checkbox.checked; saveTasks(); renderCalendar(); renderTaskPanel(); });
    const taskCopy = make("div", "task-copy");
    taskCopy.append(make("strong", "", task.title), make("small", "", `${copy[currentLanguage].deadlineLabel}: ${new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(dateFromKey(task.deadline))}`));
    const remove = make("button", "delete-task", "×"); remove.type = "button"; remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => { tasks = tasks.filter((candidate) => candidate.id !== task.id); saveTasks(); renderCalendar(); renderTaskPanel(); });
    item.append(checkbox, taskCopy, remove); taskListPanel.append(item);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim(); const deadline = taskDeadlineInput.value;
  if (!title || !deadline) return;
  const category = taskCategories[tasks.filter((task) => task.source !== "roadmap").length % taskCategories.length];
  tasks.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, deadline, category, done: false, createdAt: new Date().toISOString() });
  saveTasks(); selectedDate = dateFromKey(deadline); visibleMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12); taskTitleInput.value = "";
  renderCalendar(); renderTaskPanel(); taskTitleInput.focus();
});

$("#prev-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1, 12); renderCalendar(); });
$("#next-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1, 12); renderCalendar(); });
$("#go-today").addEventListener("click", () => { selectedDate = new Date(today); visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12); renderCalendar(); renderTaskPanel(); });

applyLanguage("en");
updateFormState();
