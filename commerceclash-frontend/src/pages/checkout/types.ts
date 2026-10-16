export type PriceInfo = { amount: number; currency: string };
export type PriceStatus = "loading" | "error" | "ready";
export type GetPriceResponse = { success: boolean } & PriceInfo;
export type CreatePaymentIntentResponse = {
  success: boolean;
  clientSecret: string | null;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
};
export type PaymentSuccessInfo = { email: string };
export type PendingPaymentInfo = {
  paymentIntentId: string;
  email: string;
  price?: PriceInfo;
};
export type CardFieldName = "number" | "expiry" | "cvc";

export const STRIPE_PRICE_QUERY_KEY = ["stripe-price"] as const;
