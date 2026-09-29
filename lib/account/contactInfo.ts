import type { AddressValue, ContactInfoValue, Executor } from "./types";

export type ContactParts = Pick<
  ContactInfoValue,
  "givenName" | "familyName" | "telephone" | "email"
>;
export type ContactField = keyof ContactParts;

export function createAddress(_value?: AddressValue, _tx?: Executor): number {
  throw new Error("VortexNotImplemented");
}
export function createContactInfoFromValue(_value: ContactInfoValue, _tx?: Executor): number {
  throw new Error("VortexNotImplemented");
}
export function createContactInfoFromParts(
  _parts: ContactParts,
  _addressId: number,
  _tx?: Executor,
): number {
  throw new Error("VortexNotImplemented");
}
export function createEmptyContactInfo(_tx?: Executor): number {
  throw new Error("VortexNotImplemented");
}
export function getContactInfo(_contactInfoId: number, _tx?: Executor): ContactInfoValue | null {
  throw new Error("VortexNotImplemented");
}
export function updateContactField(
  _contactInfoId: number,
  _field: ContactField,
  _value: string,
  _tx?: Executor,
): void {
  throw new Error("VortexNotImplemented");
}
