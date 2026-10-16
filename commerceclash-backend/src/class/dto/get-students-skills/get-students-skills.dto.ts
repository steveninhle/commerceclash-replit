import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

class Skill {
  @ApiProperty({
    description: 'Unique identifier of the skill',
    example: '03c3c26b-9bed-49f6-8b24-da1f75137df5',
  })
  id!: string;

  @ApiProperty({ description: 'Skill name', example: 'team' })
  label!: string;

  @ApiProperty({ description: 'Skill value', example: 5 })
  value!: number;
}

export class GetStudentsSkills {
  @ApiProperty({
    description: 'Unique identifier of the student',
    example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of the student (null if not available)',
    example: 'John Doe',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'Maximum available skill points for the student',
    example: 100,
    nullable: true,
  })
  max!: number | null;

  @ApiProperty({
    description: 'Whether skills are unlocked for this student',
    example: true,
  })
  skill_unlocked!: boolean;

  @ApiProperty({
    description: 'List of skill objects associated with the student',
    type: [Skill],
  })
  skills!: Skill[];
}

export class GetStudentsSkillsResponse implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Descriptive message about the response',
    example: 'Student skills fetched successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Returned data payload containing student skill details',
    type: GetStudentsSkills,
    nullable: true,
  })
  data?: GetStudentsSkills[];

  @ApiProperty({
    description: 'Error details (if the request failed)',
    example: null,
    nullable: true,
  })
  error?: any;
}
