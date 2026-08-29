import type { EngineeringPlatform, EngineeringStartingPoint, PathClassification, ProjectPath } from "./contracts";

const engineeringSignals: Array<[RegExp, string, number]> = [
  [/\b(build|implement|develop|debug|extend|ship|deploy|code)\b/i, "software delivery verb", 3],
  [/\b(website|web app|web application|mobile app|desktop app|game|gameplay|video game|api|backend|database|automation|plugin|extension|repository|repo|bug|feature|system|AI-powered search|search feature)\b/i, "software deliverable", 4],
  [/\b(react|next\.js|react native|python|typescript|javascript|godot|gdscript|unity|unreal engine|c#|c\+\+|rest|graphql|sql|github|vercel|docker|AI integration)\b/i, "engineering technology", 3],
  [/\b(test|acceptance criteria|pull request|environment variable|deploy|deployment|error|debugging)\b/i, "engineering workflow", 3],
];

const designSignals: Array<[RegExp, string, number]> = [
  [/\b(create|make|design|edit|produce|shoot|illustrate|animate|compose)\b/i, "creative production verb", 2],
  [/\b(animation|illustration|poster|documentary|brand identity|visual identity|3d artwork|sound design|visual installation|projected artwork|interactive artwork|photography|graphic design|storyboard|film|motion graphics|ui\/ux|user interface|interactive prototype|design system)\b/i, "creative deliverable", 4],
  [/\b(blender|maya|touchdesigner|figma|photoshop|illustrator|premiere|davinci|after effects)\b/i, "creative application", 3],
  [/\b(style|aesthetic|visual|colour|color|composition|lighting|render|look|prototype|prototyping|auto layout|component system|user flow|usability testing)\b/i, "creative context", 2],
];

export function classifyProjectPath(brief: string): PathClassification {
  const text = brief.trim();
  let engineeringScore = 0;
  let designScore = 0;
  const engineeringMatched: string[] = [];
  const designMatched: string[] = [];
  for (const [pattern, label, weight] of engineeringSignals) {
    if (pattern.test(text)) {
      engineeringScore += weight;
      engineeringMatched.push(label);
    }
  }
  for (const [pattern, label, weight] of designSignals) {
    if (pattern.test(text)) {
      designScore += weight;
      designMatched.push(label);
    }
  }

  const difference = Math.abs(engineeringScore - designScore);
  const maximum = Math.max(engineeringScore, designScore);
  if (maximum < 4 || difference < 3) {
    return {
      path: "clarification",
      confidence: Math.min(0.65, maximum / 10),
      reason: "The brief does not clearly establish whether the primary deliverable is a creative artifact or working software.",
      signals: [...engineeringMatched, ...designMatched].slice(0, 8),
    };
  }

  const path: ProjectPath = engineeringScore > designScore ? "agentic_engineering" : "design";
  return {
    path,
    confidence: Math.min(0.99, 0.55 + difference / 12),
    reason: path === "agentic_engineering"
      ? "The brief is primarily about delivering working software or a technical system."
      : "The brief is primarily about delivering a creative or visual artifact.",
    signals: (path === "agentic_engineering" ? engineeringMatched : designMatched).slice(0, 8),
  };
}

export function pathLabel(path: ProjectPath, locale: "en" | "vi"): string {
  if (locale === "vi") return path === "design" ? "Sản xuất thiết kế" : "Kỹ thuật tác nhân";
  return path === "design" ? "Design Production" : "Agentic Engineering";
}

export function inferEngineeringHints(brief: string): {
  targetPlatform: EngineeringPlatform;
  startingPoint: EngineeringStartingPoint;
  repositoryUrl: string;
  technologies: string;
} {
  const text = brief.trim();
  const targetPlatform: EngineeringPlatform = /\b(mobile app|react native|ios|android)\b/i.test(text)
    ? "mobile_application"
    : /\b(api|backend|rest|graphql)\b/i.test(text)
      ? "api_backend"
      : /\b(automation|automate|scheduled script)\b/i.test(text)
        ? "automation"
        : /\b(browser extension|plugin|extension)\b/i.test(text)
          ? "plugin_extension"
          : /\b(game|gameplay)\b/i.test(text)
            ? "game"
            : /\b(data-processing|data processing|csv|etl|data pipeline)\b/i.test(text)
              ? "data_project"
              : /\b(desktop|electron|tauri)\b/i.test(text)
                ? "desktop_application"
                : "web_application";
  const startingPoint: EngineeringStartingPoint = /\b(existing repo|existing repository|current repository)\b/i.test(text)
    ? (/\b(bug|error|fails|failing)\b/i.test(text) ? "existing_bug" : /\b(feature|add|extend)\b/i.test(text) ? "existing_feature" : "existing_repository")
    : "new_project";
  const repositoryUrl = text.match(/https?:\/\/[^\s)]+/i)?.[0] ?? "";
  const technologies = [...new Set((text.match(/\b(Next\.js|React Native|React|TypeScript|JavaScript|Python|FastAPI|PostgreSQL|SQLite|GraphQL|REST|Docker|Vercel|Firebase|Supabase)\b/gi) ?? []).map((item) => item))].join(", ");
  return { targetPlatform, startingPoint, repositoryUrl, technologies };
}
