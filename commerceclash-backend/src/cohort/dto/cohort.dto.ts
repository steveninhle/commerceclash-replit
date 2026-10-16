import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCohortDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(255) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() program_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() level?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() start_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() end_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cover_image?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_public?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) max_students?: number;
}

export class UpdateCohortDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(3) @MaxLength(255) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() program_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() level?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() start_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() end_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cover_image?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_public?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) max_students?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class AddStudentDto {
  @ApiProperty() @IsString() student_id!: string;
}

export class EnrollStudentsDto {
  @ApiProperty({ type: [String] }) @IsString({ each: true }) student_ids!: string[];
}

export class ComputeProgressionDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) week_number?: number;
}

export class AddMaterialDto {
  @ApiProperty() @IsString() file_name!: string;
  @ApiProperty() @IsString() file_url!: string;
}

export class AddRecordingDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() recording_url!: string;
}

// ─── Schedule DTOs ───────────────────────────────────────────────────────────

export class CreateScheduleDto {
  @ApiProperty({ description: '0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  start_time!: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  end_time!: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: '0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  start_time?: string;

  @ApiPropertyOptional({ example: '11:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  end_time?: string;
}

export class GenerateClassesDto {
  @ApiPropertyOptional({ description: 'Prefix cho tên class, mặc định là tên cohort' })
  @IsOptional()
  @IsString()
  name_prefix?: string;
}

export class ScheduleItemDto {
  id!: string;
  cohort_id!: string;
  day_of_week!: number;
  start_time!: string;
  end_time!: string;
  created_at!: Date;
  updated_at!: Date;
}

// Read-only weekly-recurrence summary for public cohort listings — unlike
// ScheduleItemDto (used by the teacher-facing schedule CRUD endpoints), this
// deliberately omits id/cohort_id/timestamps since a listing card only needs
// the day/time itself.
export class CohortScheduleSummaryDto {
  day_of_week!: number;
  start_time!: string;
  end_time!: string;
}

export class CohortListItemDto {
  id!: string;
  name!: string;
  slug!: string | null;
  description!: string | null;
  status!: string;
  program_name!: string | null;
  level!: string | null;
  start_date!: Date | null;
  end_date!: Date | null;
  max_students!: number;
  total_students!: number;
  total_classes!: number;
  available_spots!: number;
  cover_image!: string | null;
  tags!: unknown;
  teacher_id!: string | null;
  timezone!: string | null;
  schedules!: CohortScheduleSummaryDto[];
  archived_at!: Date | null;
  // Populated only in the create() response, for the teacher who just
  // created the cohort. Deliberately omitted from findAll/findOne/
  // findStudentCohorts, which are reachable without proof of enrollment —
  // join_url is a live credential into the classroom, not display metadata.
  zoom_meeting_id?: string | null;
  zoom_uuid?: string | null;
  zoom_join_url?: string | null;
}

export class CohortProgressionDto {
  id!: string;
  cohort_id!: string;
  week_number!: number;
  total_xp!: number;
  average_level!: number;
  total_market_share!: number;
  completion_rate!: number;
  active_students!: number;
  created_at!: Date;
  updated_at!: Date;
}

export class CohortStudentDto {
  id!: string;
  name!: string | null;
  email!: string;
  joined_at!: Date;
}

export class CreateCohortResponseDto {
  success!: boolean;
  data!: CohortListItemDto;
}

export class CohortListResponseDto {
  success!: boolean;
  data!: CohortListItemDto[];
}

export class CohortDetailResponseDto {
  success!: boolean;
  data!: CohortListItemDto;
}
