export interface ApplicationDefinition {
  id: string;
  name: string;
  category: "3d" | "graphics" | "video" | "uiux" | "audio" | "drawing";
  commonUses: string[];
  commonExportFormats: string[];
}

export const applications: ApplicationDefinition[] = [
  {
    id: "blender",
    name: "Blender",
    category: "3d",
    commonUses: ["modelling", "materials", "lighting", "animation", "rendering"],
    commonExportFormats: [".blend", ".fbx", ".obj", ".png", ".mp4"],
  },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    category: "graphics",
    commonUses: ["photo editing", "compositing", "textures", "digital painting"],
    commonExportFormats: [".psd", ".png", ".jpg", ".tiff"],
  },
  {
    id: "illustrator",
    name: "Adobe Illustrator",
    category: "graphics",
    commonUses: ["vector graphics", "logos", "icons", "illustration"],
    commonExportFormats: [".ai", ".svg", ".pdf", ".png"],
  },
  {
    id: "after-effects",
    name: "Adobe After Effects",
    category: "video",
    commonUses: ["motion graphics", "compositing", "visual effects", "animation"],
    commonExportFormats: [".aep", ".mov", ".mp4", ".png"],
  },
  {
    id: "premiere-pro",
    name: "Adobe Premiere Pro",
    category: "video",
    commonUses: ["video editing", "sound editing", "titles", "delivery"],
    commonExportFormats: [".prproj", ".mp4", ".mov"],
  },
  {
    id: "davinci-resolve",
    name: "DaVinci Resolve",
    category: "video",
    commonUses: ["video editing", "colour correction", "sound mixing", "delivery"],
    commonExportFormats: [".drp", ".mp4", ".mov", ".wav"],
  },
  {
    id: "figma",
    name: "Figma",
    category: "uiux",
    commonUses: ["wireframes", "interface design", "components", "prototyping"],
    commonExportFormats: [".fig", ".pdf", ".png", ".svg"],
  },
  {
    id: "procreate",
    name: "Procreate",
    category: "drawing",
    commonUses: ["digital painting", "illustration", "sketching", "frame animation"],
    commonExportFormats: [".procreate", ".psd", ".png", ".mp4"],
  },
  {
    id: "audacity",
    name: "Audacity",
    category: "audio",
    commonUses: ["audio editing", "noise reduction", "recording", "mixing"],
    commonExportFormats: [".aup3", ".wav", ".mp3"],
  },
  {
    id: "fl-studio",
    name: "FL Studio",
    category: "audio",
    commonUses: ["music production", "beat making", "mixing", "sound design"],
    commonExportFormats: [".flp", ".wav", ".mp3"],
  },
];

export const applicationById = Object.fromEntries(
  applications.map((application) => [application.id, application]),
) as Record<string, ApplicationDefinition>;
