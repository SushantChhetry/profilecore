import type { EducationItem, ExperienceItem, ParsedProfile, ProfileLinks, SkillItem } from "@profilecore/profile-schema";

export type ProfileStat = {
  label: string;
  value: string;
};

export type ProfileLinkView = {
  label: string;
  href: string;
  caption: string;
};

export type ProfileHighlight = {
  label: string;
  text: string;
};

export type ExperienceView = {
  id: string;
  role: string;
  company: string;
  dateRange: string | null;
  duration: string | null;
  location: string | null;
  description: string | null;
  isCurrent: boolean;
};

export type EducationView = {
  id: string;
  school: string;
  degreeLine: string | null;
  dateRange: string | null;
};

export type ProfileWorkspaceModel = {
  firstName: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  summary: string | null;
  currentFocus: string;
  qualityLabel: string;
  qualityNotes: string[];
  warnings: string[];
  heroStats: ProfileStat[];
  trustFacts: ProfileStat[];
  links: ProfileLinkView[];
  careerHighlights: ProfileHighlight[];
  chatPrompts: string[];
  experience: ExperienceView[];
  education: EducationView[];
  spotlightSkills: SkillItem[];
  additionalSkills: SkillItem[];
  inspectJson: string;
};

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateRange(startDate?: string, endDate?: string): string | null {
  const parts = [startDate, endDate].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : null;
}

export function formatDuration(startDate?: string, endDate?: string, now: Date = new Date()): string | null {
  const start = parseLooseDate(startDate);
  const end = !endDate || /^present$/i.test(endDate) ? now : parseLooseDate(endDate);

  if (!start || !end || end < start) {
    return null;
  }

  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }

  if (months < 1) {
    return null;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? "mo" : "mos"}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "yr" : "yrs"}`;
  }

  return `${years} ${years === 1 ? "yr" : "yrs"} ${remainingMonths} ${remainingMonths === 1 ? "mo" : "mos"}`;
}

export function buildProfileLinks(links: ProfileLinks): ProfileLinkView[] {
  const candidates = [
    { label: "LinkedIn", value: links.linkedin },
    { label: "Website", value: links.website },
    ...(links.other ?? []).map((value, index) => ({
      label: `Other link ${index + 1}`,
      value,
    })),
  ];

  return candidates
    .map((candidate) => {
      const href = normalizeUrl(candidate.value);
      if (!href) {
        return null;
      }

      const hostname = readHostname(href);
      const label =
        candidate.label.startsWith("Other") && hostname
          ? humanizeHostname(hostname)
          : candidate.label;

      return {
        label,
        href,
        caption: hostname ? hostname.replace(/^www\./, "") : href,
      } satisfies ProfileLinkView;
    })
    .filter((link): link is ProfileLinkView => link !== null);
}

export function buildProfileChatPrompts(profile: ParsedProfile): string[] {
  const firstName = readFirstName(profile.person.fullName);
  const currentRole = pickCurrentExperience(profile.experience);
  const currentCompany = profile.person.currentCompany ?? currentRole?.company ?? "their current company";
  const topicalSkill = sortSkills(profile.skills)[0]?.name ?? "their recent work";

  return [
    `Give me a concise briefing on ${firstName}'s background before I meet them.`,
    `Draft a warm networking introduction for ${firstName} that mentions ${currentCompany}.`,
    `Suggest three conversation starters based on ${firstName}'s experience with ${topicalSkill}.`,
    `What questions should I ask ${firstName} about ${currentCompany}?`,
  ];
}

export function buildProfileWorkspaceModel(params: {
  fullName: string;
  headline: string | null;
  location: string | null;
  canonicalJson: ParsedProfile;
}): ProfileWorkspaceModel {
  const { canonicalJson } = params;
  const firstName = readFirstName(params.fullName);
  const experience = canonicalJson.experience.map((item, index) => toExperienceView(item, index));
  const education = canonicalJson.education.map((item, index) => toEducationView(item, index));
  const skills = sortSkills(canonicalJson.skills);
  const spotlightSkills = skills.slice(0, 8);
  const additionalSkills = skills.slice(8);
  const links = buildProfileLinks(canonicalJson.links);
  const currentExperience = pickCurrentExperience(canonicalJson.experience);
  const latestEducation = canonicalJson.education[0];
  const warnings = canonicalJson.metadata.extractionWarnings;
  const qualityNotes = buildQualityNotes(canonicalJson, links);
  const qualityLabel =
    warnings.length > 0 ? "Review recommended" : qualityNotes.length > 0 ? "Mostly complete" : "Ready to use";

  return {
    firstName,
    fullName: params.fullName,
    headline: params.headline,
    location: params.location,
    summary: canonicalJson.person.summary ?? null,
    currentFocus: buildCurrentFocus(firstName, canonicalJson, currentExperience),
    qualityLabel,
    qualityNotes,
    warnings,
    heroStats: [
      {
        label: "Current role",
        value: currentExperience ? `${currentExperience.role} at ${currentExperience.company}` : params.headline ?? "Not available",
      },
      {
        label: "Experience",
        value: `${canonicalJson.experience.length} ${canonicalJson.experience.length === 1 ? "role" : "roles"}`,
      },
      {
        label: "Skills",
        value: `${canonicalJson.skills.length} extracted`,
      },
      {
        label: "Education",
        value: latestEducation ? latestEducation.school : "Not extracted",
      },
    ],
    trustFacts: [
      {
        label: "Source",
        value: canonicalJson.metadata.sourceFilename ?? "Uploaded document",
      },
      {
        label: "Extracted",
        value: formatDateLabel(canonicalJson.metadata.extractedAt),
      },
      {
        label: "Document type",
        value: formatDocumentType(canonicalJson.documentType),
      },
      {
        label: "Coverage",
        value: `${canonicalJson.experience.length} roles • ${canonicalJson.skills.length} skills`,
      },
    ],
    links,
    careerHighlights: buildCareerHighlights(canonicalJson, currentExperience, latestEducation),
    chatPrompts: buildProfileChatPrompts(canonicalJson),
    experience,
    education,
    spotlightSkills,
    additionalSkills,
    inspectJson: JSON.stringify(canonicalJson, null, 2),
  };
}

function buildCurrentFocus(
  firstName: string,
  profile: ParsedProfile,
  currentExperience: ExperienceItem | undefined,
): string {
  if (profile.person.summary) {
    return profile.person.summary;
  }

  if (currentExperience) {
    const location = profile.person.location ? ` in ${profile.person.location}` : "";
    return `${firstName} is currently ${currentExperience.role} at ${currentExperience.company}${location}.`;
  }

  if (profile.person.headline) {
    return profile.person.headline;
  }

  return `Structured profile data is available for ${firstName}, but the summary field was not extracted.`;
}

function buildCareerHighlights(
  profile: ParsedProfile,
  currentExperience: ExperienceItem | undefined,
  latestEducation: EducationItem | undefined,
): ProfileHighlight[] {
  const highlights: ProfileHighlight[] = [];

  if (currentExperience) {
    highlights.push({
      label: "Now",
      text: `${currentExperience.role} at ${currentExperience.company}`,
    });
  }

  const priorCompanies = profile.experience
    .slice(currentExperience ? 1 : 0)
    .map((item) => item.company)
    .filter(Boolean)
    .filter((company, index, companies) => companies.indexOf(company) === index)
    .slice(0, 3);

  if (priorCompanies.length > 0) {
    highlights.push({
      label: "Path",
      text: `Previous stops include ${priorCompanies.join(", ")}.`,
    });
  }

  if (latestEducation) {
    const degreeLine = [latestEducation.degree, latestEducation.fieldOfStudy].filter(Boolean).join(" • ");
    highlights.push({
      label: "Education",
      text: degreeLine ? `${degreeLine} at ${latestEducation.school}` : latestEducation.school,
    });
  }

  if (profile.person.location) {
    highlights.push({
      label: "Based",
      text: profile.person.location,
    });
  }

  return highlights.slice(0, 4);
}

function buildQualityNotes(profile: ParsedProfile, links: ProfileLinkView[]): string[] {
  const notes: string[] = [];

  if (!profile.person.summary) {
    notes.push("Summary was not extracted.");
  }
  if (links.length === 0) {
    notes.push("No profile links were extracted.");
  }
  if (profile.experience.length === 0) {
    notes.push("Experience history is empty.");
  }
  if (profile.education.length === 0) {
    notes.push("Education history is empty.");
  }
  if (profile.skills.length === 0) {
    notes.push("No skills were extracted.");
  }

  return notes;
}

function toExperienceView(item: ExperienceItem, index: number): ExperienceView {
  return {
    id: `${item.company}-${item.role}-${index}`,
    role: item.role,
    company: item.company,
    dateRange: formatDateRange(item.startDate, item.endDate),
    duration: formatDuration(item.startDate, item.endDate),
    location: item.location ?? null,
    description: item.description ?? null,
    isCurrent: Boolean(item.endDate && /^present$/i.test(item.endDate)),
  };
}

function toEducationView(item: EducationItem, index: number): EducationView {
  return {
    id: `${item.school}-${item.degree ?? "degree"}-${index}`,
    school: item.school,
    degreeLine: [item.degree, item.fieldOfStudy].filter(Boolean).join(" • ") || null,
    dateRange: formatDateRange(item.startDate, item.endDate),
  };
}

function sortSkills(skills: SkillItem[]): SkillItem[] {
  return [...skills].sort((left, right) => {
    const endorsementDelta = (right.endorsementCount ?? 0) - (left.endorsementCount ?? 0);
    if (endorsementDelta !== 0) {
      return endorsementDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

function pickCurrentExperience(experience: ExperienceItem[]): ExperienceItem | undefined {
  return experience.find((item) => Boolean(item.endDate && /^present$/i.test(item.endDate))) ?? experience[0];
}

function readFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatDocumentType(documentType: string): string {
  if (documentType === "linkedin_pdf") {
    return "LinkedIn PDF";
  }

  return documentType.replace(/_/g, " ");
}

function formatDateLabel(value?: string): string {
  const parsed = parseLooseDate(value);
  if (!parsed) {
    return "Unknown";
  }

  return dateLabelFormatter.format(parsed);
}

function parseLooseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}$/.test(value)) {
    return new Date(Date.UTC(Number(value), 0, 1));
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function normalizeUrl(value?: string): string | null {
  if (!value?.trim()) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function readHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function humanizeHostname(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".").filter(Boolean);
  const nameParts =
    parts.length > 1 && parts[parts.length - 1]!.length <= 3 ? parts.slice(0, -1) : parts.slice(0, 2);

  return nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
