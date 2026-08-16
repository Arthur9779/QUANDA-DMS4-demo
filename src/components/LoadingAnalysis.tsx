"use client";

import { BrainCircuit } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";

export function LoadingAnalysis({ t }: { t: Translation }) {
  return (
    <section
      aria-labelledby="analysis-loading-title"
      aria-live="polite"
      className="loading-roadmap loading-analysis"
      id="analysis-loading"
    >
      <div className="loading-mark" aria-hidden="true">
        <BrainCircuit size={42} />
        <span>✦</span>
      </div>
      <div>
        <p className="eyebrow">Creative DNA</p>
        <h2 id="analysis-loading-title">{t.review.loadingTitle}</h2>
        <ol>
          {t.review.loadingStatuses.map((status, index) => (
            <li className={index === 0 ? "is-active" : ""} key={status}>
              <span>0{index + 1}</span>
              {status}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
