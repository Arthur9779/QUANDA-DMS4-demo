import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@/src/auth/AuthContext";
import { AccountLanding } from "@/src/components/AccountLanding";
import { getTranslation } from "@/src/i18n/translations";

describe("AccountLanding", () => {
  it("offers account and guest choices before the project brief", () => {
    const markup = renderToStaticMarkup(
      <AuthProvider>
        <AccountLanding
          isReady
          locale="en"
          onContinueGuest={() => undefined}
          onLanguageChange={() => undefined}
          t={getTranslation("en")}
        />
      </AuthProvider>,
    );

    expect(markup).toContain("Have you created your account?");
    expect(markup).toContain("Log in");
    expect(markup).toContain("Create account");
    expect(markup).toContain("Continue without account");
    expect(markup).not.toContain("Project brief");
  });
});
