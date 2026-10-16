export class Perk {
  id!: string;
  title!: string;
}

export class Student {
  id!: string;
  name!: string;
}
export class PerkUsedDto {
  student!: Student;
  classId!: string;
  teacherId!: string;
  perk!: Perk;
}
