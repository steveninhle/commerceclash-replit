import { Role } from '../enum/roles.enum';
import { AuthTokenResponse } from '@supabase/supabase-js';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
  complete_user?: AuthTokenResponse['data'];
}

export interface ZoomMeetingApiResponse {
  id: string;
  password: string;
  join_url: string;
  start_url: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: T | undefined;
}

export interface ZoomOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface StudentWithCourses {
  id: string;
  name: string | null;
  email: string;
  is_active: boolean;
  created_at: Date;
  enrolled_courses: {
    id: string;
    name: string;
    meeting_id: string;
    meeting_link: string;
  }[];
}

export interface UpdatedStudentXp {
  id: string;
  name: string | null;
  xp: number;
  level: number;
  ceo: {
    id: string | null;
    title: string | null;
  };
}

export interface SkillAttribute {
  id: string;
  name: string;
  value: number;
}

export interface OrderedSkill {
  id: string;
  attributes: {
    name: string;
  };
  value: number;
}
