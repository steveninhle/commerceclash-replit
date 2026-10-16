import { cn } from "@/lib/utils";
export const CHECKOUT_INPUT_TOKENS = {
  radius: "9999px",
  background: "#f0f1f3",
  backgroundFocus: "#ffffff",
  border: "transparent",
  borderFocus: "#34d399",
  text: "#1f2937",
  placeholder: "#6b7280",
  label: "#374151",
  danger: "#ef4444",
  fontSize: "14px",
  height: "48px",
} as const;
// Mirrors CardField's pill shell (rounded-full, #f0f1f3 fill, emerald focus)
// so Name/Email read as the same field system as the card-details section.
export const CHECKOUT_INPUT_CLASS =
  "h-12 w-full rounded-full border border-transparent bg-[#f0f1f3] px-5 text-sm text-[#1f2937] placeholder:text-[#6b7280] outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-400/30 [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_#f0f1f3] [&:-webkit-autofill]:[-webkit-text-fill-color:#1f2937]";
type CheckoutFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
};
const CheckoutField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoComplete,
  required = false,
  disabled = false,
}: CheckoutFieldProps) => (
  <div className="flex flex-col gap-1.5">
    {" "}
    <label htmlFor={id} className="text-sm font-normal text-gray-900">
      {" "}
      {label} {required && <span className="text-red-500">*</span>}{" "}
    </label>{" "}
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      disabled={disabled}
      aria-required={required}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(
        CHECKOUT_INPUT_CLASS,
        error && "border-red-300 bg-red-50 focus:border-red-400",
      )}
    />{" "}
    {error && (
      <p id={`${id}-error`} className="text-xs font-medium text-red-500">
        {" "}
        {error}{" "}
      </p>
    )}{" "}
  </div>
);
export { CheckoutField };
