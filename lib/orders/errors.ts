export class DuplicateOrderError extends Error {
  constructor(public readonly orderId: string) {
    super(`Purchase order ${orderId} already exists.`);
    this.name = "DuplicateOrderError";
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export class OrderNotFoundError extends Error {
  constructor(_orderId: string) {
    super("VortexNotImplemented");
    throw new Error("VortexNotImplemented");
  }
}

export class WorkflowCreateError extends Error {
  constructor(_orderId: string) {
    super("VortexNotImplemented");
    throw new Error("VortexNotImplemented");
  }
}
