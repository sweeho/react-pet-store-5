import type {
  AccountStatus,
  ContactInfoValue,
  CreditCardValue,
  CustomerAccount,
  Executor,
  Tx,
} from "./types";

export function createCustomer(_userId: string, _tx?: Tx): void {
  throw new Error("VortexNotImplemented");
}
export function createAccount(
  _userId: string,
  _value: { status: AccountStatus; contactInfo: ContactInfoValue; creditCard: CreditCardValue },
  _tx?: Executor,
): number {
  throw new Error("VortexNotImplemented");
}
export function getCustomerAccount(_userId: string): CustomerAccount | null {
  throw new Error("VortexNotImplemented");
}
export function listCustomers(): string[] {
  throw new Error("VortexNotImplemented");
}
export function replaceCustomerAccount(
  _userId: string,
  _value: Pick<CustomerAccount, "contactInfo" | "creditCard" | "profile">,
  _tx?: Tx,
): void {
  throw new Error("VortexNotImplemented");
}
export function deleteCustomer(_userId: string): void {
  throw new Error("VortexNotImplemented");
}
