import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class ShiftedSkillsData {
  id!: string;
  created_at!: Date;
  enrollment_id!: string;
  attribute_id!: string;
  value!: number;
  updated_at!: Date;
}
export class PointsShiftingResponse implements ApiResponse {
  success!: boolean;
  message!: string;
  data?: ShiftedSkillsData[];
  error?: any;
}
