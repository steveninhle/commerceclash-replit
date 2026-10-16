import { useState, useEffect } from "react";
import { Search, UserPlus, SlidersHorizontal } from "lucide-react";
import { Student } from "@/components/types";
import { useNavigate } from "react-router-dom";
import { get, del, patch, END_POINTS } from "@/api";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext/userContext";
import { StatCard } from "@/features/teacher/components/StatCard";
import { StudentTable } from "@/features/teacher/components/StudentTable";
import { EditStudentModal } from "@/features/teacher/components/EditStudentModal";
import { AddStudentModal } from "@/features/teacher/components/AddStudentModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export function StudentDashboard() {
  const { id } = useUserContext();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await get(END_POINTS.STUDENT.replace("{teacher_id}", id));
        setStudents(res.data);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [id]);

  const handleToggleStatus = async (
    studentId: string,
    currentStatus: boolean,
  ) => {
    try {
      await patch(
        END_POINTS.TOGGLE_STUDENT_STATUS.replace("{teacher_id}", id).replace(
          "{student_id}",
          studentId,
        ),
        { is_active: !currentStatus },
      );
      setStudents((prev) =>
        prev
          ? prev.map((s) =>
              s.id === studentId ? { ...s, is_active: !currentStatus } : s,
            )
          : null,
      );
      toast.success(`Student ${!currentStatus ? "activated" : "archived"}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (studentId: string) => {
    setDeleting(true);
    try {
      await del(END_POINTS.DELETE_STUDENT.replace("{sid}", studentId));
      setStudents((prev) =>
        prev ? prev.filter((s) => s.id !== studentId) : null,
      );
      toast.success("Student deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
    setDeleting(false);
    setPendingDeleteId(null);
  };

  const filtered =
    students?.filter(
      (s) =>
        s?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        s?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
    ) ?? [];

  const totalStudents = students?.length ?? 0;
  const activeStudents = students?.filter((s) => s.is_active).length ?? 0;
  const completedStudents = students?.filter((s) => !s.is_active).length ?? 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
          Students
        </h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold tracking-wide transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "TOTAL STUDENTS", value: totalStudents },
          { label: "ACTIVE", value: activeStudents },
          { label: "COMPLETED", value: completedStudents },
        ].map(({ label, value }) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search students by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-800 bg-[#111] text-gray-500 hover:text-gray-200 hover:border-gray-600 text-xs font-bold tracking-widest uppercase transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filter Options
        </button>
      </div>

      <StudentTable
        students={filtered}
        onToggleStatus={handleToggleStatus}
        onDelete={(id) => setPendingDeleteId(id)}
        navigate={navigate}
        searchTerm={searchTerm}
        onEdit={(id) => setEditStudentId(id)}
        loading={loading}
      />

      <EditStudentModal
        studentId={editStudentId}
        onClose={() => setEditStudentId(null)}
        onDeleted={(id) => {
          setStudents((prev) =>
            prev ? prev.filter((s) => s.id !== id) : null,
          );
          setEditStudentId(null);
        }}
        onSaved={(updated) => {
          setStudents((prev) =>
            prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : null,
          );
        }}
      />

      <AddStudentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={(student) => {
          setStudents((prev) => (prev ? [...prev, student] : [student]));
        }}
      />

      <ConfirmDeleteModal
        open={!!pendingDeleteId}
        title="Delete Student"
        description="Are you sure you'd like to delete this student? All of their data will be permanently removed. This cannot be undone."
        loading={deleting}
        onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
