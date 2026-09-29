/** A supplier invoice could not be built; the order is skipped, not the whole update. */
export class InvoiceBuildError extends Error {
  constructor(cause: unknown) {
    super("Supplier invoice could not be built", { cause });
    this.name = "InvoiceBuildError";
  }
}
