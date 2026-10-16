export interface CohortSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Cohort {
  id: string;
  name: string;
  program_name: string | null;
  level: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number;
  total_students: number;
  available_spots: number;
  total_classes: number;
  status: string;
  tags: unknown;
  timezone: string | null;
  schedules: CohortSchedule[];
}
