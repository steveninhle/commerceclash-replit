import { perk_status } from '@prisma/client';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export interface AssignCeoResponseData {
  archetype: { id: string; title: string | undefined; sub_title: string | undefined };
  xp: number | null;
  level: number | null;
  perks: {
    id: string;
    title: string;
    key: string;
    description: string | null;
    is_unlocked: boolean;
    is_used: boolean;
    is_approved: boolean | null;
    perk_status: perk_status | null;
    perk_type: string | null;
  }[];
}

export class AssignCeoResponseDto implements ApiResponse {
  success!: boolean;
  message!: string;
  data?: AssignCeoResponseData;
  error?: any;
}
