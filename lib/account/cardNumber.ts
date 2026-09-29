const MASK_PREFIX = "•••• •••• •••• ";

export function toLastFour(cardNumber: string): string {
  return cardNumber.replace(/\D/g, "").slice(-4);
}

export function maskCardNumber(lastFour: string): string {
  return lastFour ? `${MASK_PREFIX}${lastFour}` : "";
}

export function isMaskedCardNumber(value: string): boolean {
  return value.startsWith(MASK_PREFIX) && /^\d{1,4}$/.test(value.slice(MASK_PREFIX.length));
}
