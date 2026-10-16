import { Button } from "@/components/ui/button";
import { Edit2, Save, X } from "lucide-react";
import { EditButtonProps } from "./types";

export const EditButton = ({
  title = "Edit",
  isEditing,
  onToggle,
  onSave,
  onCancel,
}: EditButtonProps) => {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onToggle}
      variant="outline"
      className="border-green-300 text-green-700 hover:bg-green-50"
    >
      <Edit2 className="h-4 w-4 mr-2" />
      {title}
    </Button>
  );
};
