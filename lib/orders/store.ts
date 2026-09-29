export interface StoredOrder {
  orderId: string;
  userId: string;
  emailId: string;
  orderDate: Date;
  locale: string;
  totalValue: number;
  status: string;
  contact: { givenName: string; familyName: string; telephone: string; email: string | null };
  address: {
    streetName1: string;
    streetName2: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  card: { cardNumber: string; cardType: string; expiryDate: string };
  lines: {
    lineNum: number;
    categoryId: string;
    productId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export function persistPurchaseOrder(): void {
  throw new Error("VortexNotImplemented");
}

export function getStoredOrder(): StoredOrder | null {
  throw new Error("VortexNotImplemented");
}
