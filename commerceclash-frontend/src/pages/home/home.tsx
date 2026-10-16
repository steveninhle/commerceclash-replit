import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FormField } from "@/components/FormField";
import { urlBuilder } from "./helper";
import {
  validateEmail,
  validateMeetingId,
  validateName,
} from "../../utils/validations.ts";
import { FormData, FormErrors } from "./types";
import { useUserContext } from "../../context/userContext/userContext";
import { toLowerCaseString } from "../../utils/helper";

export const Home = () => {
  const { role } = useUserContext();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    meetingId: "",
    role: toLowerCaseString(role),
    passcode: "",
    email: "",
  });

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
    const meetingIdError = validateMeetingId(formData.meetingId);
    const emailError = validateEmail(formData.email);
    const nameError = validateName(formData.name);

    if (nameError) newErrors.name = nameError;
    if (meetingIdError) newErrors.meetingId = meetingIdError;
    if (emailError) newErrors.email = emailError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    navigate(
      urlBuilder("/meeting", {
        name: formData.name,
        meetingId: formData.meetingId,
        role: formData.role,
        passcode: formData.passcode,
        email: formData.email,
      })
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-gray-400/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Meeting</CardTitle>
          <CardDescription>
            Enter your details to join the meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Name" error={errors.name} required>
              <Input
                type="string"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </FormField>

            <FormField label="Meeting ID" error={errors.meetingId} required>
              <Input
                type="text"
                placeholder="Enter meeting ID (numbers only)"
                value={formData.meetingId}
                onChange={(e) => handleInputChange("meetingId", e.target.value)}
                className={errors.meetingId ? "border-destructive" : ""}
              />
            </FormField>

            <FormField label="Passcode">
              <Input
                type="password"
                placeholder="Enter passcode (optional)"
                value={formData.passcode}
                onChange={(e) => handleInputChange("passcode", e.target.value)}
              />
            </FormField>

            <FormField label="Email" error={errors.email} required>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Meeting"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
