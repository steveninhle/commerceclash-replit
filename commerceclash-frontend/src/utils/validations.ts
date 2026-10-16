export const validateMeetingId = (id: string): string | undefined => {
  if (!id.trim()) return "Meeting ID is required";
  if (!/^\d+$/.test(id)) return "Meeting ID must contain only numbers";
  return undefined;
};

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return undefined;
};

export const validateName = (name: string): string | undefined => {
  if (!name.trim()) return "Name is required";
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) return "Name can only contain letters and spaces";
  if (name.trim().length < 2) return "Name must be at least 2 characters long";
  return undefined;
};

export const validatePasscode = (passcode: string): string | undefined => {
  if (!passcode.trim()) return "Passcode is required";
  if (passcode.trim().length < 6)
    return "Passcode must be at least 6 characters long";
  return undefined;
};
export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
export const formatCountdown = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
