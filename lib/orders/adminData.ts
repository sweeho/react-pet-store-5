export interface OrderSummary {
  orderId: string;
  userId: string;
  date: string;
  amount: string;
  status: string;
}

export function listOrdersByStatus(): { orders: OrderSummary[]; total: number } {
  throw new Error("VortexNotImplemented");
}

export function queueDecisions(): number {
  throw new Error("VortexNotImplemented");
}

export function salesReport(): { groups: { name: string; value: string }[]; total: string } {
  throw new Error("VortexNotImplemented");
}

export function parseReportDate(): Date | null {
  throw new Error("VortexNotImplemented");
}
