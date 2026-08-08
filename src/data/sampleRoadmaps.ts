import {
  calculateAvailableMinutes,
  getDaysRemaining,
  getFeasibilityMessage,
  getFeasibilityStatus,
} from "@/src/lib/feasibility";
import type {
  Locale,
  RoadmapRequest,
  RoadmapResponse,
  RoadmapStage,
} from "@/src/types";
import { fillTutorialIds } from "@/src/lib/tutorialMatcher";
import { applicationById } from "@/src/data/applications";

type SampleKind = "blender" | "figma" | "davinci" | "generic";

const stages: Record<Exclude<SampleKind, "generic">, Record<Locale, RoadmapStage[]>> = {
  blender: {
    en: [
      stage("brief", 1, "Lock the story and deliverable", "Define the product, message, and 20-second shot list.", "A short plan prevents expensive changes after modelling starts.", null, "Reference selection and shot planning", ["Write a one-sentence product message", "Collect 6–10 visual references", "Sketch a three-shot sequence"], 30, 60),
      stage("basics", 2, "Learn Blender essentials", "Navigate, transform objects, and manage a simple scene.", "Basic fluency makes every later production step faster.", "blender", "Viewport navigation and object transforms", ["Complete a focused navigation exercise", "Practise move, rotate, scale, and duplicate", "Save a clean starter scene"], 90, 45, ["brief"]),
      stage("model", 3, "Model the product", "Build a recognisable product using clean, simple geometry.", "The model is the visual foundation for lighting and animation.", "blender", "Hard-surface modelling with simple geometry", ["Block the main silhouette", "Add secondary details", "Check proportions from camera view"], 75, 180, ["basics"]),
      stage("materials", 4, "Create materials", "Give the product clear surfaces and brand colours.", "Material contrast helps the product read quickly on screen.", "blender", "Principled materials and basic texture setup", ["Create 2–4 reusable materials", "Apply label or logo artwork", "Test roughness under neutral light"], 60, 120, ["model"]),
      stage("camera", 5, "Light and frame the scene", "Create a simple studio setup and final camera angles.", "Good framing and light can make simple geometry feel intentional.", "blender", "Three-point lighting and camera composition", ["Set a 1080p camera", "Build a key, fill, and rim setup", "Save one approved look frame"], 60, 120, ["materials"]),
      stage("animate", 6, "Animate the product", "Build a readable 20-second product and camera movement.", "Timing turns still assets into a coherent visual story.", "blender", "Keyframes, easing, and camera animation", ["Block key poses first", "Refine easing in the graph editor", "Create a low-resolution preview"], 75, 180, ["camera"]),
      stage("render", 7, "Render safely", "Export an image sequence with practical quality settings.", "An image sequence is easier to recover if rendering is interrupted.", "blender", "Render settings and image-sequence workflow", ["Run a five-frame render test", "Choose a feasible sample count", "Render numbered PNG frames"], 35, 120, ["animate"]),
      stage("finish", 8, "Add sound and export", "Edit the sequence, add simple audio, and deliver a 1080p MP4.", "A final edit makes timing, sound, and submission settings consistent.", "davinci-resolve", "Timeline editing and H.264 delivery", ["Import the image sequence", "Add permitted music or sound effects", "Export and watch the final MP4 end to end"], 45, 120, ["render"]),
    ],
    vi: [
      stage("brief", 1, "Chốt câu chuyện và đầu ra", "Xác định sản phẩm, thông điệp và danh sách cảnh cho video 20 giây.", "Kế hoạch ngắn giúp tránh thay đổi tốn thời gian sau khi bắt đầu dựng hình.", null, "Chọn tham chiếu và lập kế hoạch cảnh", ["Viết thông điệp sản phẩm trong một câu", "Thu thập 6–10 hình tham chiếu", "Phác thảo chuỗi ba cảnh"], 30, 60),
      stage("basics", 2, "Học nền tảng Blender", "Di chuyển trong khung nhìn 3D, biến đổi vật thể và quản lý một cảnh đơn giản.", "Thao tác cơ bản thành thạo giúp mọi bước sau nhanh hơn.", "blender", "Điều hướng khung nhìn và biến đổi vật thể", ["Hoàn thành bài tập điều hướng ngắn", "Luyện di chuyển, xoay, thu phóng và nhân bản", "Lưu cảnh khởi đầu gọn gàng"], 90, 45, ["brief"]),
      stage("model", 3, "Dựng mô hình sản phẩm", "Tạo sản phẩm dễ nhận biết bằng hình khối đơn giản, gọn gàng.", "Mô hình là nền tảng hình ảnh cho ánh sáng và chuyển động.", "blender", "Dựng bề mặt cứng bằng hình học đơn giản", ["Chặn hình khối chính", "Thêm chi tiết phụ", "Kiểm tra tỷ lệ từ góc máy quay"], 75, 180, ["basics"]),
      stage("materials", 4, "Tạo vật liệu", "Thiết lập bề mặt rõ ràng và màu thương hiệu cho sản phẩm.", "Độ tương phản vật liệu giúp sản phẩm dễ nhìn trong thời gian ngắn.", "blender", "Vật liệu Principled và họa tiết cơ bản", ["Tạo 2–4 vật liệu có thể tái sử dụng", "Áp nhãn hoặc logo", "Kiểm tra độ nhám dưới ánh sáng trung tính"], 60, 120, ["model"]),
      stage("camera", 5, "Thiết lập ánh sáng và khung hình", "Tạo không gian chụp đơn giản và chốt góc máy quay.", "Khung hình và ánh sáng tốt giúp hình khối đơn giản trông có chủ đích.", "blender", "Ánh sáng ba điểm và bố cục máy quay", ["Đặt máy quay ở độ phân giải 1080p", "Tạo đèn chính, đèn phụ và đèn viền", "Lưu một khung hình mẫu đã duyệt"], 60, 120, ["materials"]),
      stage("animate", 6, "Tạo chuyển động cho sản phẩm", "Tạo chuyển động sản phẩm và máy quay rõ ràng trong 20 giây.", "Nhịp chuyển động biến hình ảnh tĩnh thành câu chuyện mạch lạc.", "blender", "Khung hình chính, độ mượt và chuyển động máy quay", ["Chặn các tư thế chính trước", "Tinh chỉnh độ mượt trong Trình chỉnh đồ thị", "Tạo bản xem trước độ phân giải thấp"], 75, 180, ["camera"]),
      stage("render", 7, "Kết xuất an toàn", "Xuất chuỗi ảnh với thiết lập chất lượng phù hợp.", "Chuỗi ảnh dễ phục hồi hơn nếu quá trình kết xuất bị gián đoạn.", "blender", "Thiết lập kết xuất và quy trình chuỗi ảnh", ["Kết xuất thử năm khung hình", "Chọn số mẫu phù hợp", "Kết xuất chuỗi PNG có đánh số"], 35, 120, ["animate"]),
      stage("finish", 8, "Thêm âm thanh và xuất tệp", "Dựng chuỗi ảnh, thêm âm thanh đơn giản và xuất MP4 1080p.", "Bước dựng cuối thống nhất nhịp, âm thanh và cài đặt nộp bài.", "davinci-resolve", "Dựng trên dòng thời gian và xuất H.264", ["Nhập chuỗi ảnh", "Thêm nhạc hoặc hiệu ứng âm thanh được phép", "Xuất và xem lại toàn bộ MP4"], 45, 120, ["render"]),
    ],
  },
  figma: {
    en: [
      stage("scope", 1, "Define the prototype scope", "Choose one core user journey and success criterion.", "A narrow journey keeps the prototype testable and achievable.", "figma", "User-flow scoping", ["Write the user goal", "Map 5–7 key screens", "List required content"], 35, 60),
      stage("wireframe", 2, "Wireframe the core flow", "Create low-fidelity layouts for every key screen.", "Wireframes reveal flow problems before visual polish.", "figma", "Frames, auto layout, and low-fidelity UI", ["Build mobile frames", "Place content hierarchy", "Connect the first click-through"], 75, 150, ["scope"]),
      stage("system", 3, "Create a small UI system", "Define reusable type, colour, spacing, and controls.", "A compact system makes the interface consistent without over-designing.", "figma", "Components, styles, and variants", ["Create type and colour styles", "Build button and input components", "Check colour contrast"], 90, 150, ["wireframe"]),
      stage("polish", 4, "Design final screens", "Apply the visual system to the complete core journey.", "High-fidelity screens make feedback more specific and useful.", "figma", "Responsive layout and visual hierarchy", ["Finish all core screens", "Use realistic content", "Review spacing and states"], 45, 180, ["system"]),
      stage("prototype", 5, "Build and test the prototype", "Create interactions, test the flow, and prepare a share link.", "A tested prototype demonstrates the experience rather than isolated screens.", "figma", "Prototype interactions and usability checks", ["Add navigation and overlays", "Run two task-based tests", "Fix blockers and present the final flow"], 60, 150, ["polish"]),
    ],
    vi: [
      stage("scope", 1, "Xác định phạm vi bản mẫu", "Chọn một hành trình người dùng cốt lõi và tiêu chí thành công.", "Hành trình gọn giúp bản mẫu dễ kiểm thử và khả thi.", "figma", "Thu gọn luồng người dùng", ["Viết mục tiêu người dùng", "Lập sơ đồ 5–7 màn hình chính", "Liệt kê nội dung bắt buộc"], 35, 60),
      stage("wireframe", 2, "Tạo sơ đồ khung cho luồng chính", "Dựng bố cục độ chi tiết thấp cho mọi màn hình quan trọng.", "Sơ đồ khung giúp phát hiện vấn đề về luồng trước khi trau chuốt hình ảnh.", "figma", "Khung, Auto Layout và giao diện độ chi tiết thấp", ["Tạo khung màn hình di động", "Sắp xếp thứ bậc nội dung", "Nối luồng bấm thử đầu tiên"], 75, 150, ["scope"]),
      stage("system", 3, "Tạo hệ thống giao diện nhỏ", "Xác định hệ chữ, màu sắc, khoảng cách và các điều khiển có thể tái sử dụng.", "Hệ thống gọn giúp giao diện nhất quán mà không thiết kế quá mức.", "figma", "Thành phần, kiểu và biến thể", ["Tạo kiểu chữ và màu", "Dựng thành phần nút và trường nhập", "Kiểm tra độ tương phản màu"], 90, 150, ["wireframe"]),
      stage("polish", 4, "Thiết kế màn hình hoàn chỉnh", "Áp dụng hệ thống hình ảnh cho toàn bộ hành trình chính.", "Màn hình độ chi tiết cao giúp phản hồi cụ thể và hữu ích hơn.", "figma", "Bố cục thích ứng và thứ bậc hình ảnh", ["Hoàn thiện các màn hình chính", "Dùng nội dung thực tế", "Kiểm tra khoảng cách và trạng thái"], 45, 180, ["system"]),
      stage("prototype", 5, "Tạo và kiểm thử bản mẫu", "Thêm tương tác, kiểm thử luồng và chuẩn bị liên kết chia sẻ.", "Bản mẫu đã kiểm thử thể hiện trải nghiệm thay vì các màn hình rời rạc.", "figma", "Tương tác bản mẫu và kiểm tra khả năng sử dụng", ["Thêm điều hướng và lớp phủ", "Chạy hai bài kiểm thử theo nhiệm vụ", "Sửa điểm nghẽn và trình bày luồng cuối"], 60, 150, ["polish"]),
    ],
  },
  davinci: {
    en: [
      stage("organise", 1, "Organise footage and story", "Audit clips and build a simple beginning, middle, and end.", "Good organisation protects editing time and story clarity.", "davinci-resolve", "Media organisation and selects", ["Back up original files", "Create labelled bins", "Mark the strongest moments"], 35, 75),
      stage("rough", 2, "Build the rough cut", "Create a complete, watchable version without polishing.", "A full rough cut reveals pacing and missing material early.", "davinci-resolve", "Timeline editing and trimming", ["Assemble the story", "Trim pauses and repetition", "Add temporary music"], 60, 180, ["organise"]),
      stage("sound", 3, "Clean dialogue and sound", "Make speech clear and balance the main audio elements.", "Viewers forgive imperfect images sooner than unclear audio.", "davinci-resolve", "Audio levels, fades, and basic cleanup", ["Set consistent dialogue levels", "Remove distracting noise where possible", "Add fades and room tone"], 60, 120, ["rough"]),
      stage("colour", 4, "Correct colour and titles", "Balance shots and add restrained titles.", "Consistency creates a finished look without unnecessary effects.", "davinci-resolve", "Primary colour correction and titles", ["Balance exposure and white balance", "Match adjacent shots", "Add readable opening and closing titles"], 75, 135, ["rough"]),
      stage("deliver", 5, "Review and export", "Run a quality check and export the required delivery file.", "A deliberate review catches technical errors before submission.", "davinci-resolve", "Delivery settings and quality control", ["Watch the full timeline", "Check spelling and audio peaks", "Export H.264 and verify the file"], 30, 75, ["sound", "colour"]),
    ],
    vi: [
      stage("organise", 1, "Sắp xếp cảnh quay và câu chuyện", "Kiểm tra các đoạn phim và dựng cấu trúc mở đầu, phát triển, kết thúc đơn giản.", "Tổ chức tốt giúp bảo vệ thời gian dựng và độ rõ của câu chuyện.", "davinci-resolve", "Quản lý tư liệu và chọn cảnh quay", ["Sao lưu tệp gốc", "Tạo thư mục có nhãn rõ ràng", "Đánh dấu những khoảnh khắc tốt nhất"], 35, 75),
      stage("rough", 2, "Dựng bản nháp", "Tạo phiên bản hoàn chỉnh có thể xem trước khi trau chuốt.", "Bản dựng nháp đầy đủ cho thấy sớm vấn đề về nhịp và nội dung còn thiếu.", "davinci-resolve", "Dựng trên dòng thời gian và cắt chỉnh", ["Ghép câu chuyện", "Cắt khoảng dừng và phần lặp", "Thêm nhạc tạm"], 60, 180, ["organise"]),
      stage("sound", 3, "Làm sạch thoại và âm thanh", "Làm thoại rõ và cân bằng các thành phần âm thanh chính.", "Người xem thường chấp nhận hình chưa hoàn hảo hơn là âm thanh khó nghe.", "davinci-resolve", "Mức âm lượng, chuyển âm và làm sạch cơ bản", ["Đặt mức thoại nhất quán", "Giảm tiếng ồn gây xao nhãng khi có thể", "Thêm chuyển âm và âm nền phòng"], 60, 120, ["rough"]),
      stage("colour", 4, "Chỉnh màu và chữ tiêu đề", "Cân bằng các cảnh và thêm chữ tiêu đề vừa phải.", "Sự nhất quán tạo cảm giác hoàn thiện mà không cần hiệu ứng thừa.", "davinci-resolve", "Chỉnh màu cơ bản và chữ tiêu đề", ["Cân bằng độ phơi sáng và cân bằng trắng", "Cân khớp các cảnh liền kề", "Thêm chữ mở đầu và kết thúc dễ đọc"], 75, 135, ["rough"]),
      stage("deliver", 5, "Kiểm tra và xuất tệp", "Rà soát chất lượng và xuất đúng định dạng yêu cầu.", "Kiểm tra có chủ đích giúp phát hiện lỗi kỹ thuật trước khi nộp.", "davinci-resolve", "Cài đặt xuất và kiểm soát chất lượng", ["Xem toàn bộ dòng thời gian", "Kiểm tra chính tả và đỉnh âm thanh", "Xuất H.264 và kiểm tra tệp"], 30, 75, ["sound", "colour"]),
    ],
  },
};

function stage(
  id: string,
  order: number,
  title: string,
  goal: string,
  why: string,
  applicationId: string | null,
  skillToLearn: string,
  tasks: string[],
  learningMinutes: number,
  productionMinutes: number,
  dependsOnStageIds: string[] = [],
): RoadmapStage {
  return {
    id,
    order,
    title,
    goal,
    why,
    applicationId,
    skillToLearn,
    tasks,
    learningMinutes,
    productionMinutes,
    dependsOnStageIds,
    tutorialIds: [],
  };
}

function fallbackApplicationIds(request: RoadmapRequest): string[] {
  const selected = request.requiredApplications.filter((id) => applicationById[id]);
  if (selected.length > 0) return [...new Set(selected)].slice(0, 5);

  const inferredByOutput: Partial<Record<RoadmapRequest["outputType"], string>> = {
    video: "davinci-resolve",
    "3d": "blender",
    graphic: "illustrator",
    uiux: "figma",
    audio: "audacity",
    photo: "photoshop",
  };
  const inferred = inferredByOutput[request.outputType];
  return inferred ? [inferred] : ["photoshop"];
}

function createGenericStages(
  request: RoadmapRequest,
  locale: Locale,
): RoadmapStage[] {
  const applicationIds = fallbackApplicationIds(request);
  const firstApplication = applicationById[applicationIds[0]];
  const lastApplication = applicationById[applicationIds.at(-1)!];
  const result: RoadmapStage[] = [];

  const addStage = (
    id: string,
    title: string,
    goal: string,
    why: string,
    applicationId: string,
    skill: string,
    tasks: string[],
    learningMinutes: number,
    productionMinutes: number,
  ) => {
    result.push(
      stage(
        id,
        result.length + 1,
        title,
        goal,
        why,
        applicationId,
        skill,
        tasks,
        learningMinutes,
        productionMinutes,
        result.length > 0 ? [result[result.length - 1].id] : [],
      ),
    );
  };

  if (locale === "vi") {
    addStage(
      "scope",
      "Chốt phạm vi và thiết lập dự án",
      `Chuyển đề bài thành danh sách đầu ra rõ ràng và tạo tệp làm việc trong ${firstApplication.name}.`,
      "Phạm vi rõ ràng giúp tránh học hoặc làm những phần không cần thiết.",
      firstApplication.id,
      `Không gian làm việc và thiết lập tệp trong ${firstApplication.name}`,
      [
        "Liệt kê tiêu chí bắt buộc của sản phẩm cuối",
        "Thu thập tài liệu tham chiếu phù hợp",
        "Tạo cấu trúc tệp và quy ước đặt tên",
      ],
      45,
      60,
    );

    applicationIds.forEach((applicationId) => {
      const application = applicationById[applicationId];
      addStage(
        `build-${application.id}`,
        `Tạo phần chính bằng ${application.name}`,
        `Hoàn thành một bản nháp đầy đủ bằng ${application.name} để có thể xem và góp ý.`,
        "Bản nháp hoàn chỉnh giúp phát hiện vấn đề sớm hơn so với trau chuốt từng chi tiết riêng lẻ.",
        application.id,
        application.commonUses.slice(0, 2).join(" và "),
        [
          "Làm phần quan trọng nhất trước",
          "Giữ cấu trúc có thể chỉnh sửa và không phá hủy",
          "Xuất một bản xem thử để kiểm tra",
        ],
        75,
        180,
      );
    });

    addStage(
      "refine",
      "Tinh chỉnh và kiểm tra chất lượng",
      "Sửa các vấn đề ảnh hưởng trực tiếp đến độ rõ ràng, tính nhất quán và yêu cầu bài nộp.",
      "Một lượt kiểm tra có thứ tự giúp dùng thời gian còn lại cho thay đổi có tác động lớn nhất.",
      lastApplication.id,
      `Kiểm tra chất lượng trong ${lastApplication.name}`,
      [
        "So sánh bản nháp với tiêu chí bắt buộc",
        "Sửa ba vấn đề có tác động lớn nhất",
        "Kiểm tra lại kích thước, màu sắc, âm thanh hoặc chuyển động liên quan",
      ],
      45,
      120,
    );
    addStage(
      "deliver",
      "Xuất tệp và xác minh bài nộp",
      "Tạo tệp cuối đúng định dạng và kiểm tra trên một thiết bị hoặc ứng dụng khác.",
      "Lỗi xuất tệp dễ xử lý hơn khi vẫn còn thời gian trước hạn chót.",
      lastApplication.id,
      `Thiết lập xuất và bàn giao trong ${lastApplication.name}`,
      [
        "Xuất đúng định dạng và độ phân giải yêu cầu",
        "Mở và xem toàn bộ tệp đã xuất",
        "Lưu bản nguồn cùng một bản sao dự phòng",
      ],
      30,
      75,
    );
  } else {
    addStage(
      "scope",
      "Lock the scope and set up the project",
      `Turn the brief into a concrete delivery checklist and create the working file in ${firstApplication.name}.`,
      "A clear scope prevents time being spent on techniques the final submission does not need.",
      firstApplication.id,
      `${firstApplication.name} workspace and file setup`,
      [
        "List the non-negotiable delivery criteria",
        "Collect focused references",
        "Create a clean file structure and naming convention",
      ],
      45,
      60,
    );

    applicationIds.forEach((applicationId) => {
      const application = applicationById[applicationId];
      addStage(
        `build-${application.id}`,
        `Build the core work in ${application.name}`,
        `Complete a reviewable first draft in ${application.name}.`,
        "A complete draft reveals workflow problems earlier than polishing isolated details.",
        application.id,
        application.commonUses.slice(0, 2).join(" and "),
        [
          "Build the highest-priority part first",
          "Keep the source structured and editable",
          "Export a quick review version",
        ],
        75,
        180,
      );
    });

    addStage(
      "refine",
      "Refine and quality-check the draft",
      "Fix the issues that most affect clarity, consistency, and the submission criteria.",
      "A ranked review keeps the remaining time focused on high-impact improvements.",
      lastApplication.id,
      `Quality review in ${lastApplication.name}`,
      [
        "Compare the draft with every required criterion",
        "Fix the three highest-impact issues",
        "Recheck the relevant dimensions, colour, sound, or motion",
      ],
      45,
      120,
    );
    addStage(
      "deliver",
      "Export and verify the submission",
      "Create the required final file and verify it in another application or device.",
      "Export problems are easiest to fix while time remains before the deadline.",
      lastApplication.id,
      `Export and delivery settings in ${lastApplication.name}`,
      [
        "Export the required format and resolution",
        "Open and review the complete exported file",
        "Keep the source file and one backup copy",
      ],
      30,
      75,
    );
  }

  return result;
}

function sampleKindFor(request: RoadmapRequest): SampleKind {
  const text = `${request.projectBrief} ${request.requiredApplications.join(" ")}`.toLowerCase();
  if (request.requiredApplications.length > 0) {
    const selected = new Set(request.requiredApplications);
    if (selected.size === 1 && selected.has("figma")) return "figma";
    if (selected.size === 1 && selected.has("davinci-resolve")) return "davinci";
    if (selected.size === 1 && selected.has("blender")) return "blender";
    return "generic";
  }
  if (text.includes("figma") || request.outputType === "uiux") return "figma";
  if (
    text.includes("davinci") ||
    text.includes("short video") ||
    text.includes("video ngắn")
  ) {
    return "davinci";
  }
  if (text.includes("blender") || request.outputType === "3d") return "blender";
  return "generic";
}

export function createSampleRoadmap(request: RoadmapRequest): RoadmapResponse {
  const kind = sampleKindFor(request);
  const locale = request.interfaceLanguage;
  const allowedApplications = new Set(request.requiredApplications);
  const sourceStages =
    kind === "generic" ? createGenericStages(request, locale) : stages[kind][locale];
  const selectedStages = sourceStages.map((item) => {
    const normalizedItem =
      allowedApplications.size > 0 &&
      item.applicationId &&
      !allowedApplications.has(item.applicationId)
        ? { ...item, applicationId: null, tutorialIds: [] }
        : item;
    return {
      ...normalizedItem,
      tutorialIds: fillTutorialIds(normalizedItem, request.tutorialLanguage),
    };
  });
  const total = selectedStages.reduce(
    (sum, item) => sum + item.learningMinutes + item.productionMinutes,
    0,
  );
  const available = calculateAvailableMinutes(
    request.deadline,
    request.hoursPerDay,
    request.daysPerWeek,
  );
  const status = getFeasibilityStatus(total, available);
  const titles = {
    en: {
      blender: "20-second product animation roadmap",
      figma: "Mobile app prototype roadmap",
      davinci: "Short video editing roadmap",
      generic: `${applicationById[fallbackApplicationIds(request)[0]].name} project roadmap`,
    },
    vi: {
      blender: "Lộ trình làm hoạt hình sản phẩm 20 giây",
      figma: "Lộ trình làm bản mẫu ứng dụng di động",
      davinci: "Lộ trình dựng video ngắn",
      generic: `Lộ trình dự án với ${applicationById[fallbackApplicationIds(request)[0]].name}`,
    },
  };
  const summaries = {
    en: {
      blender:
        "A focused path from references and Blender basics through modelling, animation, rendering, and final sound—scoped for a convincing university submission.",
      figma:
        "A compact product-design workflow that prioritises one testable user journey, a reusable UI system, and a polished interactive prototype.",
      davinci:
        "A story-first editing plan that moves from organised selects to a complete rough cut, clean sound, consistent colour, and a verified export.",
      generic:
        "A practical path from project setup to a complete draft, focused refinement, and a verified final delivery in the selected application.",
    },
    vi: {
      blender:
        "Lộ trình tập trung từ tham chiếu và nền tảng Blender đến dựng hình, tạo chuyển động, kết xuất và hoàn thiện âm thanh—với phạm vi phù hợp cho bài nộp đại học.",
      figma:
        "Quy trình thiết kế sản phẩm gọn, ưu tiên một hành trình người dùng có thể kiểm thử, hệ thống giao diện tái sử dụng và bản mẫu tương tác chỉn chu.",
      davinci:
        "Kế hoạch dựng ưu tiên câu chuyện, đi từ việc sắp xếp cảnh quay đến bản dựng nháp hoàn chỉnh, âm thanh rõ, màu nhất quán và tệp xuất đã kiểm tra.",
      generic:
        "Lộ trình thực tế từ thiết lập dự án đến bản nháp hoàn chỉnh, tinh chỉnh có trọng tâm và tệp cuối đã được xác minh trong ứng dụng đã chọn.",
    },
  };
  const assumptions = {
    en: [
      "You can use a computer capable of running the recommended application.",
      "Time estimates include focused practice but not long breaks or feedback delays.",
    ],
    vi: [
      "Bạn có máy tính chạy được ứng dụng được đề xuất.",
      "Ước tính thời gian gồm thời gian luyện tập tập trung, không gồm nghỉ dài hoặc chờ phản hồi.",
    ],
  };
  const warnings =
    status === "unrealistic"
      ? locale === "en"
        ? [
            "Use simpler assets, remove advanced effects, and produce a draft-quality render first.",
          ]
        : [
            "Hãy dùng tài sản đơn giản hơn, bỏ hiệu ứng nâng cao và ưu tiên kết xuất chất lượng nháp trước.",
          ]
      : request.requiredApplications.length > 5
        ? locale === "en"
          ? ["The fallback plan focuses on the first five selected applications so it can stay within eight concrete stages."]
          : ["Lộ trình dự phòng tập trung vào năm ứng dụng đầu tiên để giữ kế hoạch trong tối đa tám giai đoạn cụ thể."]
        : [];

  const plannedPerItem = Math.ceil(total / Math.min(getDaysRemaining(request.deadline), 7));
  return {
    id: `demo-${kind}`,
    language: locale,
    title: titles[locale][kind],
    summary: summaries[locale][kind],
    feasibility: {
      status,
      message: getFeasibilityMessage(status, locale),
      daysRemaining: getDaysRemaining(request.deadline),
      availableMinutes: available,
      estimatedRequiredMinutes: total,
    },
    totalEstimatedMinutes: total,
    assumptions: assumptions[locale],
    warnings,
    stages: selectedStages,
    schedule: selectedStages.map((item, index) => ({
      label:
        locale === "en"
          ? `Work block ${index + 1}`
          : `Buổi làm việc ${index + 1}`,
      stageIds: [item.id],
      plannedMinutes: Math.min(
        item.learningMinutes + item.productionMinutes,
        plannedPerItem,
      ),
      priority: index < 2 ? "high" : index < selectedStages.length - 1 ? "medium" : "low",
    })),
    source: "demo",
  };
}
