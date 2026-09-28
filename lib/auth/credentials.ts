import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { users } from "../../db/schema";
import { hashPassword, verifyPassword } from "./password";

// Sign-on (design.md P3): user id at most 25 characters, no `%` or `*`.
export const USER_ID_MAX_LENGTH = 25;

const DEFAULT_PASSWORD_MAX_LENGTH = 25;

// Sign-on (design.md P3, SD-4): SIGNON_PASSWORD_MAX_LENGTH, provisional
// default 25 pending the OQ-1 ruling (SWHR-T-0049).
export function getPasswordMaxLength(): number {
  const raw = process.env.SIGNON_PASSWORD_MAX_LENGTH;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PASSWORD_MAX_LENGTH;
}

export type CredentialError =
  | "missing"
  | "user-id-too-long"
  | "user-id-wildcard"
  | "password-too-long"
  | "duplicate";

// Sign-on (design.md P3): empty values return "missing" first.
export function validateUserId(userId: string): CredentialError | null {
  if (!userId) {
    return "missing";
  }
  if (userId.length > USER_ID_MAX_LENGTH) {
    return "user-id-too-long";
  }
  if (userId.includes("%") || userId.includes("*")) {
    return "user-id-wildcard";
  }
  return null;
}

export function validatePassword(password: string): CredentialError | null {
  if (!password) {
    return "missing";
  }
  if (password.length > getPasswordMaxLength()) {
    return "password-too-long";
  }
  return null;
}

export async function createCredential(
  userId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: CredentialError }> {
  const userIdError = validateUserId(userId);
  if (userIdError) {
    return { ok: false, error: userIdError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const passwordHash = await hashPassword(password);
  const inserted = db
    .insert(users)
    .values({ userId, passwordHash })
    .onConflictDoNothing()
    .returning()
    .get();

  if (!inserted) {
    return { ok: false, error: "duplicate" };
  }

  return { ok: true };
}

// SWHR-R-0061: unknown user id fails without raising.
export async function authenticate(userId: string, password: string): Promise<boolean> {
  const user = db.select().from(users).where(eq(users.userId, userId)).get();
  if (!user) {
    return false;
  }
  return verifyPassword(password, user.passwordHash);
}
