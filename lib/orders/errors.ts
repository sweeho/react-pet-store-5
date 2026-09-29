export class DuplicateOrderError extends Error {
  constructor(public readonly orderId: string) {
    super("VortexNotImplemented");
    throw new Error("VortexNotImplemented");
  }
}
