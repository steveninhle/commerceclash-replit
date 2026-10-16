import { useState } from "react";
import { useUserContext } from "@/context/userContext/userContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const SettingsPage = () => {
  const { user } = useUserContext();
  const [firstName, setFirstName] = useState(
    (user as { name?: string })?.name?.split(" ")[0] ?? ""
  );
  const [lastName, setLastName] = useState(
    (user as { name?: string })?.name?.split(" ")[1] ?? ""
  );
  const [email] = useState((user as { email?: string })?.email ?? "");
  const [country, setCountry] = useState("United States");
  const [timezone, setTimezone] = useState("(GMT-05:00) Eastern Time");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [studentEnrollments, setStudentEnrollments] = useState(true);
  const [classNotifications, setClassNotifications] = useState(false);

  const inputClass =
    "bg-[#0d1117] border border-gray-700 text-white placeholder:text-gray-600 focus:border-green-600 focus:ring-0 rounded-sm";

  const selectClass =
    "w-full bg-[#0d1117] border border-gray-700 text-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-green-600";

  return (
    <div className="flex-1 overflow-y-auto">
      <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-6">
        Settings
      </h1>

      <div className="space-y-4">
        {/* Account Information */}
        <section className="border border-gray-800 p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 border-b border-gray-800 pb-3">
            Account Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
              Email Address
            </label>
            <Input value={email} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={selectClass}
              >
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Vietnam</option>
                <option>Australia</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={selectClass}
              >
                <option>(GMT-05:00) Eastern Time</option>
                <option>(GMT-06:00) Central Time</option>
                <option>(GMT-07:00) Mountain Time</option>
                <option>(GMT-08:00) Pacific Time</option>
                <option>(GMT+07:00) Indochina Time</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="border border-gray-800 p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 border-b border-gray-800 pb-3">
            Security
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-5 py-2 text-xs font-bold tracking-widest uppercase bg-green-500 hover:bg-green-400 text-black transition-colors">
              Change Password
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="border border-gray-800 p-6 space-y-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 border-b border-gray-800 pb-3">
            Preferences
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-white">
                Student Enrollments
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase">
                Receive email alerts when new students join your classes
              </p>
            </div>
            <Switch
              checked={studentEnrollments}
              onCheckedChange={setStudentEnrollments}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-800">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-white">
                Upcoming Class Notifications
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase">
                Receive email alerts 30 minutes prior to upcoming classes.
              </p>
            </div>
            <Switch
              checked={classNotifications}
              onCheckedChange={setClassNotifications}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
