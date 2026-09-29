import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { addresses, contactInfos } from "../../db/schema";
import type { AddressValue, ContactInfoValue, Executor } from "./types";

export type ContactParts = Pick<
  ContactInfoValue,
  "givenName" | "familyName" | "telephone" | "email"
>;
export type ContactField = keyof ContactParts;

const EMPTY_ADDRESS: AddressValue = {
  streetName1: "",
  streetName2: null,
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

// Access decisions belong to the calling layer (R-0123): nothing here reads
// a session or a role.

// An address with no contact yet; `contactInfoId` is set when it is attached.
export function createAddress(value: AddressValue = EMPTY_ADDRESS, tx: Executor = db): number {
  return tx.insert(addresses).values(value).returning({ id: addresses.id }).get().id;
}

function insertContact(parts: ContactParts, accountId: number | null, tx: Executor): number {
  return tx
    .insert(contactInfos)
    .values({ ...parts, accountId })
    .returning({ id: contactInfos.id })
    .get().id;
}

export function createContactInfoFromValue(
  value: ContactInfoValue,
  tx: Executor = db,
  accountId: number | null = null,
): number {
  const { address, ...parts } = value;
  const id = insertContact(parts, accountId, tx);
  tx.insert(addresses)
    .values({ ...address, contactInfoId: id })
    .run();
  return id;
}

// Links the existing address itself rather than copying it (R-0121.02).
export function createContactInfoFromParts(
  parts: ContactParts,
  addressId: number,
  tx: Executor = db,
  accountId: number | null = null,
): number {
  const id = insertContact(parts, accountId, tx);
  tx.update(addresses).set({ contactInfoId: id }).where(eq(addresses.id, addressId)).run();
  return id;
}

export function createEmptyContactInfo(tx: Executor = db, accountId: number | null = null): number {
  return createContactInfoFromValue(
    { givenName: "", familyName: "", telephone: "", email: "", address: EMPTY_ADDRESS },
    tx,
    accountId,
  );
}

// Returns a detached copy: mutating it never touches the stored record.
export function getContactInfo(contactInfoId: number, tx: Executor = db): ContactInfoValue | null {
  const contact = tx.select().from(contactInfos).where(eq(contactInfos.id, contactInfoId)).get();
  if (!contact) return null;
  const address = tx
    .select()
    .from(addresses)
    .where(eq(addresses.contactInfoId, contactInfoId))
    .get();
  return {
    givenName: contact.givenName,
    familyName: contact.familyName,
    telephone: contact.telephone,
    email: contact.email,
    address: address
      ? {
          streetName1: address.streetName1,
          streetName2: address.streetName2,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        }
      : { ...EMPTY_ADDRESS },
  };
}

export function updateContactField(
  contactInfoId: number,
  field: ContactField,
  value: string,
  tx: Executor = db,
): void {
  tx.update(contactInfos)
    .set({ [field]: value })
    .where(eq(contactInfos.id, contactInfoId))
    .run();
}
