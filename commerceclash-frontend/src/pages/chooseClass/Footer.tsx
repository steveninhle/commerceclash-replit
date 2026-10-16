import { Facebook, Instagram, Linkedin, Loader2, Youtube } from "lucide-react";
import { images } from "@/assets";
import { useNewsletterSignup } from "./useNewsletterSignup";

const COMPANY_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie policy", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "LinkedIn", href: "#", Icon: Linkedin },
  { label: "YouTube", href: "#", Icon: Youtube },
];

const Footer = () => {
  const { email, setEmail, status, errorMessage, submit } =
    useNewsletterSignup();
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <footer
      className="relative overflow-hidden border-t border-white/5 bg-[#0a120e] bg-cover bg-center"
      style={{ backgroundImage: `url(${images.bgFooter})` }}
    >
      <div className="relative mx-auto grid max-w-[1250px] min-[1700px]:max-w-[1400px] min-[1880px]:max-w-[1580px] min-[2200px]:max-w-[1800px] grid-cols-1 gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <img
              src={images.commerceClashIcon}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain"
            />
            <span className="text-3xl font-bold text-white">CommerceClash</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-base text-gray-400">
              Join a growing worldwide community sharpening their Business
              English skills. Get free tips to speak with power &amp; lead with
              confidence.
            </p>

            {isSuccess ? (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 text-base font-semibold text-green-400"
              >
                Thank you! Your submission has been received!
              </p>
            ) : (
              <form
                onSubmit={submit}
                className="mt-5 flex flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={status === "error"}
                  aria-describedby={
                    status === "error" ? "newsletter-email-error" : undefined
                  }
                  disabled={isLoading}
                  className="h-12 w-full min-w-0 rounded-full border border-white/10 bg-black/30 px-5 text-base text-white placeholder-white/40 outline-none focus-visible:border-white/30"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-bold text-gray-900 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    "Join Now"
                  )}
                </button>
              </form>
            )}

            {status === "error" && errorMessage && (
              <p
                id="newsletter-email-error"
                className="mt-2 text-sm font-medium text-red-400"
              >
                {errorMessage}
              </p>
            )}

            {!isSuccess && (
              <p className="mt-3 text-sm text-gray-500">
                No spam. Unsubscribe anytime.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <nav aria-label="Company" className="flex flex-col gap-4">
            <p className="text-xl font-bold text-white">Company</p>
            <ul role="list" className="flex flex-col gap-4">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-base text-gray-400 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-4">
            <p className="text-xl font-bold text-white">Legal</p>
            <ul role="list" className="flex flex-col gap-4">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-base text-gray-400 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Social" className="flex flex-col gap-4">
            <p className="text-xl font-bold text-white">Social</p>
            <ul role="list" className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-green-400 hover:border-white/30 hover:text-white"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1250px] min-[1700px]:max-w-[1400px] min-[1880px]:max-w-[1580px] min-[2200px]:max-w-[1800px]  border-t border-white/5 px-4 py-6 text-base text-gray-500 sm:px-8">
        © Copyright 2025 CommerceClash. All Rights Reserved.
      </div>
    </footer>
  );
};

export { Footer };
