import { Check } from "lucide-react";
import { CardStripe } from "@/components/ui/cart-stripe";
import { formatDate } from "@/pages/chooseClass/format";
import type { Cohort } from "@/pages/chooseClass/types";
import { PriceValue } from "./PriceValue";
import type { PriceInfo, PriceStatus } from "./types";
import { formatPrice } from "./utils";

const COURSE_FORMAT_LABEL = "Online";
const COURSE_DURATION_LABEL = "8 sessions · 75 min each";
const COURSE_ACCESS_INFO_LABEL = "We'll send all details to your email shortly";
const SUPPORT_EMAIL_PLACEHOLDER = "[support email]";

const EMAIL_INBOX_URL_BY_DOMAIN: Record<string, string> = {
  "gmail.com": "https://mail.google.com/mail/u/0/#inbox",
  "outlook.com": "https://outlook.live.com/mail/0/inbox",
  "live.com": "https://outlook.live.com/mail/0/inbox",
  "icloud.com": "https://www.icloud.com/mail",
};

const getEmailInboxUrl = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain && EMAIL_INBOX_URL_BY_DOMAIN[domain]
    ? EMAIL_INBOX_URL_BY_DOMAIN[domain]
    : `mailto:${email}`;
};

type PaymentSuccessCardProps = {
  cohort?: Cohort;
  price: PriceInfo | null;
  priceStatus: PriceStatus;
  email: string;
};

export const PaymentSuccessCard = ({
  cohort,
  price,
  priceStatus,
  email,
}: PaymentSuccessCardProps) => {
  const priceLabel = price ? formatPrice(price.amount, price.currency) : "—";

  return (
    <CardStripe className="mx-auto w-full max-w-xl animate-in fade-in zoom-in-95 p-4 text-center duration-300 sm:p-5">
      <div
        className="mx-auto flex h-16 w-16 animate-in items-center justify-center rounded-full bg-gradient-to-br from-[#7BFFD8] to-[#93FF74] zoom-in-50 duration-500 sm:h-20 sm:w-20"
        style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
      >
        <Check className="h-7 w-7 text-gray-900 sm:h-9 sm:w-9" />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-gray-900 sm:mt-6 sm:text-3xl">
        Payment Successful!
      </h2>
      <p className="mt-2 text-gray-500">
        You&apos;re now enrolled in{" "}
        {cohort ? cohort.name : "your selected program"}.
      </p>

      {cohort && (
        <>
          <hr className="my-4 border-[#E3E3E3] sm:my-6" />
          <div className="flex w-full flex-col gap-3 text-left text-sm">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="text-gray-500">Course start date</div>
              <div className="font-semibold text-gray-900">
                {formatDate(cohort.start_date)}
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-4">
              <div className="text-gray-500">Format</div>
              <div className="font-semibold text-gray-900">
                {COURSE_FORMAT_LABEL}
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-4">
              <div className="text-gray-500">Duration</div>
              <div className="font-semibold text-gray-900">
                {COURSE_DURATION_LABEL}
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-4">
              <div className="text-gray-500">Access info</div>
              <div className="font-semibold text-gray-900">
                {COURSE_ACCESS_INFO_LABEL}
              </div>
            </div>
          </div>
        </>
      )}

      <hr className="my-4 border-[#E3E3E3] sm:my-6" />

      <div className="flex w-full flex-col gap-2 text-sm">
        <div className="flex w-full items-center justify-between gap-4">
          <span className="text-gray-500">Subtotal</span>
          <PriceValue
            status={priceStatus}
            label={priceLabel}
            className="font-semibold text-gray-900"
          />
        </div>
        <div className="flex w-full items-center justify-between gap-4">
          <span className="text-base font-bold text-gray-900">Total</span>
          <PriceValue
            status={priceStatus}
            label={priceLabel}
            className="text-base font-bold text-gray-900"
          />
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <button
          type="button"
          onClick={() =>
            window.open(
              getEmailInboxUrl(email),
              "_blank",
              "noopener,noreferrer",
            )
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#F3F5F4] px-4 py-3 text-sm font-semibold text-gray-900 sm:mt-6"
        >
          <div
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
            aria-hidden="true"
          >
            i
          </div>
          Check your email for confirmation &amp; next steps
        </button>

        <p className="mt-6 text-xs text-gray-500">
          We&apos;ve sent enrollment details to {email}. If you don&apos;t
          receive an email within 10 minutes, please check your spam folder or
          contact us at {SUPPORT_EMAIL_PLACEHOLDER}.
        </p>
      </div>
    </CardStripe>
  );
};
