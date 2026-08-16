import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CreativeDnaReview } from "@/src/components/CreativeDnaReview";
import { getTranslation } from "@/src/i18n/translations";

describe("Creative DNA review accessibility", () => {
  it("renders named edit controls and text provenance without raw IDs", () => {
    const markup = renderToStaticMarkup(
      <CreativeDnaReview
        creativeDna={{
          creativeDnaVersion: 1,
          projectIntent: "Create a Y2K animation in Blender.",
          concepts: [
            {
              ontologyId: "project-requirements.required-software.blender",
              label: "Blender",
              family: "Project Requirements",
              category: "Required Software",
              source: "explicit_requirement",
              status: "unconfirmed",
            },
            {
              ontologyId: "creative-direction.aesthetic.cyberpunk",
              label: "Cyberpunk",
              family: "Creative Direction",
              category: "Aesthetic",
              source: "ai_inferred",
              status: "unconfirmed",
              confidence: 0.55,
            },
          ],
          unknownConcepts: [],
          constraints: [],
        }}
        isBusy={false}
        isFallback={false}
        isStale={false}
        onAddOntology={vi.fn()}
        onAddUnknown={vi.fn()}
        onConfirm={vi.fn()}
        onEditDetails={vi.fn()}
        onIntentChange={vi.fn()}
        onReanalyze={vi.fn()}
        onRejectConcept={vi.fn()}
        onRejectConstraint={vi.fn()}
        onRejectUnknown={vi.fn()}
        onRestore={vi.fn()}
        t={getTranslation("en")}
      />,
    );
    expect(markup).toContain('aria-label="Edit requirement: Blender"');
    expect(markup).toContain('aria-label="Remove Cyberpunk"');
    expect(markup).toContain("Not sure?");
    expect(markup).toContain("Looks right — continue");
    expect(markup).not.toContain("creative-direction.aesthetic.cyberpunk");
  });
});
