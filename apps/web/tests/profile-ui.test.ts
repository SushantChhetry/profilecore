import { describe, expect, it } from "vitest";

import type { ParsedProfile } from "@profilecore/profile-schema";

import { buildProfileLinks, buildProfileWorkspaceModel, formatDuration } from "../lib/profile-ui";

const sampleProfile: ParsedProfile = {
  schemaVersion: "1.0.0",
  documentType: "linkedin_pdf",
  person: {
    fullName: "Jane Doe",
    headline: "Product Manager at Stripe",
    location: "New York, NY",
    summary: "Product leader focused on developer tools and payments.",
    currentCompany: "Stripe",
  },
  experience: [
    {
      company: "Stripe",
      role: "Product Manager",
      startDate: "2022",
      endDate: "Present",
      description: "Led launches across API and developer experience teams.",
    },
    {
      company: "Square",
      role: "Senior Product Analyst",
      startDate: "2019",
      endDate: "2022",
    },
  ],
  education: [
    {
      school: "MIT",
      degree: "B.S. Computer Science",
      startDate: "2015",
      endDate: "2019",
    },
  ],
  skills: [
    { name: "Leadership" },
    { name: "Payments", endorsementCount: 4 },
    { name: "Developer Experience", endorsementCount: 8 },
  ],
  links: {
    linkedin: "linkedin.com/in/jane-doe",
    website: "janedoe.dev",
    other: ["github.com/janedoe"],
  },
  metadata: {
    sourceFilename: "jane-doe.pdf",
    sourceTextExcerpt: "Jane Doe Product Manager at Stripe",
    extractedAt: "2026-03-16T00:00:00Z",
    extractionWarnings: [],
  },
};

describe("formatDuration", () => {
  it("formats month and year durations", () => {
    expect(formatDuration("2022", "2024", new Date("2024-01-15T00:00:00Z"))).toBe("2 yrs");
    expect(formatDuration("2024-01", "2024-07", new Date("2024-07-15T00:00:00Z"))).toBe("6 mos");
  });
});

describe("buildProfileLinks", () => {
  it("normalizes extracted links into human-readable references", () => {
    expect(buildProfileLinks(sampleProfile.links)).toEqual([
      {
        label: "LinkedIn",
        href: "https://linkedin.com/in/jane-doe",
        caption: "linkedin.com",
      },
      {
        label: "Website",
        href: "https://janedoe.dev/",
        caption: "janedoe.dev",
      },
      {
        label: "Github",
        href: "https://github.com/janedoe",
        caption: "github.com",
      },
    ]);
  });
});

describe("buildProfileWorkspaceModel", () => {
  it("builds chat prompts, spotlight skills, and trust facts from the parsed profile", () => {
    const model = buildProfileWorkspaceModel({
      fullName: "Jane Doe",
      headline: "Product Manager at Stripe",
      location: "New York, NY",
      canonicalJson: sampleProfile,
    });

    expect(model.qualityLabel).toBe("Ready to use");
    expect(model.chatPrompts[1]).toContain("Stripe");
    expect(model.spotlightSkills.map((skill) => skill.name)).toEqual([
      "Developer Experience",
      "Payments",
      "Leadership",
    ]);
    expect(model.trustFacts).toContainEqual({
      label: "Extracted",
      value: "Mar 16, 2026",
    });
    expect(model.careerHighlights).toContainEqual({
      label: "Now",
      text: "Product Manager at Stripe",
    });
  });
});
