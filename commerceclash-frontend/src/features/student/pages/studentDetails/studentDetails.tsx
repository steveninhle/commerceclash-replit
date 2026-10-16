import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Student } from "@/components/types";

import { get, END_POINTS, patch, del } from "@/api";
import { StudentInfo } from "@/features/student/components/StudentInfo";
import { EditButton } from "@/components/EditButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext/userContext";

export const StudentDetails = () => {
  const { id: student_id } = useParams();
  const { id: teacher_id } = useUserContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);

  const fetchStudent = useCallback(async () => {
    try {
      if (!student_id) {
        toast.error("Your student profile couldn't be loaded. Please try again.");
        return;
      }
      const student = await get(
        END_POINTS.STUDENT_BY_ID.replace("{student_id}", student_id)
      );
      setStudent(student.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [student_id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);


  const handleUpdateName = (name: string) => {
    if (!student) return;
    setStudent({ ...student, name });
  };

  const handleUpdateStatus = (status: Student["is_active"]) => {
    if (!student) return;
    setStudent({ ...student, is_active: status });
  };

  const handleSave = async () => {
    const updatedStudent = {
      name: student?.name,
      is_active: student?.is_active,
    };
    try {
      if (!teacher_id || !student_id) {
        toast.error("Required information is missing. Please refresh and try again.");
        return;
      }
      await patch(
        END_POINTS.UPDATE_STUDENT_BY_ID.replace(
          "{teacher_id}",
          teacher_id
        ).replace("{student_id}", student_id),
        updatedStudent
      );
      // toast.success("Student data saved");
      fetchStudent();
    } catch (error) {
      toast.error((error as Error).message);
    }
    setOriginalStudent(JSON.parse(JSON.stringify(student)));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!student_id) {
      toast.error("Unable to delete this student. Please try again.");
      return;
    }
    try {
      await del(END_POINTS.DELETE_STUDENT.replace("{sid}", student_id));
      fetchStudent();
      // toast.success("Student deleted");
      navigate(-1);
    } catch (error) {
      toast.error((error as Error).message);
    }

  }

  const handleCancel = () => {
    if (originalStudent) {
      setStudent(JSON.parse(JSON.stringify(originalStudent))); // Restore original
    }
    setIsEditing(false);
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* <Lottie animationData={animations.loadingAnimation} loop={true} /> */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500">
          <Loader2 className="h-6 w-6 text-green-500" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-green-800 mb-4">
              Student Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The student with ID "{student_id}" could not be found.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 justify-end">
          <EditButton
            title="Edit Student"
            isEditing={isEditing}
            onToggle={handleToggleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          <Button
            variant="destructive"
            className="border border-gray-400/50"
            size="sm"
            onClick={handleDelete}
          >
            <Trash className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>

        {/* Student Information */}
        <StudentInfo
          student={student}
          isEditing={isEditing}
          onUpdateName={handleUpdateName}
          onUpdateStatus={handleUpdateStatus}
        />

      </div>
    </div>
  );
};
