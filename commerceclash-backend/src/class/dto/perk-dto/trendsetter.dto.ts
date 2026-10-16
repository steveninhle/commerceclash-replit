export class TrendsetterDto {
  classId!: string;
  teacherId!: string;
  student!: {
    id: string;
    name: string | null;
    marketShare: number;
  };
  rivals!: {
    id: string;
    name: string | null;
    marketShare: number;
  }[];
}
