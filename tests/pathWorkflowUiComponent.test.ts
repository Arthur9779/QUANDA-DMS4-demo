import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InitialBriefForm } from "@/src/components/InitialBriefForm";
import { PathClarification } from "@/src/components/PathClarification";
import { getTranslation } from "@/src/i18n/translations";

describe("path selection UI", () => {
  it("keeps the landing brief copy neutral for creative and software projects", () => {
    const markup = renderToStaticMarkup(
      React.createElement(InitialBriefForm, {
        brief: "",
        isSubmitting: false,
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        t: getTranslation("en"),
      }),
    );

    expect(markup).toContain("Create a product animation in Blender");
    expect(markup).toContain("build a portfolio website");
    expect(markup).toContain('class="form-section path-entry-section"');
  });

  it("renders two clearly labelled, keyboard-accessible path choices", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PathClarification, {
        t: getTranslation("vi"),
        onChoose: vi.fn(),
      }),
    );

    expect(markup).toContain("Một sản phẩm sáng tạo hoặc hình ảnh");
    expect(markup).toContain("Phần mềm hoạt động hoặc hệ thống kỹ thuật");
    expect(markup).toContain('class="path-choice-grid"');
    expect((markup.match(/<button/g) ?? []).length).toBe(2);
  });

  it("supports embedding the neutral brief form beside the landing copy", () => {
    const markup = renderToStaticMarkup(
      React.createElement(InitialBriefForm, {
        brief: "",
        embedded: true,
        isSubmitting: false,
        onChange: vi.fn(),
        onSubmit: vi.fn(),
        t: getTranslation("en"),
      }),
    );

    expect(markup).toContain('class="project-form"');
    expect(markup).not.toContain("path-entry-section");
    expect(markup).toContain('for="initialProjectBrief"');
  });
});
