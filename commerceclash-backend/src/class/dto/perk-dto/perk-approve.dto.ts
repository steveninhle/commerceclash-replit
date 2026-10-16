import { IsBoolean, IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';

export class Perk {
  @IsUUID('all')
  @IsNotEmpty()
  id!: string;

  @IsString()
  title!: string;
}

export class PerkApproveRequest {
  @IsUUID('all')
  @IsNotEmpty()
  studentId!: string;

  @IsUUID('all')
  @IsNotEmpty()
  classId!: string;

  @IsObject()
  @IsNotEmpty()
  perk!: Perk;
}

export class PerkApproveResponse {
  @IsUUID('all')
  @IsNotEmpty()
  classId!: string;

  @IsUUID('all')
  @IsNotEmpty()
  teacherId!: string;

  @IsUUID('all')
  @IsNotEmpty()
  studentId!: string;

  @IsUUID('all')
  @IsNotEmpty()
  perkId!: string;

  @IsBoolean()
  @IsNotEmpty()
  isApproved!: boolean;

  /** Additional data for perks that require extra input (e.g., target selection for Sabotage) */
  additionalData?: Record<string, unknown>;
}
