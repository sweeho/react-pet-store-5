import fs from "node:fs";
import path from "node:path";

import { createError, type H3Event } from "nitro/h3";

import type { AuthSession } from "./session";
import { getAuthSession, updateAuthSession } from "./session";

export interface ProtectedPage {
  name: string;
  path: string;
  roles: string[];
}

export interface ProtectionConfig {
  signOnPage: string;
  signOnErrorPage: string;
  protectedPages: ProtectedPage[];
}

// design.md P5: the account-change action, owned by customer-account.
export const ACCOUNT_CHANGE_PATH = "/account-edit";

interface RawProtectedPage {
  name: string;
  path: string;
  roles?: string[];
}

interface RawProtectionConfig {
  signOnPage: string;
  signOnErrorPage: string;
  protectedPages?: RawProtectedPage[];
}

/**
 * A duplicate protected-page name keeps the first path and logs a warning
 * (SWHR-R-0067). Roles are parsed but never enforced on the storefront
 * (SWHR-R-0068, OQ-3).
 */
export function loadProtectionConfig(
  raw: unknown,
  warn: (message: string) => void = (message) => console.warn(message),
): ProtectionConfig {
  const data = raw as RawProtectionConfig;
  const seenNames = new Set<string>();
  const protectedPages: ProtectedPage[] = [];

  for (const page of data.protectedPages ?? []) {
    if (seenNames.has(page.name)) {
      warn(
        `signon-config: duplicate protected page name "${page.name}" — keeping "${
          protectedPages.find((p) => p.name === page.name)?.path
        }", ignoring "${page.path}"`,
      );
      continue;
    }
    seenNames.add(page.name);
    protectedPages.push({ name: page.name, path: page.path, roles: page.roles ?? [] });
  }

  return {
    signOnPage: data.signOnPage,
    signOnErrorPage: data.signOnErrorPage,
    protectedPages,
  };
}

/** Reads `configs/signon-config.json`, or `SIGNON_CONFIG_PATH` when set. */
export function getProtectionConfig(): ProtectionConfig {
  const configPath =
    process.env.SIGNON_CONFIG_PATH ?? path.join(process.cwd(), "configs", "signon-config.json");
  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as unknown;
  return loadProtectionConfig(raw);
}

/** Exact match on the pathname after the application root; the query string never affects matching (SWHR-R-0066). */
export function isProtectedPath(config: ProtectionConfig, pathWithQuery: string): boolean {
  const pathname = pathWithQuery.split("?")[0];
  return config.protectedPages.some((page) => page.path === pathname);
}

/**
 * A signed-on session is authorised for every protected storefront page
 * regardless of that page's configured roles (SWHR-R-0068) — this function
 * never reads `roles`. An anonymous request for a protected page records
 * the request as the page to return to after sign-on (SWHR-R-0065).
 */
export async function checkGate(
  event: H3Event,
  pathWithQuery: string,
  config: ProtectionConfig = getProtectionConfig(),
): Promise<{ allowed: true } | { allowed: false; redirect: string }> {
  if (!isProtectedPath(config, pathWithQuery)) {
    return { allowed: true };
  }

  const session = await getAuthSession(event, "storefront");
  if (session.signedOn) {
    return { allowed: true };
  }

  await updateAuthSession(event, "storefront", { originalUrl: pathWithQuery });
  return { allowed: false, redirect: config.signOnPage };
}

export async function requireSignOn(event: H3Event): Promise<AuthSession> {
  const session = await getAuthSession(event, "storefront");
  if (!session.signedOn) {
    throw createError({ statusCode: 401, statusMessage: "Sign-on required" });
  }
  return session;
}
