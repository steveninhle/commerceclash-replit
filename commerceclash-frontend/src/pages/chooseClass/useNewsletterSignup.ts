import { useCallback, useState } from "react";
import { isValidEmail } from "@/pages/chooseClass/validation";

type NewsletterStatus = "idle" | "loading" | "success" | "error";

const useNewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValidEmail(email)) {
        setStatus("error");
        setErrorMessage("Please enter a valid email address.");
        return;
      }

      setStatus("loading");
      setErrorMessage(null);

      // TODO(newsletter-api): no newsletter-subscribe endpoint exists in the
      // backend yet. This simulates a round trip so idle/loading/success/
      // error are all exercised; swap in a real `post(END_POINTS.X, ...)`
      // call once one is added.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStatus("success");
    },
    [email],
  );

  return { email, setEmail, status, errorMessage, submit };
};

export { useNewsletterSignup };
