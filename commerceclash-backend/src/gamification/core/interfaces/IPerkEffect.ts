export class Perk {
  id!: string;
  title!: string;
}

export class Student {
  id!: string;
  name!: string | null;
  enrollmentId!: string;
  marketShare?: number | null;
}

export interface IPerkEffectContext {
  student: Student;
  teacherId?: string;
  classId: string;
  perk: Perk;
  /** Additional data for perks that require extra input (e.g., target selection) */
  additionalData?: Record<string, unknown>;
}

export interface IPerkEffectResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface IPerkEffect {
  apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult>;
}
