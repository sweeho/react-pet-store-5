import type { CreditCardValue } from "../account/types";
import { maskCardNumber } from "../account/cardNumber";
import { composeExpiry, expiryMonth, expiryYear } from "../account/expiry";
import type { CreditCard } from "../b2b/elements/creditCard";

/** OQ-1: the order card is the account's card, masked, expiry as MM/YYYY. */
export function orderCardFromAccount(card: CreditCardValue): CreditCard {
  return {
    cardNumber: maskCardNumber(card.cardLastFour),
    cardType: card.cardType,
    expiryDate: composeExpiry(expiryMonth(card.expiryDate), expiryYear(card.expiryDate)),
  };
}
