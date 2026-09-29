export class DuplicateOrderError extends Error {
  constructor(public readonly orderId: string) {
    super(`Purchase order ${orderId} already exists.`);
    this.name = "DuplicateOrderError";
  }
}

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`No workflow record for order ${orderId}.`);
    this.name = "OrderNotFoundError";
  }
}

export class WorkflowCreateError extends Error {
  constructor(public readonly orderId: string) {
    super(`Workflow tracking already started for order ${orderId}.`);
    this.name = "WorkflowCreateError";
  }
}
