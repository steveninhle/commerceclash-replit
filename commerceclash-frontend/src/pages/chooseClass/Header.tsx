import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoCommerceClash from "@/assets/svgs/LogoCommerClash.svg";

const NAV_LINKS = [
  { label: "How it works", href: "https://commerceclash.com/#steps" },
  { label: "Pricing", href: "https://commerceclash.com/#pricing" },
  { label: "About", href: "https://commerceclash.com/#about" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="relative z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex  max-w-[1250px] min-[1700px]:max-w-[1400px] min-[1880px]:max-w-[1580px] min-[2200px]:max-w-[1800px] items-center justify-between gap-4 px-4 h-[104px] sm:px-8">
        <a
          href="https://commerceclash.com/"
          className="flex min-w-0 items-center"
        >
          <img
            src={logoCommerceClash}
            alt="CommerceClash"
            className="h-12  min-[1550px]:h-[54px]  w-auto shrink-0 object-contain invert"
          />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative text-lg font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-2 h-[6px] w-[6px] scale-50 rounded-full bg-emerald-500 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 !h-[62px]">
          <button
            type="button"
            onClick={() => navigate("/auth/signin")}
            className="hidden items-center gap-1.5 rounded-full  bg-[linear-gradient(90deg,#42D6A6_0%,#78FA62_100%)]  px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition-transform hover:scale-[1.02] sm:inline-flex"
          >
            Login
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="choose-class-mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:text-gray-900 py-2 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          id="choose-class-mobile-menu"
          aria-label="Main"
          className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "group relative rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              {link.label}
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 h-2 w-2 scale-50 rounded-full bg-emerald-500 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/auth/signin");
            }}
            className="mt-1 rounded-md px-2 py-2 text-left text-sm font-semibold text-green-600"
          >
            Login
          </button>
        </nav>
      )}
    </header>
  );
};

export { Header };
