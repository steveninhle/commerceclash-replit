import {
  loadStripe,
  type StripeCardNumberElementOptions,
} from "@stripe/stripe-js";
import { CHECKOUT_INPUT_TOKENS } from "./CheckoutField";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_STYLE: NonNullable<StripeCardNumberElementOptions["style"]> =
  {
    base: {
      fontSize: CHECKOUT_INPUT_TOKENS.fontSize,
      color: CHECKOUT_INPUT_TOKENS.text,
      fontFamily: "inherit",
      "::placeholder": {
        color: CHECKOUT_INPUT_TOKENS.placeholder,
      },
    },
    invalid: {
      color: CHECKOUT_INPUT_TOKENS.danger,
    },
  };

export const CARD_ELEMENT_OPTIONS: StripeCardNumberElementOptions = {
  style: CARD_ELEMENT_STYLE,
  disableLink: true,
};

export const CHECKOUT_FORM_ID = "checkout-payment-form";
