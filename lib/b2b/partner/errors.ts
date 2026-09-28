/**
 * SWHR-R-0047 / R2's SME ruling: unlike every other document type (which
 * logs a schema violation and continues, SD-9), a partner supplier order
 * that fails validation is rejected outright so it is never persisted —
 * `errors` carries the schema violations for the caller to log.
 */
export class DocumentInvalidError extends Error {
  errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = "DocumentInvalidError";
    this.errors = errors;
  }
}
