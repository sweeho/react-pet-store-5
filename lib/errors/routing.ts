export interface FailureBody {
  kind: string;
  screen: string | null;
  message: string;
  missing?: string[];
}

export const ERROR_SCREENS: [new (...args: never[]) => Error, string, number][] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- red-phase stub
export function failureResponse(_error: unknown): { status: number; body: FailureBody } {
  throw new Error("VortexNotImplemented");
}
