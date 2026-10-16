export interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  category: 'market' | 'crisis' | 'opportunity' | 'challenge';
}

export class TrailblazerDto {
  classId!: string;
  teacherId!: string;
  student!: {
    id: string;
    name: string;
  };
}

export class TrailblazerScenarioSelectedDto {
  classId!: string;
  studentId!: string;
  perkId!: string;
  selectedScenario!: ScenarioCard;
}
