import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { post, END_POINTS } from "@/api";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext/userContext";
import { Student } from "@/components/types";
import { Button } from "@/components/ui/button";

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (student: Student) => void;
}

export function AddStudentModal({
  open,
  onClose,
  onCreated,
}: AddStudentModalProps) {
  const { id: teacherId } = useUserContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await post(
        END_POINTS.STUDENT.replace("{teacher_id}", teacherId),
        { firstName, lastName, email, password },
      );
      toast.success("Student created successfully");
      onCreated(res.data?.user ?? res.data);
      handleClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[480px] bg-[#222425] rounded-xs p-8 ">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-bold text-white">Add Student</h2>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="border-b border-gray-800 mb-6" />

        <p className="text-xs font-bold tracking-widest uppercase text-white mb-4 border-b border-gray-800 pb-2">
          Personal Information
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest uppercase text-white">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_#2c2f31] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest uppercase text-white">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_#2c2f31] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]"
            />
          </div>
        </div>

        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          variant="green"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-8 py-3 !rounded-xs !text-black text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Creating..." : "Create Student"}
        </Button>
      </div>
    </div>
  );
}
