import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyHasId } from "@/src/ontology/runtime";

// One canonical, ontology-backed learning concept for each common tutorial
// topic and bilingual catalogue alias. Both project decomposition and tutorial
// classification use this table so a roadmap need and a catalogue video cannot
// silently receive different IDs. Keep aliases here instead of scattering
// English/Vietnamese keyword rules through the ranker.
const TOPIC_SKILL_IDS: Record<string, string> = {};

function register(id: string, aliases: string[]) {
  if (!ontologyHasId(id)) return;
  for (const alias of aliases) {
    TOPIC_SKILL_IDS[normalizeOntologyLabel(alias)] = id;
  }
}

register(
  "learning-classification.prerequisite-software-knowledge.workspace-navigation",
  [
    "basics", "beginner", "fundamentals", "workspace", "workflow", "interface",
    "tools", "new features", "gestures", "actions", "cơ bản", "nền tảng",
    "giao diện", "công cụ", "quy trình", "tính năng mới",
  ],
);
register("tutorial-content-classification.tutorial-skill.navigation", [
  "navigation", "viewport", "điều hướng", "khung nhìn", "biến đổi",
]);
register("tutorial-content-classification.tutorial-topic.interface", ["ui"]);
register("tutorial-content-classification.tutorial-skill.modeling", [
  "modeling", "modelling", "product", "shapes", "dựng hình", "mô hình", "sản phẩm",
]);
register("learning-classification.prerequisite-software-knowledge.materials", [
  "materials", "textures", "shading", "roughness", "vật liệu", "họa tiết", "độ nhám",
]);
register("tutorial-content-classification.tutorial-topic.animation", [
  "animation", "animate", "motion", "cloth", "text animation", "hoạt hình", "chuyển động",
]);
register("tutorial-content-classification.tutorial-skill.rendering", [
  "rendering", "render", "kết xuất",
]);
register("tutorial-content-classification.tutorial-skill.lighting", [
  "lighting", "light", "ánh sáng",
]);
register("tutorial-content-classification.tutorial-prerequisite.camera-basics", [
  "camera", "máy quay",
]);
register("learning-classification.prerequisite-software-knowledge.keyframes", [
  "keyframes", "frames", "khung hình chính", "khung hình",
]);
register("learning-classification.prerequisite-software-knowledge.timeline", [
  "timeline", "playlist", "dòng thời gian",
]);
register("tutorial-content-classification.tutorial-skill.layout", [
  "layout", "wireframe", "spacing", "bố cục", "khoảng cách",
]);
register("tutorial-content-classification.tutorial-technique.responsive-layout", [
  "auto layout", "responsive",
]);
register("tutorial-content-classification.tutorial-technique.figma-components", [
  "components", "component", "design system", "buttons", "thành phần", "nút",
  "hệ thống thiết kế",
]);
register("tutorial-content-classification.tutorial-skill.prototyping", [
  "prototype", "prototyping", "interactions", "testing", "bản mẫu", "tương tác",
]);
register("tutorial-content-classification.tutorial-technique.user-flow", [
  "user flow",
]);
register("learning-classification.prerequisite-software-knowledge.layers", [
  "layers", "non-destructive editing", "lớp",
]);
register("learning-classification.prerequisite-software-knowledge.selection", [
  "selection", "selections", "subject isolation", "vùng chọn", "tách người",
]);
register("tutorial-content-classification.tutorial-skill.masking", [
  "masks", "masking", "layer masks", "mặt nạ",
]);
register("tutorial-content-classification.tutorial-skill.compositing", [
  "compositing", "effects", "generative tools", "ghép ảnh", "ghép hình", "hiệu ứng",
]);
register("tutorial-content-classification.tutorial-skill.editing", [
  "editing", "video editing", "trimming", "cuts", "chỉnh sửa", "dựng phim",
  "dựng video", "cắt ghép",
]);
register("graphic-design.photo-manipulation-style.retouching", ["retouching"]);
register("tutorial-content-classification.tutorial-skill.export", [
  "export", "delivery", "codec", "bitrate", "youtube", "format", "xuất video",
  "định dạng", "nộp bài", "xuất tệp", "xuất nhạc",
]);
register("tutorial-content-classification.tutorial-output.vector", [
  "vector", "shapes", "pen tool", "paths", "bezier", "đồ họa vector",
  "công cụ pen", "đường nét",
]);
register("tutorial-content-classification.tutorial-skill.illustration", [
  "illustration", "digital painting", "sketching", "line art", "minh họa",
  "phác thảo", "nét vẽ",
]);
register("tutorial-content-classification.tutorial-skill.typography", ["typography"]);
register("tutorial-content-classification.tutorial-technique.motion-graphics", [
  "motion graphics", "text animation",
]);
register("tutorial-content-classification.tutorial-skill.graph-editor", ["graph editor"]);
register("learning-classification.prerequisite-technique-knowledge.easing", ["easing"]);
register("conceptual-theoretical-metadata.animation-principle.timing", ["timing"]);
register("tutorial-content-classification.tutorial-topic.color-grading", [
  "color grading", "colour grading", "color correction", "colour correction",
  "exposure", "white balance", "matching", "chỉnh màu", "độ phơi sáng",
  "cân bằng trắng",
]);
register("tutorial-content-classification.tutorial-skill.color", ["color", "colour", "màu"]);
register("tutorial-content-classification.tutorial-medium.audio", [
  "audio", "sound editing", "voice", "âm thanh", "giọng nói", "chỉnh âm",
]);
register("tutorial-content-classification.tutorial-skill.audio-cleanup", [
  "audio cleanup", "background noise", "noise", "làm sạch âm thanh", "tiếng ồn",
]);
register("audio-and-music.voice-treatment.noise-reduction", [
  "noise reduction", "khử tạp âm",
]);
register("production-workflow.production-stage.recording", [
  "recording", "audio recording", "vocal recording", "microphone", "podcast",
  "ghi âm", "thu âm", "thu giọng hát", "giọng hát", "giọng thu", "micro",
]);
register("tutorial-content-classification.tutorial-skill.mixing", [
  "mixing", "mixer", "fairlight", "equalization", "levels", "phối âm",
  "cân bằng âm", "bộ trộn",
]);
register("tutorial-content-classification.tutorial-technique.compression", [
  "compression", "nén âm",
]);
register("tutorial-content-classification.tutorial-topic.drawing", [
  "drawing", "painting", "sketching", "vẽ", "cọ vẽ", "khung vẽ",
]);
register("learning-classification.prerequisite-coding-knowledge.canvas", ["canvas"]);
register("tools-and-software.asset-library.brushes", ["brushes", "plugins", "trình cắm"]);
register("tutorial-content-classification.tutorial-technique.frame-by-frame", [
  "frame by frame", "frame-by-frame", "animation assist",
]);
register("production-workflow.postproduction-task.sound-design", [
  "sound design", "arrangement", "music production", "beat making", "piano roll",
  "trap", "hip hop", "sản xuất âm nhạc", "làm beat", "phối khí",
]);

export function canonicalSkillIdForTopic(topic: string): string | undefined {
  const id = TOPIC_SKILL_IDS[normalizeOntologyLabel(topic)];
  return id && ontologyHasId(id) ? id : undefined;
}

export function canonicalSkillIdsForTopics(topics: string[]): string[] {
  return [
    ...new Set(
      topics.flatMap((topic) => {
        const id = canonicalSkillIdForTopic(topic);
        return id ? [id] : [];
      }),
    ),
  ];
}
