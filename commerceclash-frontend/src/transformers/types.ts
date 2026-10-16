export interface MeetingPayload {
  meetingId: string;
  name: string;
  meetingLink: string;
  passcode: string;
  duration: number;
  allocatePoints: number;
  enrolledStudents: string[];
  startTime?: string;
  endTime?: string;
}

export interface MeetingParams {
  meetingId: string | number;
  name: string;
  meetingLink: string;
  passcode: string | number;
  duration: string | number;
  allocatePoints: string | number;
  enrolledStudents?: (string | number)[];
  startTime?: string;
  endTime?: string;
}

export interface Character {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  level: number;
  perks: {
    id: string;
    title: string;
    description: string;
    is_unlocked: boolean;
    used: boolean;
    status: string | null;
    approved: boolean;
    key?: string;
    perk_type?: string;
    is_repeatable?: boolean;
    next_available_at?: string | null;
    last_used_at?: string | null;
    required_level?: number;
  }[];
}

export interface ApiCharacterResponse {
  id: string | null;
  title?: string;
  sub_title?: string;
  xp: number | null;
  level: number | null;
  perks: {
    id: string;
    title: string;
    description: string | null;
    perk_status: string | null;
    is_unlocked: boolean;
    is_used: boolean;
    is_approved: boolean | null;
    key?: string;
    perk_type?: string | null;
    is_repeatable?: boolean;
    next_available_at?: string | null;
    last_used_at?: string | null;
    required_level?: number;
  }[];
}
