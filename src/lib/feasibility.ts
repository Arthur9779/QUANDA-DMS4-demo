import type { Locale, RoadmapResponse } from "@/src/types";

const DAY_MS = 86_400_000;

export function getDaysRemaining(deadline: string, now = new Date()): number {
  const end = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(end.getTime())) {
    return 0;
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / DAY_MS));
}

export function calculateAvailableMinutes(
  deadline: string,
  hoursPerDay: number,
  daysPerWeek: number,
  now = new Date(),
): number {
  const daysRemaining = getDaysRemaining(deadline, now);
  const availableStudyDays = Math.max(
    1,
    Math.ceil((daysRemaining * daysPerWeek) / 7),
  );
  return Math.round(availableStudyDays * hoursPerDay * 60);
}

export function getFeasibilityStatus(
  estimatedRequiredMinutes: number,
  availableMinutes: number,
): RoadmapResponse["feasibility"]["status"] {
  if (availableMinutes <= 0) {
    return "unrealistic";
  }

  const ratio = estimatedRequiredMinutes / availableMinutes;
  if (ratio <= 0.75) return "comfortable";
  if (ratio <= 1.1) return "tight";
  return "unrealistic";
}

export function getFeasibilityMessage(
  status: RoadmapResponse["feasibility"]["status"],
  locale: Locale,
): string {
  const messages = {
    en: {
      comfortable:
        "Your available study time leaves a useful buffer for review and small setbacks.",
      tight:
        "This plan can fit, but protect the high-priority tasks and review progress early.",
      unrealistic:
        "The full scope will not fit comfortably. Prioritise required criteria and simplify advanced effects.",
    },
    vi: {
      comfortable:
        "Thời gian học hiện có tạo khoảng đệm hợp lý để xem lại và xử lý trở ngại nhỏ.",
      tight:
        "Kế hoạch có thể vừa thời gian, nhưng hãy bảo vệ các nhiệm vụ ưu tiên cao và kiểm tra tiến độ sớm.",
      unrealistic:
        "Toàn bộ phạm vi khó vừa thời gian. Hãy ưu tiên tiêu chí bắt buộc và đơn giản hóa hiệu ứng nâng cao.",
    },
  };
  return messages[locale][status];
}
