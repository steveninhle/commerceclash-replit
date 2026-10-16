import React, { useEffect, useState } from "react";
import { images } from "@/assets";
import { Input } from "@/components/ui/input";
import { post, END_POINTS } from "@/api/index.ts";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { validatePasscode, validateEmail } from "@/utils/validations.ts";
import { FormField } from "@/components/FormField";
import LoadingOverlay from "@/components/ui/loading-overplay";
import { useUserContext } from "@/context/userContext/userContext";

// The backend's exact 401 message for a missing/invalid recovery session —
// used to route specifically that failure (not e.g. a weak-password 400)
// to the "resend a link" form instead of a generic error toast.
const NO_SESSION_MESSAGE =
  "No active recovery session. Please use the link from your email again.";

type LinkStatus = "verifying" | "ready" | "expired";

export const SetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [confirmError, setConfirmError] = useState<string | undefined>(
    undefined,
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendEmailError, setResendEmailError] = useState<string | undefined>(
    undefined,
  );
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { setIsLoggedIn, setRole, setId, setUser } = useUserContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      post(END_POINTS.VERIFY_RECOVERY_TOKEN, { token })
        .then(() => {
          setLinkStatus("ready");
        })
        .catch(() => {
          setLinkStatus("expired");
        });
    } else {
      toast.error("Invalid set-password link. Please contact support.");
      navigate("/auth/signin");
    }
  }, [navigate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePasscode(newPassword);
    const matchError =
      newPassword !== confirmPassword ? "Passwords do not match" : undefined;

    if (pwError) setPasswordError(pwError);
    if (matchError) {
      setConfirmError(matchError);
      toast.error(matchError);
    }

    if (pwError || matchError) return;

    setIsSubmitting(true);
    try {
      const response = await post(END_POINTS.SET_PASSWORD, { newPassword });
      const publicUser = response.data;
      setIsLoggedIn(true);
      setRole(publicUser.role);
      setId(publicUser.id);
      setUser({
        name: publicUser.name,
        email: publicUser.email,
        status: publicUser.is_active,
      });
      toast.success("Password set successfully.");
      navigate("/choose-ceo");
    } catch (err) {
      const message = (err as Error).message;
      if (message === NO_SESSION_MESSAGE) {
        setLinkStatus("expired");
      } else {
        toast.error(message);
      }
    }
    setIsSubmitting(false);
  };

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(resendEmail);
    if (emailError) {
      setResendEmailError(emailError);
      return;
    }

    setIsResending(true);
    try {
      await post(END_POINTS.RESEND_SET_PASSWORD, { email: resendEmail });
      setResendSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setIsResending(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <img
        src={images.background}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="relative
            w-[450px] max-[550px]:mx-[12px] h-[540px]
            min-[450px]:w-[500px] min-[450px]:h-[600px]
            min-[550px]:h-[630px]
            md:w-[550px] md:h-[700px]
            bg-no-repeat [background-size:100%_100%] [background-image:var(--form-bg)]"
          style={
            { "--form-bg": `url(${images.formLogin})` } as React.CSSProperties
          }
        >
          <div
            className="absolute inset-x-0 bottom-0
            top-[22%] min-[450px]:top-[23%] min-[550px]:top-[24%]
            flex flex-col items-center
            px-7 min-[450px]:px-10 min-[550px]:px-13 sm:px-16
            pb-4 sm:pb-6"
          >
            <div className="flex items-center justify-center max-[1026px]:h-[93px] max-[1026px]:mt-[10px]">
              <h1 className="trajan-uppercase text-[26px] min-[450px]:text-[32px] min-[550px]:text-[40px] sm:text-[44px] lg:text-5xl font-extrabold text-center uppercase bg-[linear-gradient(180deg,#e8eef2_0%,#c5d5de_20%,#8fafc0_45%,#b8cdd8_60%,#7a9aaa_80%,#4a6a7a_100%)] bg-clip-text text-transparent">
                Commerce
                <br />
                Clash
              </h1>
            </div>

            <div className="flex items-center gap-3 mt-2 mb-2 sm:mb-3 w-full">
              <div className="h-0.5 flex-1 bg-linear-to-l from-[#a4f9f8] to-transparent" />
              <span className="text-lg min-[450px]:text-xl sm:text-2xl trajan-uppercase font-semibold tracking-widest text-[#A4F9F8]">
                Set Password
              </span>
              <div className="h-0.5 flex-1 bg-linear-to-r from-[#a4f9f8] to-transparent" />
            </div>

            {linkStatus === "verifying" ? (
              <p className="text-gray-400 text-xs sm:text-sm mt-6 text-center">
                Verifying link...
              </p>
            ) : linkStatus === "expired" ? (
              <>
                <p className="text-gray-300 text-xs sm:text-sm text-center mb-3 sm:mb-4">
                  {resendSent
                    ? "Check your inbox for a new link."
                    : "This link has expired. Enter your email and we'll send you a new one."}
                </p>

                {!resendSent && (
                  <form
                    className="w-full space-y-2 sm:space-y-3 text-white"
                    onSubmit={handleResendSubmit}
                  >
                    <FormField label="Email" required>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={resendEmail}
                        onChange={(e) => {
                          setResendEmail(e.target.value);
                          setResendEmailError(undefined);
                        }}
                        className={`w-full bg-[#0C121A] border text-white
    text-xs sm:text-sm
    placeholder:text-gray-500
    rounded-lg px-4 py-2.5
    focus:outline-none focus:ring-1
    [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_rgb(12,18,26)]
    [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
    ${
      resendEmailError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
    }`}
                      />
                    </FormField>

                    <button
                      type="submit"
                      disabled={isResending}
                      className="relative w-full h-10 sm:h-12 flex items-center justify-center mt-[56px] min-[450px]:mt-[88px] min-[550px]:mt-[94px] sm:mt-[70px] md:mt-30"
                    >
                      <img src={images.btnLogin} className="w-full h-full" />
                      <span className="absolute text-white text-[15px] min-[450px]:text-[17px] min-[550px]:text-[18px] sm:text-[20px] md:text-[22px] lg:text-2xl uppercase font-extrabold">
                        {isResending ? "Sending..." : "Send New Link"}
                      </span>
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-300 text-xs sm:text-sm text-center !mb-3 !sm:mb-4">
                  Welcome! Create a password to finish setting up your account.
                </p>

                <form
                  className="w-full flex flex-1 flex-col space-y-2 sm:space-y-3 text-white"
                  onSubmit={handleSubmit}
                >
                  <FormField
                    label="New Password"
                    required
                    error={passwordError}
                  >
                    <div className="relative">
                      <Input
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError(undefined);
                        }}
                        className={`w-full bg-[#0C121A] border text-white
    text-xs sm:text-sm
    placeholder:text-gray-500
    rounded-lg px-4 py-2.5
    focus:outline-none focus:ring-1
    [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_rgb(12,18,26)]
    [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
    ${
      passwordError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
    }`}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                      >
                        {passwordVisible ? (
                          <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <FormField
                    label="Confirm Password"
                    required
                    error={confirmError}
                  >
                    <div className="relative">
                      <Input
                        type={confirmVisible ? "text" : "password"}
                        placeholder="Enter confirm password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmError(undefined);
                        }}
                        className={`w-full bg-[#0C121A] border text-white
    text-xs sm:text-sm
     placeholder:text-gray-500
    rounded-lg px-4 py-2.5
    focus:outline-none focus:ring-1
    [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_rgb(12,18,26)]
    [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
    ${
      confirmError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
    }`}
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmVisible(!confirmVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                      >
                        {confirmVisible ? (
                          <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full h-10 sm:h-12 flex items-center justify-center mt-auto mb-5"
                  >
                    <img src={images.btnLogin} className="w-full h-full" />
                    <span className="flex gap-x-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[15px] min-[450px]:text-[17px] min-[550px]:text-[18px] sm:text-[20px]  md:text-[22px] lg:text-2xl uppercase trajan-uppercase font-extrabold mb-0 min-[450px]:mb-[2px] whitespace-nowrap">
                      Set Password
                      <LoadingOverlay isLoading={isSubmitting} size={5} />
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        <p className="text-white text-[10px] min-[550px]:text-xs mt-auto pt-3 text-center font-semibold">
          © 2026 Commerce Clash. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};
