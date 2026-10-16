import { images } from "@/assets";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { post, END_POINTS } from "@/api/index.ts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "@/utils/validations.ts";
import { FormField } from "@/components/FormField";
import LoadingOverlay from "@/components/ui/loading-overplay";
export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await post(END_POINTS.FORGOT_PASSWORD, { email });
      setSent(true);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <img
        src={images.background}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-center">
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
                Forgot Password
              </span>
              <div className="h-0.5 flex-1 bg-linear-to-r from-[#a4f9f8] to-transparent" />
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-4 mt-6 text-center">
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  A password reset link has been sent to{" "}
                  <span className="text-teal-400 font-semibold">{email}</span>.
                  <br />
                  Please check your inbox and follow the instructions.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/auth/signin")}
                  className="text-teal-400 text-xs sm:text-sm hover:underline"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-300 text-xs sm:text-sm text-center mb-3 sm:mb-4 leading-relaxed">
                  Enter your email address and we'll send you
                  <br />a link to reset your password.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="w-full space-y-2 sm:space-y-3 text-white"
                >
                  <FormField label="Email Address" required>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className={`w-full bg-[#0C121A] border text-white
                        text-xs sm:text-sm
                        placeholder:text-gray-500
                        rounded-lg px-4 py-2.5
                        focus:outline-none focus:ring-1
                        ${
                          emailError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                    />

                    <div className="flex justify-end mt-2 px-2">
                      <button
                        type="button"
                        onClick={() => navigate("/auth/signin")}
                        className="text-teal-400 text-xs sm:text-sm hover:underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  </FormField>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full h-10 sm:h-12 flex items-center justify-center 
                      mt-[82px] min-[450px]:mt-[99px] min-[550px]:mt-[106px]  min-[640px]:mt-[80px] md:mt-[140px] lg:mt-36"
                  >
                    <img
                      src={images.btnLogin}
                      alt="btnLogin"
                      className="w-full h-full"
                    />
                    <span className="flex gap-x-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[15px] min-[450px]:text-[17px] min-[550px]:text-[18px] sm:text-[20px]  md:text-[22px] lg:text-2xl uppercase trajan-uppercase font-extrabold">
                       Send Email
                      <LoadingOverlay isLoading={isSubmitting} size={5} />
                    </span>
                  </button>
                </form>
              </>
            )}

            <p className="text-white text-[10px] min-[550px]:text-xs mt-auto max-[450px]:pt-6  pt-12 min-[450px]:pt-18 sm:pt-14 text-center font-semibold">
              © 2026 Commerce Clash. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
