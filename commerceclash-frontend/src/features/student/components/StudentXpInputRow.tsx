import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StudentXpInputRowProps {
  studentName?: string;
  onScoreChange?: (score: number) => void;
}

export const StudentXpInputRow = ({
  studentName = "Student",
  onScoreChange,
}: StudentXpInputRowProps) => {
  const [score, setScore] = useState<string>("");

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric values
    if (value === "" || /^\d+$/.test(value)) {
      setScore(value);
      if (onScoreChange && value !== "") {
        onScoreChange(Number.parseInt(value, 10));
      }
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Student Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {studentName}
        </p>
      </div>

      {/* Numeric Input */}
      <div className="w-32">
        <Input
          type="text"
          placeholder="Enter score"
          value={score}
          onChange={handleScoreChange}
          className="text-center"
        />
      </div>
    </div>
  );
};
