export class MomentOfGloryDto {
  classId!: string;
  teacherId!: string;
  student!: {
    id: string;
    name: string;
    marketShare: number;
  };
}
