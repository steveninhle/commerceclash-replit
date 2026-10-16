export class Student {
  id!: string;
  marketShare!: number;
}

export class TrendsetterRequestDto {
  student!: Student;
  rival!: Student[];
}
