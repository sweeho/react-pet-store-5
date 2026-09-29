import { maskCardNumber } from "./cardNumber";
import { expiryMonth, expiryYear } from "./expiry";
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

export function toAccountView(account: CustomerAccount): AccountView {
  const { cardLastFour, cardType, expiryDate } = account.creditCard;
  return {
    userId: account.userId,
    status: account.status,
    contactInfo: account.contactInfo,
    creditCard: {
      cardNumberMasked: maskCardNumber(cardLastFour),
      cardType,
      expiryMonth: expiryMonth(expiryDate),
      expiryYear: expiryYear(expiryDate),
    },
    profile: account.profile,
  };
}
