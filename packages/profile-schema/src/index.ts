import schema from "../profile.schema.json";

export type {
  DocumentType,
  EducationItem,
  ExperienceItem,
  ParsedProfile,
  ProfileLinks,
  ProfileMetadata,
  SkillItem,
} from "./types";
export { assertParsedProfile, getParsedProfileValidationErrors, validateParsedProfile } from "./validator";

export const PROFILE_SCHEMA_VERSION = "1.0.0";
export const PROFILE_DOCUMENT_TYPE = "linkedin_pdf";
export const parsedProfileJsonSchema = schema;

