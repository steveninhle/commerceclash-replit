import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Student } from "@/components/types";
import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { StudentInfoProps } from "@/components/types";

export const StudentInfo = ({
  student,
  isEditing,
  onUpdateName,
  onUpdateStatus,
}: StudentInfoProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(student.name);

  const getStatusColor = (status: Student["is_active"]) => {
    return status === true
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(editName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelName = () => {
    setEditName(student.name);
    setIsEditingName(false);
  };

  const handleToggleStatus = () => {
    const newStatus = student.is_active === true ? false : true;
    onUpdateStatus(newStatus);
  };

  return (
    <Card className="bg-white border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing && isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-semibold text-green-800 bg-white"
                  placeholder="Student name"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveName}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelName}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl text-green-800">
                  {student.name}
                </CardTitle>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`${getStatusColor(
                student.is_active
              )} border text-sm h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5`}
            >
              {student.is_active ? "Active" : "Inactive"}
            </Badge>
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleStatus}
                className="text-xs"
              >
                Toggle Status
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-green-700">Email</label>
            <p className="text-gray-700 mt-1">{student.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-green-700">
              Student ID
            </label>
            <p className="text-gray-700 mt-1">{student.id}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-green-700">
            Total Classes
          </label>
          <p className="text-gray-700 mt-1">
            {student.enrolled_courses.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
