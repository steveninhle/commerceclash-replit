import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CalendarX2 } from "lucide-react";
import { get, END_POINTS } from "@/api";
import type { Cohort } from "@/pages/chooseClass/types";
import { CardStripe } from "@/components/ui/cart-stripe";
import { StateMessage } from "@/components/ui/state-message";
import { CheckoutFlowLayout } from "./CheckoutFlowLayout";
import { ClassOptionCard } from "./ClassOptionCard";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

type FetchStatus = "loading" | "error" | "ready";

const ClassOptionCardSkeleton = () => (
  <div
    aria-hidden="true"
    className="animate-pulse overflow-hidden rounded-2xl border border-gray-200"
  >
    <div className="h-[74px] border-b border-gray-200 bg-gray-100" />
    <div className="px-5 pt-5">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-3.5 w-28 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="px-5 pt-5 pb-5">
      <div className="h-14 w-full rounded-full bg-gray-200" />
    </div>
  </div>
);

const ChooseClassPage = () => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");

  const fetchCohorts = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await get(END_POINTS.PUBLIC_COHORTS);
      setCohorts(res.data ?? []);
      setStatus("ready");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to load classes");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  return (
    <CheckoutFlowLayout currentStep={0} footer={<Footer />}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <CardStripe className="p-4 sm:p-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Choose a Class Time
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Pick a time that fits your life. Start your CEO journey.
            </p>
          </div>

          <h2 className="sr-only">Available class times</h2>

          {status === "loading" ? (
            <div className="mt-5 flex flex-col gap-5">
              {[...Array(3)].map((_, i) => (
                <ClassOptionCardSkeleton key={i} />
              ))}
            </div>
          ) : status === "error" ? (
            <StateMessage
              className="mt-5"
              icon={AlertCircle}
              tone="danger"
              title="Couldn't load class times"
              description="Something went wrong on our end. Please try again."
              action={
                <button
                  type="button"
                  onClick={fetchCohorts}
                  className="mt-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Try again
                </button>
              }
            />
          ) : cohorts.length === 0 ? (
            <StateMessage
              className="mt-5"
              icon={CalendarX2}
              title="No classes are currently open for registration"
              description="Please check back soon — new classes are added regularly."
            />
          ) : (
            <ul role="list" className="mt-5 flex flex-col gap-5">
              {cohorts.map((cohort, index) => (
                <li
                  key={cohort.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                  style={{
                    animationDelay: `${index * 0.06}s`,
                    animationFillMode: "backwards",
                  }}
                >
                  <ClassOptionCard cohort={cohort} />
                </li>
              ))}
            </ul>
          )}
        </CardStripe>

        <Sidebar />
      </div>
    </CheckoutFlowLayout>
  );
};

export { ChooseClassPage };
