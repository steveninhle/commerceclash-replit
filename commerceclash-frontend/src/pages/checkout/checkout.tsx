import { useCallback, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { AlertCircle } from "lucide-react";
import { CardStripe } from "@/components/ui/cart-stripe";
import { StateMessage } from "@/components/ui/state-message";
import { get, END_POINTS } from "@/api";
import { CheckoutFlowLayout } from "@/pages/chooseClass/CheckoutFlowLayout";
import { Footer } from "@/pages/chooseClass/Footer";
import type { Cohort } from "@/pages/chooseClass/types";
import { CheckoutForm } from "./CheckoutForm";
import { PaymentSuccessCard } from "./PaymentSuccessCard";
import { PaymentProcessingCard } from "./PaymentProcessingCard";
import { stripePromise } from "./stripeConfig";
import {
  STRIPE_PRICE_QUERY_KEY,
  type GetPriceResponse,
  type PaymentSuccessInfo,
  type PendingPaymentInfo,
  type PriceInfo,
  type PriceStatus,
} from "./types";

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutState = location.state as {
    cohort?: Cohort;
    pendingPayment?: PendingPaymentInfo;
  } | null;
  const cohort = checkoutState?.cohort;
  const pendingPayment = checkoutState?.pendingPayment;

  const [successInfo, setSuccessInfo] = useState<PaymentSuccessInfo | null>(
    null,
  );
  const [checkoutPrice, setCheckoutPrice] = useState<PriceInfo | null>(null);

  const handleEnrollmentComplete = useCallback(() => {
    if (pendingPayment) {
      setSuccessInfo({ email: pendingPayment.email });
    }
  }, [pendingPayment]);

  const priceQuery = useQuery({
    queryKey: STRIPE_PRICE_QUERY_KEY,
    enabled: !!cohort,
    queryFn: async (): Promise<PriceInfo> => {
      const res: GetPriceResponse = await get(END_POINTS.STRIPE_PRICE);
      return { amount: res.amount, currency: res.currency };
    },
  });
  const price =
    pendingPayment?.price ?? checkoutPrice ?? priceQuery.data ?? null;
  const priceStatus: PriceStatus =
    pendingPayment?.price || checkoutPrice
      ? "ready"
      : priceQuery.isPending
        ? "loading"
        : priceQuery.isError
          ? "error"
          : "ready";

  if (!cohort) {
    return <Navigate to="/choose-class" replace />;
  }

  const handlePaymentSubmitted = (payment: PendingPaymentInfo) => {
    // Browser history state survives a refresh, so an accepted payment resumes
    // enrollment confirmation instead of returning to the payment form.
    navigate(location.pathname, {
      replace: true,
      state: { ...checkoutState, pendingPayment: payment },
    });
  };

  return (
    <CheckoutFlowLayout currentStep={successInfo ? 2 : 1} footer={<Footer />}>
      {successInfo ? (
        <PaymentSuccessCard
          cohort={cohort}
          price={price}
          priceStatus={priceStatus}
          email={successInfo.email}
        />
      ) : pendingPayment ? (
        <PaymentProcessingCard
          key={pendingPayment.paymentIntentId}
          paymentIntentId={pendingPayment.paymentIntentId}
          onCompleted={handleEnrollmentComplete}
        />
      ) : stripePromise ? (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            cohort={cohort}
            price={price}
            priceStatus={priceStatus}
            onRetryPrice={() => priceQuery.refetch()}
            onPaymentSubmitted={handlePaymentSubmitted}
            onPriceResolved={setCheckoutPrice}
          />
        </Elements>
      ) : (
        <CardStripe className="p-4 sm:p-5">
          <StateMessage
            icon={AlertCircle}
            tone="danger"
            title="Payment isn't available right now"
            description="This environment is missing its Stripe configuration. Please contact support or try again later."
          />
        </CardStripe>
      )}
    </CheckoutFlowLayout>
  );
};
