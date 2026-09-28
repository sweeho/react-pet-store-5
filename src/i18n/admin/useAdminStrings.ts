import { de } from "./de";
import { en } from "./en";
import type { AdminStrings } from "./types";

// SD-5: the rebuild admin is an SPA page, not a Swing client with a JVM
// default locale — navigator.language is that analogue. Falls back to
// English for anything other than German.
export function useAdminStrings(): AdminStrings {
  const language = typeof navigator !== "undefined" ? navigator.language : "";
  return language.toLowerCase().startsWith("de") ? de : en;
}
