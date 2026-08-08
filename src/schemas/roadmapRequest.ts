import { z } from "zod";
import { applicationById } from "@/src/data/applications";

export const RoadmapRequestSchema = z.object({
  interfaceLanguage: z.enum(["en", "vi"]),
  projectBrief: z.string().trim().min(30).max(2000),
  deadline: z
    .string()
    .date()
    .refine((value) => {
      const selected = new Date(`${value}T23:59:59`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(selected.getTime()) && selected >= today;
    }, "deadline"),
  currentExperience: z.string().trim().min(2).max(1000),
  hoursPerDay: z.coerce.number().min(0.5).max(12),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  tutorialLanguage: z.enum(["en", "vi", "either"]),
  requiredApplications: z
    .array(z.string())
    .max(10)
    .refine(
      (ids) => ids.every((id) => Boolean(applicationById[id])),
      "applications",
    ),
  outputType: z.enum(["video", "3d", "graphic", "uiux", "audio", "photo", "other"]),
  targetQuality: z.enum(["basic", "portfolio", "unsure"]),
});

export type RoadmapRequestInput = z.input<typeof RoadmapRequestSchema>;
