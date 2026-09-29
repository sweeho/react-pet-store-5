export class DuplicateOrderError extends Error {
  constructor(public readonly orderId: string) {
    super(`Purchase order ${orderId} already exists.`);
    this.name = "DuplicateOrderError";
  }
}
