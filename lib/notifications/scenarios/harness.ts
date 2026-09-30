import type { MailTransport } from "../transport";

/* eslint-disable @typescript-eslint/no-unused-vars */
export function setUpScenario(
  transport: MailTransport,
  log: (message: string, error: unknown) => void,
): void {
  throw new Error("VortexNotImplemented");
}

export const runGeneralPass = async (): Promise<{ delivered: number; failed: number }> => {
  throw new Error("VortexNotImplemented");
};

export const runMailPass = async (): Promise<{ delivered: number; failed: number }> => {
  throw new Error("VortexNotImplemented");
};

export async function settleAll(): Promise<void> {
  throw new Error("VortexNotImplemented");
}
