// Shared types for components

export interface Skill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface ClassEnrollment {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_new?: boolean;
  enrolled_courses: ClassEnrollment[];
}

export interface CreateMeetingRequest {
  title: string;
  startTime: string;
  duration: number;
  allocatePoints: number;
  selectedStudentIds: string[];
}

export interface StudentMultiSelectProps {
  students: Student[];
  selectedStudentIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxHeight?: string;
}

export interface EnrolledCourse {
  id: string;
  name: string;
  meeting_link: string;
  meeting_id: string;
  status: boolean;
  passcode: string;
  duration: number;
  allocate_points: number;
  instructor_id: string;
  created_at: string;
  start_time?: string | null;
}

export interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export interface MeetingLink {
  joinUrl: string | null;
  startUrl: string | null;
  meetingId: string | null;
  passcode: string | null;
}

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export interface EditButtonProps {
  title: string;
  isEditing: boolean;
  onToggle: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export type Perk = {
  tier: "Core" | "Ultra";
  name: string;
  text: string;
};

export type HeroCardProps = {
  title: string;
  subtitle: string;
  description: string;
  difficulty: number;
  playstyle: string;
  growth: number;
  risk: number;
  influence: number;
  perks: Perk[];
  imageSrc: string;
  imageAlt?: string;
};

export interface Meeting {
  id: string;
  name: string;
  meeting_link: string;
  meeting_id: string;
  created_at: string;
  duration: number;
  passcode: string;
  instructor_id: string;
  start_time: string | null | undefined;
  end_time?: string | null;
  allocated_points?: number | null;
}

export interface ClassifiedMeetings {
  active: Meeting[];
  scheduled: Meeting[];
  completed: Meeting[];
}

export interface MeetingCardProps {
  id: string;
  meeting: Meeting;
  onCopyUrl: (url: string) => void;
  onJoinMeeting: (url: string) => void;
  onDeleteMeeting: (id: string) => void;
  deleteMeetingId: string | null;
}

export interface SkillBadgeProps {
  skill: Skill;
  isEditing: boolean;
  onUpdate: (updatedSkill: Skill) => void;
  onDelete: () => void;
}

export interface StudentBadgeProps {
  student: Student;
  onRemove: (studentId: string) => void;
  showRemoveButton?: boolean;
}

export interface StudentInfoProps {
  student: Student;
  isEditing: boolean;
  onUpdateName: (name: string) => void;
  onUpdateStatus: (status: Student["is_active"]) => void;
}

export type PowerupCardProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  unlocked: boolean;
  perkStatus?: string | null;
  isUsed?: boolean;
  perk_type?: string;
};

export type StudentSkill = {
  label: string;
  value: number;
  id: string;
};

export type StudentSkillCardProps = {
  studentID: string;
  name: string;
  skills: StudentSkill[];
  max?: number;
  className?: string;
  courseId: string;
  onSkillChange?: () => void;
  isLocked?: boolean;
  batchMode?: boolean;
  onLocalChange?: (
    studentId: string,
    skillId: string,
    newValue: number,
  ) => void;
};

export interface AssignStudentCeoProps {
  studentName: string;
  initialRole: string | null;
  roles: { id: string; label: string }[];
  id: string;
}
