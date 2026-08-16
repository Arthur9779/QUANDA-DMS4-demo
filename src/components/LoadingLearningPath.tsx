"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";

export function LoadingLearningPath({ t }: { t: Translation }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % t.learning.loadingStatuses.length),
      1_250,
    );
    return () => window.clearInterval(timer);
  }, [t.learning.loadingStatuses.length]);
  return (
    <section
      aria-live="polite"
      className="learning-loading"
      id="learning-path-loading"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="spin" size={24} />
      <div>
        <strong>{t.learning.loadingTitle}</strong>
        <p>{t.learning.loadingStatuses[index]}</p>
      </div>
    </section>
  );
}
