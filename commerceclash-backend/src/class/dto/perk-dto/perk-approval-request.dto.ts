import { IsNotEmpty, IsNotEmptyObject, IsObject, IsString, IsUUID } from 'class-validator';

export class Perk {
  @IsUUID('all')
  @IsNotEmpty()
  id!: string;

  @IsString()
  title!: string;
}

export class Student {
  @IsUUID('all')
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string | null;
}

export class PerkApprovalRequest {
  @IsNotEmptyObject()
  student!: Student;

  @IsUUID('all')
  @IsNotEmpty()
  classId!: string;

  @IsUUID('all')
  @IsNotEmpty()
  teacherId!: string;

  @IsObject()
  @IsNotEmpty()
  perk!: Perk;
}
