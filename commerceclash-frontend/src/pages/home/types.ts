export interface FormData {
  name: string;
  meetingId: string;
  role: string;
  passcode: string;
  email: string;
}

export interface FormErrors {
  name?: string;
  meetingId?: string;
  email?: string;
}
