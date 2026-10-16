export class CompoundingGainsDto {
  classId!: string;
  teacherId!: string;
  student!: {
    id: string;
    name: string | null;
    marketShare: number;
  };
}
