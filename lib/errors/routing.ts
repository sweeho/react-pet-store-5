import {
  DuplicateAccountFailure,
  EmptyCartFailure,
  GeneralFailure,
  MissingFormDataFailure,
} from "./failures";

export interface FailureBody {
  kind: string;
  screen: string | null;
  message: string;
  missing?: string[];
}

type ErrorClass = abstract new (...args: never[]) => Error;

// The first entry the error is an instance of wins, so a subtype is covered
// by its parent's entry.
export const ERROR_SCREENS: readonly (readonly [ErrorClass, string, number])[] = [
  [EmptyCartFailure, "/order-error", 409],
  [DuplicateAccountFailure, "/user-creation-error", 409],
  [GeneralFailure, "/error", 400],
];

function kindOf(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const { kind, name } = error as { kind?: unknown; name?: unknown };
    if (typeof kind === "string") return kind;
    if (typeof name === "string") return name;
  }
  return "Unknown";
}

export function failureResponse(error: unknown): { status: number; body: FailureBody } {
  const kind = kindOf(error);
  for (const [failureClass, screen, status] of ERROR_SCREENS) {
    if (error instanceof failureClass) {
      const body: FailureBody = { kind, screen, message: error.message };
      if (error instanceof MissingFormDataFailure) body.missing = error.missing;
      return { status, body };
    }
  }
  return { status: 500, body: { kind, screen: null, message: `Unhandled failure: ${kind}` } };
}
