import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skill } from "@/components/types";
import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { SkillBadgeProps } from "@/components/types";

export const SkillBadge = ({
  skill,
  isEditing,
  onUpdate,
  onDelete,
}: SkillBadgeProps) => {
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editName, setEditName] = useState(skill.name);
  const [editLevel, setEditLevel] = useState(skill.level);

  const getLevelColor = (level: Skill["level"]) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSave = () => {
    onUpdate({
      ...skill,
      name: editName,
      level: editLevel,
    });
    setIsEditingSkill(false);
  };

  const handleCancel = () => {
    setEditName(skill.name);
    setEditLevel(skill.level);
    setIsEditingSkill(false);
  };

  if (!isEditing) {
    return (
      <Badge className={`${getLevelColor(skill.level)} border`}>
        {skill.name} ({skill.level})
      </Badge>
    );
  }

  if (isEditingSkill) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="h-8 text-sm"
          placeholder="Skill name"
        />
        <Select
          value={editLevel}
          onValueChange={(value: Skill["level"]) => setEditLevel(value)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getLevelColor(skill.level)} border`}>
        {skill.name} ({skill.level})
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditingSkill(true)}
        className="h-6 w-6 p-0"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};
