import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class LeaveRoomDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  })
  classId!: string[];
}
