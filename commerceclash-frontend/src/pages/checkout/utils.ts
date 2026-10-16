export const formatPrice = (amount: number, currency: string) =>
  `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;

export const getErrorMessage = (err: unknown, fallback: string): string =>
  err !== null &&
  typeof err === "object" &&
  "message" in err &&
  typeof (err as { message?: unknown }).message === "string"
    ? (err as { message: string }).message
    : fallback;
