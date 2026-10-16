import {
  enrolled_students,
  perk_types,
  perks,
  Renamedclass,
  student_perks,
  users,
} from '@prisma/client';

export type Enrollment = {
  user: users;

  enrolledStudent: enrolled_students;

  class: Renamedclass;
};
type Perks = {
  perkTypes: perk_types;
  perk: perks;
  autoApprove?: boolean;
};
export type Perk = {
  studentPerk: student_perks;

  perk: Perks;
};
