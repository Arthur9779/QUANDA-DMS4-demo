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

export const CUSTOM_APPLICATION_PREFIX = "custom:";

export function createCustomApplicationId(name: string): string {
  return `${CUSTOM_APPLICATION_PREFIX}${name.trim().replace(/\s+/g, " ")}`;
}

export function isCustomApplicationId(id: string): boolean {
  return id.startsWith(CUSTOM_APPLICATION_PREFIX) &&
    id.slice(CUSTOM_APPLICATION_PREFIX.length).trim().length >= 2;
}

export function isSupportedApplicationId(id: string): boolean {
  return Boolean(applicationById[id]) || isCustomApplicationId(id);
}

export function getApplicationName(id: string): string {
  return applicationById[id]?.name ??
    (isCustomApplicationId(id)
      ? id.slice(CUSTOM_APPLICATION_PREFIX.length).trim()
      : id);
}

export function getApplicationDefinition(id: string): ApplicationDefinition | null {
  if (applicationById[id]) return applicationById[id];
  if (!isCustomApplicationId(id)) return null;

  return {
    id,
    name: getApplicationName(id),
    category: "graphics",
    commonUses: ["core workflow", "project production"],
    commonExportFormats: [],
  };
}
