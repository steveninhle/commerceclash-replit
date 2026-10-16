import { useEffect, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementChangeEvent } from "@stripe/stripe-js";
import { AlertCircle, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { CardStripe } from "@/components/ui/cart-stripe";
import { PillButton } from "@/components/ui/pill-button";
import { get, post, END_POINTS } from "@/api";
import { formatDate } from "@/pages/chooseClass/format";
import { isValidEmail } from "@/pages/chooseClass/validation";
import type { Cohort } from "@/pages/chooseClass/types";
import { CheckoutField } from "./CheckoutField";
import { CardField, PaymentMethodIcons } from "./CardField";
import { PriceValue } from "./PriceValue";
import { CARD_ELEMENT_OPTIONS, CHECKOUT_FORM_ID } from "./stripeConfig";
import type {
  CardFieldName,
  CreatePaymentIntentResponse,
  PendingPaymentInfo,
  PriceInfo,
  PriceStatus,
} from "./types";
import { formatPrice } from "./utils";
import { getCheckoutId, isPaymentSubmitted } from "./checkoutIdentity";
import LoadingOverlay from "@/components/ui/loading-overplay";

type CheckoutFormProps = {
  cohort?: Cohort;
  price: PriceInfo | null;
  priceStatus: PriceStatus;
  onRetryPrice: () => void;
  onPaymentSubmitted: (payment: PendingPaymentInfo) => void;
  onPriceResolved: (price: PriceInfo) => void;
};

export const CheckoutForm = ({
  cohort,
  price,
  priceStatus,
  onRetryPrice,
  onPaymentSubmitted,
  onPriceResolved,
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<CardFieldName | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CardFieldName, string>>
  >({});
  const [fieldComplete, setFieldComplete] = useState<
    Record<CardFieldName, boolean>
  >({
    number: false,
    expiry: false,
    cvc: false,
  });

  const [emailCheck, setEmailCheck] = useState<{
    status: "idle" | "checking" | "duplicate";
    message?: string;
  }>({ status: "idle" });

  const submissionLock = useRef(false);

  const emailIsValid = isValidEmail(email);
  const emailError =
    emailCheck.status === "duplicate"
      ? emailCheck.message
      : emailTouched
        ? email.trim().length === 0
          ? "Email is required"
          : !emailIsValid
            ? "Enter a valid email address"
            : null
        : null;

  useEffect(() => {
    if (!cohort || !emailIsValid) {
      setEmailCheck({ status: "idle" });
      return;
    }

    setEmailCheck({ status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await get(END_POINTS.STRIPE_CHECK_EMAIL, {
          cohortId: cohort.id,
          email,
        });
        setEmailCheck(
          res?.available === false
            ? { status: "duplicate", message: res.message }
            : { status: "idle" },
        );
      } catch {
        setEmailCheck({ status: "idle" });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cohort, email, emailIsValid]);

  const handleEmailBlur = () => {
    setEmailTouched(true);
  };

  const handleFieldChange =
    (field: CardFieldName) => (event: StripeElementChangeEvent) => {
      setFieldErrors((prev) => ({ ...prev, [field]: event.error?.message }));
      setFieldComplete((prev) => ({ ...prev, [field]: event.complete }));
    };

  const allFieldsComplete =
    fieldComplete.number && fieldComplete.expiry && fieldComplete.cvc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !stripe ||
      !elements ||
      submissionLock.current ||
      !cohort ||
      !emailIsValid ||
      emailCheck.status === "duplicate" ||
      !price ||
      priceStatus !== "ready"
    )
      return;
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) return;

    // A ref takes effect synchronously, including two clicks before React renders.
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    const submittedEmail = email.trim().toLowerCase();
    let accepted = false;

    try {
      const checkoutId = await getCheckoutId(
        window.localStorage,
        cohort.id,
        submittedEmail,
        navigator.locks
          ? (key, work) => navigator.locks.request(key, work)
          : undefined,
      );
      const intent: CreatePaymentIntentResponse = await post(
        END_POINTS.STRIPE_PAYMENT_INTENT,
        {
          checkoutId,
          cohortId: cohort.id,
          email: submittedEmail,
          name: name.trim() || undefined,
        },
      );
      const intentPrice = { amount: intent.amount, currency: intent.currency };
      onPriceResolved(intentPrice);

      const finish = (
        paymentIntentId: string,
        receiptEmail = submittedEmail,
      ) => {
        accepted = true;
        onPaymentSubmitted({
          paymentIntentId,
          email: receiptEmail,
          price: intentPrice,
        });
      };
      if (isPaymentSubmitted(intent.status)) {
        finish(intent.paymentIntentId);
        return;
      }
      if (
        price.amount !== intent.amount ||
        price.currency !== intent.currency
      ) {
        setError(
          "The checkout total has changed. Review the updated total and click Enroll & Pay Now to continue.",
        );
        return;
      }
      if (!intent.clientSecret)
        throw new Error("Unable to prepare your payment. Please try again.");

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(intent.clientSecret, {
          payment_method: { card: cardNumberElement },
        });
      // Another tab may have confirmed this same intent while this request was
      // in flight. An already accepted payment must only resume confirmation.
      const confirmed = paymentIntent ?? confirmError?.payment_intent;
      if (confirmed && isPaymentSubmitted(confirmed.status)) {
        finish(confirmed.id, confirmed.receipt_email ?? submittedEmail);
        return;
      }
      setError(
        confirmError?.message ??
          "Payment could not be completed. Please try a different payment method.",
      );
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to prepare your payment. Please try again.";
      setError(message);
    } finally {
      if (!accepted) {
        submissionLock.current = false;
        setSubmitting(false);
      }
    }
  };

  const submitDisabled =
    !stripe ||
    !elements ||
    !allFieldsComplete ||
    !price ||
    priceStatus !== "ready" ||
    submitting ||
    emailCheck.status === "duplicate";
  const priceLabel = price ? formatPrice(price.amount, price.currency) : "—";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[6fr_4fr]">
      <CardStripe className="animate-in fade-in slide-in-from-bottom-4 p-4 duration-300 sm:p-5">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Student Information
        </h2>

        {!cohort && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              No class selected. Please go back to{" "}
              <a href="/choose-class" className="font-semibold underline">
                Choose a Class Time
              </a>{" "}
              and pick one first.
            </span>
          </p>
        )}

        <form
          id={CHECKOUT_FORM_ID}
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-5"
        >
          <CheckoutField
            id="checkout-name"
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Jane Doe"
            autoComplete="name"
            required
            disabled={submitting}
          />

          <div className="flex flex-col gap-1.5">
            <CheckoutField
              id="checkout-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              autoComplete="email"
              error={emailError}
              required
              disabled={submitting}
            />
            {/* {!emailError && emailCheck.status === "checking" && (
              <p className="-mt-1 text-xs text-gray-400">
                Checking availability…
              </p>
            )} */}
          </div>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Enter Card Details
            </h3>

            <CardField
              label="Card Number"
              focused={focusedField === "number"}
              error={fieldErrors.number}
              rightSlot={<PaymentMethodIcons />}
            >
              <CardNumberElement
                options={{ ...CARD_ELEMENT_OPTIONS, disabled: submitting }}
                onFocus={() => setFocusedField("number")}
                onBlur={() => setFocusedField(null)}
                onChange={handleFieldChange("number")}
              />
            </CardField>

            <div className="grid grid-cols-2 gap-4">
              <CardField
                label="Expiration Date"
                focused={focusedField === "expiry"}
                error={fieldErrors.expiry}
              >
                <CardExpiryElement
                  options={{ ...CARD_ELEMENT_OPTIONS, disabled: submitting }}
                  onFocus={() => setFocusedField("expiry")}
                  onBlur={() => setFocusedField(null)}
                  onChange={handleFieldChange("expiry")}
                />
              </CardField>

              <CardField
                label="CVV"
                focused={focusedField === "cvc"}
                error={fieldErrors.cvc}
              >
                <CardCvcElement
                  options={{ ...CARD_ELEMENT_OPTIONS, disabled: submitting }}
                  onFocus={() => setFocusedField("cvc")}
                  onBlur={() => setFocusedField(null)}
                  onChange={handleFieldChange("cvc")}
                />
              </CardField>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] leading-none font-bold text-white"
                aria-hidden="true"
              >
                i
              </span>
              <p className="text-sm text-gray-500">
                Your payment will be securely processed, and you&apos;ll receive
                a confirmation email once completed. Enjoy all the benefits of
                your new subscription!
              </p>
            </div>
          </div>
        </form>
      </CardStripe>

      <CardStripe
        className="h-fit animate-in fade-in slide-in-from-bottom-4 p-4 duration-300 sm:p-5"
        style={{ animationDelay: "0.08s", animationFillMode: "backwards" }}
      >
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Course Summary
        </h2>

        {cohort ? (
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Program</dt>
              <dd className="text-right font-semibold text-gray-900">
                {cohort.name}
              </dd>
            </div>
            {(cohort.program_name || cohort.level) && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Track</dt>
                <dd className="text-right font-semibold text-gray-900">
                  {[cohort.program_name, cohort.level]
                    .filter(Boolean)
                    .join(" · ")}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Start date</dt>
              <dd className="font-semibold text-gray-900">
                {formatDate(cohort.start_date)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">End date</dt>
              <dd className="font-semibold text-gray-900">
                {formatDate(cohort.end_date)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Group size</dt>
              <dd className="font-semibold text-gray-900">
                {cohort.max_students} students max
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-500">Availability</dt>
              <dd className="font-semibold text-gray-900">
                {cohort.available_spots > 0
                  ? `${cohort.available_spots} spots left`
                  : "Full"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-5 text-sm text-gray-500">
            Select a class on the previous step to see its details here.
          </p>
        )}

        <hr className="my-5 border-[#E3E3E3]" />

        <h3 className="text-lg font-bold text-gray-900">Price Details</h3>

        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Subtotal</dt>
            <dd>
              <PriceValue
                status={priceStatus}
                label={priceLabel}
                onRetry={onRetryPrice}
                className="font-semibold text-gray-900"
              />
            </dd>
          </div>
        </div>

        <hr className="my-5 border-[#E3E3E3]" />
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-bold text-gray-900">Total</span>
            <PriceValue
              status={priceStatus}
              label={priceLabel}
              onRetry={onRetryPrice}
              className="text-base font-bold text-gray-900"
            />
          </div>
          <div className="mt-[16px]">
            <PillButton
              type="submit"
              form={CHECKOUT_FORM_ID}
              className="mt-5 flex items-center justify-center gap-2"
              disabled={submitDisabled}
            >
              <span>Enroll & Pay Now</span>

              {submitting && (
                <LoadingOverlay size={4} className="loading-gradient" />
              )}
            </PillButton>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-y-[4px] text-center text-xs text-gray-500">
          <p className="flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout with Stripe
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
            No hidden fees · 100% money-back guarantee
          </p>
        </div>
      </CardStripe>
    </div>
  );
};
