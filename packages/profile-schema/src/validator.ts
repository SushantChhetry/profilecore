import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import schema from "../profile.schema.json";
import type { ParsedProfile } from "./types";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

const validator = ajv.compile<ParsedProfile>(schema);

export function validateParsedProfile(value: unknown): value is ParsedProfile {
  return validator(value);
}

export function assertParsedProfile(value: unknown): ParsedProfile {
  if (validator(value)) {
    return value;
  }

  const details = validator.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
  throw new Error(`Parsed profile validation failed: ${details ?? "unknown error"}`);
}

export function getParsedProfileValidationErrors(): string[] {
  return (validator.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`);
}
