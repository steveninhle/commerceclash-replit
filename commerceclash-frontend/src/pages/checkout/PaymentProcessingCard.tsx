import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { END_POINTS } from "@/api";
import { axiosInstance } from "@/api/axiosInstance";
import { CardStripe } from "@/components/ui/cart-stripe";
import { PillButton } from "@/components/ui/pill-button";
import { waitForEnrollment, type EnrollmentStatus } from "./enrollmentStatus";

type PaymentProcessingCardProps = {
  paymentIntentId: string;
  onCompleted: () => void;
};

export const PaymentProcessingCard = ({
  paymentIntentId,
  onCompleted,
}: PaymentProcessingCardProps) => {
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setTimedOut(false);

    void waitForEnrollment(
      async (signal) => {
        const response = await axiosInstance.get<EnrollmentStatus>(
          END_POINTS.STRIPE_SESSION_STATUS,
          { params: { sessionId: paymentIntentId }, signal },
        );
        return response.data;
      },
      { signal: controller.signal },
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result === "completed") {
        onCompleted();
      } else if (result === "timeout") {
        setTimedOut(true);
      }
    });

    return () => controller.abort();
  }, [paymentIntentId, attempt, onCompleted]);

  return (
    <CardStripe
      padded={false}
      className="mx-auto w-full max-w-xl overflow-hidden border border-white/80 text-center shadow-[0_16px_60px_-24px_rgba(16,92,70,0.25)]"
    >
      <div
        className={`relative overflow-hidden px-6 pt-9 pb-8 sm:px-10 sm:pt-11 ${
          timedOut
            ? "bg-gradient-to-b from-amber-50 to-white"
            : "bg-gradient-to-b from-[#EDFCF5] to-white"
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full blur-3xl ${
            timedOut ? "bg-amber-100/60" : "bg-[#93FF74]/20"
          }`}
        />
        <div
          aria-hidden="true"
          className="relative mx-auto flex h-24 w-24 items-center justify-center"
        >
          <div
            className={`absolute inset-0 rounded-full border ${
              timedOut ? "border-amber-200" : "border-emerald-100"
            }`}
          />
          {!timedOut && (
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500/30 [animation-duration:2s] motion-reduce:animate-none" />
          )}
          <div
            className={`flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-sm ${
              timedOut
                ? "bg-white text-amber-600"
                : "bg-gradient-to-br from-[#7BFFD8] to-[#93FF74] text-emerald-950"
            }`}
          >
            {timedOut ? (
              <Clock3 className="h-8 w-8" strokeWidth={1.5} />
            ) : (
              <ShieldCheck className="h-8 w-8" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="relative mt-6 space-y-3" role="status" aria-live="polite">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              timedOut
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-100 bg-white text-emerald-800"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                timedOut
                  ? "bg-amber-500"
                  : "animate-pulse bg-emerald-500 motion-reduce:animate-none"
              }`}
            />
            {timedOut ? "Awaiting confirmation" : "Checkout in progress"}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {timedOut ? "A little more time" : "Finishing your checkout"}
          </h2>
          <p className="text-sm leading-6 text-gray-500 sm:text-base">
            {timedOut
              ? "Confirmation is taking longer than expected. Your enrollment is still pending — check again for an update."
              : "We’re confirming your payment and getting your enrollment ready. Hang tight — we’ll update this page automatically."}
          </p>
        </div>
      </div>

      <div className="px-6 pb-7 sm:px-10 sm:pb-9">
        <ol className="rounded-2xl border border-gray-100 bg-[#FAFCFB] p-5 text-left">
          <li className="relative flex gap-4 pb-6">
            <span
              aria-hidden="true"
              className="absolute top-9 bottom-1 left-4 w-px bg-emerald-200"
            />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="space-y-1 pt-0.5">
              <h3 className="text-sm font-semibold text-gray-900">
                Payment submitted
              </h3>
              <p className="text-xs leading-5 text-gray-500">
                Your payment details have been sent securely.
              </p>
            </div>
          </li>
          <li className="flex gap-4" aria-current="step">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                timedOut
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {timedOut ? (
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <LoaderCircle
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
            </span>
            <div className="space-y-1 pt-0.5">
              <h3 className="text-sm font-semibold text-gray-900">
                Confirming your enrollment
              </h3>
              <p className="text-xs leading-5 text-gray-500">
                {timedOut
                  ? "We’re still waiting for final confirmation."
                  : "Waiting for payment confirmation to complete your enrollment."}
              </p>
            </div>
          </li>
        </ol>

        {timedOut && (
          <div className="mt-6">
            <PillButton
              onClick={() => setAttempt((value) => value + 1)}
              className="focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4 motion-reduce:transition-none motion-reduce:hover:scale-100"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              Check again
            </PillButton>
            <p className="pt-3 text-xs leading-5 text-gray-500">
              Checking again won’t charge you again.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100 pt-5 text-xs text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Secure checkout powered by Stripe</span>
        </div>
      </div>
    </CardStripe>
  );
};
