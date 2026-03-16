export type DocumentType = "linkedin_pdf";

export type ExperienceItem = {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
};

export type EducationItem = {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
};

export type SkillItem = {
  name: string;
  endorsementCount?: number;
};

export type ProfileLinks = {
  linkedin?: string;
  website?: string;
  other?: string[];
};

export type ProfileMetadata = {
  sourceFilename?: string;
  sourceTextExcerpt?: string;
  extractedAt: string;
  extractionWarnings: string[];
};

export type ParsedProfile = {
  schemaVersion: "1.0.0";
  documentType: DocumentType;
  person: {
    fullName: string;
    headline?: string;
    location?: string;
    summary?: string;
    currentCompany?: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  links: ProfileLinks;
  metadata: ProfileMetadata;
};

