"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Translation } from "@/src/i18n/translations";

interface LoadingRoadmapProps {
  t: Translation;
}

export function LoadingRoadmap({ t }: LoadingRoadmapProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % t.loading.statuses.length);
    }, 1_050);
    return () => window.clearInterval(interval);
  }, [t.loading.statuses.length]);

  return (
    <section className="loading-roadmap" id="roadmap-loading" aria-labelledby="loading-title">
      <div className="loading-mark" aria-hidden="true">
        <LoaderCircle size={30} />
        <span>✦</span>
      </div>
      <div>
        <p className="eyebrow">{t.loading.eyebrow}</p>
        <h2 id="loading-title">{t.loading.title}</h2>
        <ol aria-hidden="true">
          {t.loading.statuses.map((status, index) => (
            <li className={index === activeIndex ? "is-active" : ""} key={status}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {status}
            </li>
          ))}
        </ol>
        <p className="sr-only" role="status" aria-live="polite">
          {t.loading.statuses[activeIndex]}
        </p>
      </div>
    </section>
  );
}
