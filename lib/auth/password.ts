// Sign-on (design.md P2): Bun.password is argon2id by default. Verification
// is exact — case matters — and never logs a password (OQ-2).
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
