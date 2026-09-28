import type { LocaleId } from "../../lib/locale/model";
import { useLocale } from "./LocaleProvider";

/**
 * Every screen exports `en_US` plus whichever other supported locales it
 * has content for (D3, P3). `en_US` is optional in the type only because
 * TypeScript can't otherwise express "at least one of these keys" — every
 * real screen file provides it, and `resolveScreen` treats one missing as a
 * registry bug, not a runtime fallback source.
 */
export type ScreenDefinition = Partial<Record<string, Record<string, string>>> & {
  en_US?: Record<string, string>;
};

export class ScreenNotFoundError extends Error {
  constructor(name: string) {
    super(`Definition for screen ${name} not found`);
    this.name = "ScreenNotFoundError";
  }
}

const modules = import.meta.glob("./screens/*.ts", { eager: true }) as Record<
  string,
  { default: ScreenDefinition }
>;

const SCREEN_NAME = /^\.\/screens\/(.+)\.ts$/;

const SCREENS: Record<string, ScreenDefinition> = {};
for (const [path, mod] of Object.entries(modules)) {
  const name = path.match(SCREEN_NAME)?.[1];
  if (name) {
    SCREENS[name] = mod.default;
  }
}

/**
 * The requested locale's content, else `en_US`, else `undefined` (D3,
 * SWHR-R-0013 — covers both "this locale isn't installed at all" and "this
 * one screen hasn't been translated into an otherwise-installed locale").
 * Exported separately from `resolveScreen` so the fallback rule is testable
 * against a literal `ScreenDefinition` without needing a registry entry.
 */
export function pickScreenContent(
  screen: ScreenDefinition | undefined,
  locale: LocaleId,
): Record<string, string> | undefined {
  return screen?.[locale] ?? screen?.en_US;
}

/**
 * Requested locale, else `en_US`, else "not found" (D3, SWHR-R-0013). A
 * screen with no content in the requested locale AND no `en_US` content is
 * indistinguishable from a screen that was never registered — both are a
 * registry gap, so both raise the same error.
 */
export function resolveScreen(name: string, locale: LocaleId): Record<string, string> {
  const content = pickScreenContent(SCREENS[name], locale);

  if (!content) {
    throw new ScreenNotFoundError(name);
  }

  return content;
}

export function useScreen(name: string): Record<string, string> {
  const { locale } = useLocale();
  return resolveScreen(name, locale);
}
