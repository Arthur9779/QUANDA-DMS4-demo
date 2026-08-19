"use client";

import { Check, Clock3, GitCompareArrows, ListX } from "lucide-react";
import type { RouteEvidence } from "@/src/types";
import { getApplicationName } from "@/src/data/applications";
import type { Translation } from "@/src/i18n/translations";

interface RouteEvidenceCardProps {
  evidence: RouteEvidence;
  t: Translation;
}

function reason(code: string, locale: "en" | "vi", primary: string) {
  const vi = locale === "vi";
  const messages: Record<string, string> = {
    "required-tool": vi ? "Giữ ứng dụng người dùng đã chọn để tránh học lại công cụ mới." : "Kept the selected application to avoid unnecessary new-tool learning.",
    "existing-tool": vi ? "Ưu tiên công cụ người dùng đã biết và có thể hoàn thành đầu ra." : "Preferred an existing tool that can complete the required output.",
    "output-fit": vi ? "Phù hợp trực tiếp với loại sản phẩm và có ít ma sát nhất." : "Directly fits the output type with the lowest setup friction.",
    "required-tool-wins": vi ? "Không chọn vì " + getApplicationName(primary) + " đã là ứng dụng bắt buộc." : "Not selected because " + getApplicationName(primary) + " is already required.",
    "existing-tool-wins": vi ? "Không chọn vì chuyển khỏi " + getApplicationName(primary) + " sẽ tạo thêm việc học." : "Not selected because switching from " + getApplicationName(primary) + " would add learning.",
    "switch-cost": vi ? "Không có lợi thế dự án đủ rõ để bù cho chi phí chuyển công cụ." : "No clear project-specific advantage offsets the cost of switching.",
    "output-mismatch": vi ? "Không khớp trực tiếp với loại sản phẩm đã chọn." : "Does not directly match the selected output type.",
  };
  return messages[code] ?? (vi ? "Không cần thêm công cụ trong tuyến này." : "No additional tool is needed on this route.");
}

export function RouteEvidenceCard({ evidence, t }: RouteEvidenceCardProps) {
  const primaryName = getApplicationName(evidence.primaryApplicationId);
  return (
    <section className="route-proof-card" aria-labelledby="route-proof-title">
      <header className="route-proof-heading">
        <p className="eyebrow">{t.results.routeEvidence.eyebrow}</p>
        <h3 id="route-proof-title">{t.results.routeEvidence.title}</h3>
        <p>{t.results.routeEvidence.intro}</p>
      </header>
      <div className="route-proof-grid">
        <article className="route-decision route-decision-selected">
          <p className="route-decision-label">{t.results.routeEvidence.selectedRoute}</p>
          <h4>{evidence.selectedTechnique} → {primaryName}</h4>
          <p>{reason(evidence.primaryReasonCode, t.results.routeEvidence.locale, primaryName)}</p>
        </article>
        <article className="route-decision">
          <p className="route-decision-label"><GitCompareArrows aria-hidden="true" size={14} />{t.results.routeEvidence.routesConsidered}</p>
          <ul className="route-options">
            {evidence.routes.map((route) => (
              <li className={route.status === "selected" ? "route-option route-option-selected" : "route-option"} key={route.applicationId}>
                <strong>{route.status === "selected" ? <Check aria-hidden="true" size={14} /> : null}{getApplicationName(route.applicationId)}</strong>
                <span>{route.status === "selected" ? t.results.routeEvidence.selected : t.results.routeEvidence.notSelected}</span>
                <p>{reason(route.reasonCode, t.results.routeEvidence.locale, primaryName)}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="route-decision route-decision-removed">
          <p className="route-decision-label"><ListX aria-hidden="true" size={14} />{t.results.routeEvidence.skippedLearning}</p>
          <ul>{evidence.skippedLearning.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="route-time-avoided">
            <Clock3 aria-hidden="true" size={14} />
            {evidence.estimatedLearningAvoidedMinutes !== null
              ? t.results.routeEvidence.timeAvoided + ": " + evidence.estimatedLearningAvoidedMinutes + " " + t.results.minutes
              : t.results.routeEvidence.noTimeEstimate}
          </p>
        </article>
        <article className="route-decision">
          <p className="route-decision-label">{t.results.routeEvidence.decisionBasis}</p>
          <ul>
            <li>{t.results.routeEvidence.output}: {evidence.basis.outputType}</li>
            <li>{t.results.routeEvidence.deadline}: {evidence.basis.daysRemaining} {t.results.days}; {t.results.routeEvidence.availableTime}: {Math.round(evidence.basis.availableMinutes / 60)} {t.results.hours}</li>
            {evidence.basis.requiredApplicationIds.length > 0 && <li>{t.results.routeEvidence.requiredApplications}: {evidence.basis.requiredApplicationIds.map(getApplicationName).join(", ")}</li>}
            {evidence.basis.knownApplications.length > 0 && <li>{t.results.routeEvidence.statedExperience}: {evidence.basis.knownApplications.map((item) => getApplicationName(item.applicationId) + " (" + item.level + ")").join(", ")}</li>}
          </ul>
        </article>
      </div>
    </section>
  );
}
