import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetStudentForClassRequestDto {
  @IsUUID()
  @IsNotEmpty()
  classId!: string;
}
