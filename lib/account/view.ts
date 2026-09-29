/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */
import type { AccountStatus, ContactInfoValue, CustomerAccount, ProfileValue } from "./types";

// Client-safe (no db import): the shape GET/PUT /api/account return. The
// card number is only ever the masked last four (design.md P3).
export interface AccountView {
  userId: string;
  status: AccountStatus;
  contactInfo: ContactInfoValue;
  creditCard: {
    cardNumberMasked: string;
    cardType: string;
    expiryMonth: string;
    expiryYear: string;
  };
  profile: ProfileValue;
}

export function toAccountView(_account: CustomerAccount): AccountView {
  throw new Error("VortexNotImplemented");
}
