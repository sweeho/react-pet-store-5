import type { AuthSession } from "./session";

export async function requireAdminDataSession(): Promise<AuthSession | null> {
  throw new Error("VortexNotImplemented");
}
