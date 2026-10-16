import {
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'EitherStudentOrTeacher', async: false })
export class EitherStudentOrTeacherConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as { studentId?: string; teacherId?: string };
    return !!(obj.studentId || obj.teacherId);
  }

  defaultMessage(): string {
    return 'Either studentId or teacherId must be provided';
  }
}

export class JoinRoomDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  })
  classId!: string[];

  @IsOptional()
  @IsUUID('all')
  studentId?: string;

  @IsOptional()
  @IsUUID('all')
  teacherId?: string;

  @Validate(EitherStudentOrTeacherConstraint)
  checkEitherStudentOrTeacher!: boolean;
}
