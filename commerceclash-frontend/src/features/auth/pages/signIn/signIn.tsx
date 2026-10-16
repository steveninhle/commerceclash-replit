import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePasscode } from "@/utils/validations";
import { FormData, FormErrors } from "./types.ts";
import { post, END_POINTS } from "@/api/index.ts";
import { useUserContext } from "@/context/userContext/userContext";
import { toast } from "sonner";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { images } from "@/assets/index.ts";
import LoadingOverlay from "@/components/ui/loading-overplay.tsx";

export const SignIn = () => {
  const { setIsLoggedIn, setRole, setId, setUser } = useUserContext();
  const [formData, setFormData] = useState<FormData>({
    password: "",
    email: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const emailError = validateEmail(formData.email);
    const passcodeError = validatePasscode(formData.password);

    if (passcodeError) {
      newErrors.password = passcodeError;
    }
    if (emailError) newErrors.email = emailError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setFormData((prev) => ({ ...prev, password: "" }));

    setIsSubmitting(true);
    try {
      const response = await post(END_POINTS.SIGN_IN, formData);
      setIsLoggedIn(true);
      setRole(response.data.user.role);
      setId(response.data.user.id);
      // if (response.data?.access_token) {
      //   localStorage.setItem("access_token", response.data.access_token);
      // }
      const user = {
        name: response.data.user.name,
        email: response.data.user.email,
        status: response.data.user.status,
      };
      setUser(user);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      toast.error((error as Error).message);
    }
    setIsSubmitting(false);
  };

  const togglePassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <img
        src={images.background}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="relative w-[450px] max-[550px]:mx-[12px] h-[540px] min-[450px]:w-[500px] min-[450px]:h-[600px] min-[550px]:h-[630px]  md:w-[550px] md:h-[700px] bg-no-repeat [background-size:100%_100%] [background-image:var(--form-bg)]"
          style={
            { "--form-bg": `url(${images.formLogin})` } as React.CSSProperties
          }
        >
          <div className="absolute inset-x-0 bottom-0 top-[22%] flex flex-col items-center px-7 pb-4 min-[450px]:top-[23%] min-[450px]:px-10 min-[550px]:px-13 min-[550px]:top-[24%] sm:px-16 sm:pb-6">
            <div className="max-lg:h-[93px] max-lg:mt-[10px] flex items-center justify-center">
              <h1 className="trajan-uppercase max-[450px]:mt-[10px] text-[26px] min-[450px]:text-[32px] min-[550px]:text-[40px] sm:text-[44px] lg:text-5xl font-extrabold text-center uppercase bg-[linear-gradient(180deg,#e8eef2_0%,#c5d5de_20%,#8fafc0_45%,#b8cdd8_60%,#7a9aaa_80%,#4a6a7a_100%)] bg-clip-text text-transparent [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.9))]">
                Commerce
                <br />
                Clash
              </h1>
            </div>

            <div className="flex items-center gap-3 mt-2 mb-2 sm:mb-3 w-full">
              <div className="h-0.5 flex-1 bg-linear-to-l from-[#a4f9f8] to-transparent" />
              <span className="text-lg min-[450px]:text-xl sm:text-2xl trajan-uppercase font-semibold tracking-widest text-[#A4F9F8]">
                Login
              </span>
              <div className="h-0.5 flex-1 bg-linear-to-r from-[#a4f9f8] to-transparent" />
            </div>

            <p className="text-gray-300 text-xs sm:text-sm text-center mb-3 sm:mb-4 leading-relaxed">
              Access your company dashboard and compete
              <br />
              in this week's business simulation.
            </p>

            <form
              onSubmit={handleSubmit}
              className="w-full space-y-2 sm:space-y-3"
            >
              <div>
                <label className="text-white text-xs sm:text-sm font-semibold block mb-1">
                  Email Address
                </label>

                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full bg-[#0C121A] border text-white
    text-xs sm:text-sm
    placeholder:text-gray-500
    rounded-lg px-4 py-2.5
    focus:outline-none focus:ring-1
    [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_rgb(12,18,26)]
    [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
    ${
      errors.email
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
    }`}
                />
              </div>

              <div>
                <label className="text-white text-xs sm:text-sm font-semibold block mb-1">
                  Password
                </label>

                <div className="relative">
                  <Input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full bg-[#0C121A] border text-white
         text-xs sm:text-sm
    placeholder:text-gray-500
    rounded-lg px-4 py-2.5
    focus:outline-none focus:ring-1
    [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_rgb(12,18,26)]
    [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
        ${
          errors.password
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"
        }`}
                  />

                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  >
                    {passwordVisible ? (
                      <EyeClosedIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-end mt-2 px-2">
                  <button
                    type="button"
                    onClick={() => navigate("/auth/forgot-password")}
                    className="text-teal-400 text-xs sm:text-sm cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full h-10 sm:h-12 flex items-center justify-center mt-[14px] min-[450px]:mt-[50px] sm:mt-[14px] md:mt-18
                  transition-all duration-200 ease-in-out
                  hover:scale-[1.03] hover:brightness-110 hover:drop-shadow-[0_0_12px_rgba(164,249,248,0.5)]
                  active:scale-[0.97] active:brightness-95
                  disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:drop-shadow-none
                  disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <img
                  src={images.btnLogin}
                  alt="btnLogin"
                  className="w-full h-full"
                />
                <span className="flex gap-x-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[15px] min-[450px]:text-[17px] min-[550px]:text-[18px] sm:text-[20px]  md:text-[22px] lg:text-2xl uppercase trajan-uppercase font-extrabold mb-0 min-[450px]:mb-[2px]">
                  Log in
                  <LoadingOverlay isLoading={isSubmitting} size={5} />
                </span>
              </button>
            </form>
          </div>
        </div>
        <p className="text-white text-[10px] min-[550px]:text-xs mt-auto pt-3 text-center font-semibold">
          © 2026 Commerce Clash. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};
