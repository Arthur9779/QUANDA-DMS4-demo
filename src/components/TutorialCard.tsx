"use client";

import { ArrowUpRight, Clock3, Play, Video } from "lucide-react";
import type { Translation } from "@/src/i18n/translations";
import type { TutorialRecommendation } from "@/src/lib/tutorialMatcher";
import { trackEvent } from "@/src/lib/analytics";

interface TutorialCardProps {
  tutorial: TutorialRecommendation;
  t: Translation;
}

export function TutorialCard({ tutorial, t }: TutorialCardProps) {
  const trackTutorialOpen = () => {
    trackEvent("tutorial_opened", {
      tutorialId: tutorial.id,
      source: tutorial.badge,
    });
  };

  return (
    <article className="tutorial-card">
      <a
        aria-label={`${t.results.watchYoutube}: ${tutorial.title}`}
        className="tutorial-thumbnail"
        href={tutorial.url}
        onClick={trackTutorialOpen}
        rel="noreferrer"
        style={{ backgroundImage: `url(${tutorial.thumbnailUrl})` }}
        target="_blank"
      >
        <span className="tutorial-play"><Play aria-hidden="true" fill="currentColor" size={21} /></span>
      </a>
      <div className="tutorial-topline">
        <span className="source-badge badge-youtube">{t.results.youtubeVideo}</span>
        <Video aria-hidden="true" size={17} />
      </div>
      <h5>{tutorial.title}</h5>
      <p>{tutorial.creator}</p>
      <dl>
        <div>
          <dt>{t.results.application}</dt>
          <dd>{tutorial.applicationName}</dd>
        </div>
        <div>
          <dt>{t.results.version}</dt>
          <dd>{tutorial.versionLabel}</dd>
        </div>
        <div>
          <dt>{t.form.tutorialLanguage}</dt>
          <dd>{t.results.languageNames[tutorial.language]}</dd>
        </div>
        <div>
          <dt><Clock3 aria-hidden="true" size={12} /></dt>
          <dd>
            {tutorial.durationMinutes
              ? `${tutorial.durationMinutes} ${t.results.minutes}`
              : t.results.durationUnknown}
          </dd>
        </div>
      </dl>
      <a
        className="tutorial-link"
        href={tutorial.url}
        onClick={trackTutorialOpen}
        rel="noreferrer"
        target="_blank"
      >
        {t.results.watchYoutube}
        <ArrowUpRight aria-hidden="true" size={15} />
      </a>
    </article>
  );
}
