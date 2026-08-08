import { AlertTriangle, CalendarDays, CheckCircle2, Gauge, Timer } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { RoadmapResponse } from "@/src/types";

interface FeasibilityCardProps {
  feasibility: RoadmapResponse["feasibility"];
  t: Translation;
}

function formatHours(minutes: number, t: Translation) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${t.results.hours}`;
}

export function FeasibilityCard({ feasibility, t }: FeasibilityCardProps) {
  const Icon =
    feasibility.status === "comfortable"
      ? CheckCircle2
      : feasibility.status === "tight"
        ? Gauge
        : AlertTriangle;

  return (
    <section className={`feasibility-card status-${feasibility.status}`}>
      <div className="feasibility-status">
        <span className="status-icon"><Icon aria-hidden="true" size={21} /></span>
        <div>
          <span>{t.results.status[feasibility.status]}</span>
          <p>{feasibility.message}</p>
        </div>
      </div>
      <dl>
        <div>
          <dt><CalendarDays aria-hidden="true" size={16} />{t.results.deadline}</dt>
          <dd>{feasibility.daysRemaining} {t.results.days}</dd>
        </div>
        <div>
          <dt><Timer aria-hidden="true" size={16} />{t.results.availableTime}</dt>
          <dd>{formatHours(feasibility.availableMinutes, t)}</dd>
        </div>
      </dl>
    </section>
  );
}
