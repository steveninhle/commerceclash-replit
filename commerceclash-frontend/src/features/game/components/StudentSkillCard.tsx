import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentSkill, StudentSkillCardProps } from "@/components/types";
import { Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";

export const StudentSkillCard = ({
  studentID,
  name,
  skills,
  max = 100,
  className,
  onSkillChange = () => {}, // default no-op function
  isLocked = false,
  batchMode = false,
  onLocalChange,
}: StudentSkillCardProps) => {
  const [localSkills, setLocalSkills] = useState(skills);

  // Update local skills when props change (e.g., after save or refresh)
  useEffect(() => {
    setLocalSkills(skills);
  }, [skills]);

  const handleIncrement = (skill: StudentSkill) => {
    const skillIndex = localSkills.findIndex((s) => s.id === skill.id);
    if (skillIndex === -1) return;

    const key = Object.keys(skill)[1] as keyof StudentSkill;
    const currentValue = (localSkills[skillIndex][key] as number) || 0;
    const newValue = currentValue + 1;

    if (newValue > max) return;

    const updatedSkills = [...localSkills];
    updatedSkills[skillIndex] = {
      ...updatedSkills[skillIndex],
      [key]: newValue,
    };
    setLocalSkills(updatedSkills);

    if (batchMode && onLocalChange) {
      onLocalChange(studentID, skill.id, newValue);
    } else {
      onSkillChange();
    }
  };

  const handleDecrement = (skill: StudentSkill) => {
    const skillIndex = localSkills.findIndex((s) => s.id === skill.id);
    if (skillIndex === -1) return;

    const key = Object.keys(skill)[1] as keyof StudentSkill;
    const currentValue = (localSkills[skillIndex][key] as number) || 0;
    const newValue = currentValue - 1;

    if (newValue < 0) return;

    const updatedSkills = [...localSkills];
    updatedSkills[skillIndex] = {
      ...updatedSkills[skillIndex],
      [key]: newValue,
    };
    setLocalSkills(updatedSkills);

    if (batchMode && onLocalChange) {
      onLocalChange(studentID, skill.id, newValue);
    } else {
      onSkillChange();
    }
  };

  // Handle direct number input
  const handleDirectInput = (skill: StudentSkill, newValue: number) => {
    const skillIndex = localSkills.findIndex((s) => s.id === skill.id);
    if (skillIndex === -1) return;

    const key = Object.keys(skill)[1] as keyof StudentSkill;
    const currentValue = (localSkills[skillIndex][key] as number) || 0;

    // Clamp value between 0 and max
    const clampedValue = Math.max(0, Math.min(max, newValue));

    // Don't update if value hasn't changed
    if (clampedValue === currentValue) return;

    const updatedSkills = [...localSkills];
    updatedSkills[skillIndex] = {
      ...updatedSkills[skillIndex],
      [key]: clampedValue,
    };
    setLocalSkills(updatedSkills);

    if (batchMode && onLocalChange) {
      onLocalChange(studentID, skill.id, clampedValue);
    } else {
      onSkillChange();
    }
  };

  return (
    <Card
      className={cn(
        "w-full rounded-lg bg-card text-card-foreground relative !font-sans",
        isLocked && "opacity-50",
        className,
      )}
      aria-label={`Skill summary card for ${name}`}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold text-pretty">
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-3">
          {localSkills.map((s, index) => {
            const key = Object.keys(s)[1];
            // @ts-expect-error - key is string
            const value = s[key];
            const pct = Math.max(
              0,
              Math.min(100, Math.round((value / max) * 100)),
            );

            return (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>

                  <div className="flex items-center gap-2">
                    {/* Plus/minus buttons with typable input */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDecrement(s)}
                        disabled={value <= 0 || isLocked}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                        aria-label={`Decrease ${key}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={value}
                        min={0}
                        max={max}
                        disabled={isLocked}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value, 10);
                          if (!isNaN(newValue)) {
                            handleDirectInput(s, newValue);
                          }
                        }}
                        className={cn(
                          "w-12 h-5 text-center font-medium text-sm border rounded bg-background disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        )}
                        aria-label={`${key} value`}
                      />
                      <button
                        onClick={() => handleIncrement(s)}
                        disabled={value >= max || isLocked}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                        aria-label={`Increase ${key}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="h-2 w-full rounded-md bg-muted"
                  role="progressbar"
                  aria-label={`${key} skill`}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={value}
                >
                  <div
                    className="h-full rounded-md !bg-primary transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
