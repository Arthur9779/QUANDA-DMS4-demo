import { normalizeOntologyLabel } from "@/src/ontology/normalization";
import { ontologyHasId } from "@/src/ontology/runtime";

// One canonical, ontology-backed learning concept for each common tutorial topic.
// Both project decomposition and tutorial classification use this table so a
// roadmap need and a catalogue video cannot silently receive different IDs.
const TOPIC_SKILL_IDS: Record<string, string> = {
  basics: "learning-classification.prerequisite-software-knowledge.workspace-navigation",
  navigation: "tutorial-content-classification.tutorial-skill.navigation",
  interface: "tutorial-content-classification.tutorial-topic.interface",
  workspace: "learning-classification.prerequisite-software-knowledge.workspace-navigation",
  modeling: "tutorial-content-classification.tutorial-skill.modeling",
  modelling: "tutorial-content-classification.tutorial-skill.modeling",
  materials: "learning-classification.prerequisite-software-knowledge.materials",
  animation: "tutorial-content-classification.tutorial-topic.animation",
  rendering: "tutorial-content-classification.tutorial-skill.rendering",
  lighting: "tutorial-content-classification.tutorial-skill.lighting",
  camera: "tutorial-content-classification.tutorial-prerequisite.camera-basics",
  "máy quay": "tutorial-content-classification.tutorial-prerequisite.camera-basics",
  keyframes: "learning-classification.prerequisite-software-knowledge.keyframes",
  timeline: "learning-classification.prerequisite-software-knowledge.timeline",
  layout: "tutorial-content-classification.tutorial-skill.layout",
  "auto layout": "tutorial-content-classification.tutorial-technique.responsive-layout",
  responsive: "tutorial-content-classification.tutorial-technique.responsive-layout",
  components: "tutorial-content-classification.tutorial-technique.figma-components",
  prototype: "tutorial-content-classification.tutorial-skill.prototyping",
  prototyping: "tutorial-content-classification.tutorial-skill.prototyping",
  "user flow": "tutorial-content-classification.tutorial-technique.user-flow",
  layers: "learning-classification.prerequisite-software-knowledge.layers",
  selections: "learning-classification.prerequisite-software-knowledge.selection",
  selection: "learning-classification.prerequisite-software-knowledge.selection",
  masks: "tutorial-content-classification.tutorial-skill.masking",
  masking: "tutorial-content-classification.tutorial-skill.masking",
  compositing: "tutorial-content-classification.tutorial-skill.compositing",
  editing: "tutorial-content-classification.tutorial-skill.editing",
  "video editing": "tutorial-content-classification.tutorial-skill.editing",
  retouching: "graphic-design.photo-manipulation-style.retouching",
  export: "tutorial-content-classification.tutorial-skill.export",
  delivery: "tutorial-content-classification.tutorial-skill.export",
  vector: "tutorial-content-classification.tutorial-output.vector",
  illustration: "tutorial-content-classification.tutorial-skill.illustration",
  typography: "tutorial-content-classification.tutorial-skill.typography",
  "motion graphics": "tutorial-content-classification.tutorial-technique.motion-graphics",
  "graph editor": "tutorial-content-classification.tutorial-skill.graph-editor",
  easing: "learning-classification.prerequisite-technique-knowledge.easing",
  timing: "conceptual-theoretical-metadata.animation-principle.timing",
  "color grading": "tutorial-content-classification.tutorial-topic.color-grading",
  color: "tutorial-content-classification.tutorial-skill.color",
  audio: "tutorial-content-classification.tutorial-medium.audio",
  "audio cleanup": "tutorial-content-classification.tutorial-skill.audio-cleanup",
  "noise reduction": "audio-and-music.voice-treatment.noise-reduction",
  recording: "production-workflow.production-stage.recording",
  mixing: "tutorial-content-classification.tutorial-skill.mixing",
  compression: "tutorial-content-classification.tutorial-technique.compression",
  drawing: "tutorial-content-classification.tutorial-topic.drawing",
  canvas: "learning-classification.prerequisite-coding-knowledge.canvas",
  brushes: "tools-and-software.asset-library.brushes",
  "frame by frame": "tutorial-content-classification.tutorial-technique.frame-by-frame",
  "frame-by-frame": "tutorial-content-classification.tutorial-technique.frame-by-frame",
  "sound design": "production-workflow.postproduction-task.sound-design",
};

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
