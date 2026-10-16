import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { Student } from "@/components/types";
import { Input } from "@/components/ui/input";
import { get, patch, del, post, END_POINTS } from "@/api";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext/userContext";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { Button } from "@/components/ui/button";

interface EditStudentModalProps {
  studentId: string | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved: (updated: Student) => void;
}

export function EditStudentModal({
  studentId,
  onClose,
  onDeleted,
  onSaved,
}: EditStudentModalProps) {
  const { id: teacherId } = useUserContext();
  const [student, setStudent] = useState<Student | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("United States");
  const [cohortIds, setCohortIds] = useState<string[]>([]);
  const [originalCohortIds, setOriginalCohortIds] = useState<string[]>([]);
  const [cohortOpen, setCohortOpen] = useState(false);
  const [status, setStatus] = useState("Active");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await get(END_POINTS.CLASS);
        const all = [
          ...(res.data?.active ?? []),
          ...(res.data?.scheduled ?? []),
          ...(res.data?.completed ?? []),
        ];
        setClasses(all.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      } catch {
        // non-critical, ignore
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const fetch = async () => {
      try {
        const res = await get(
          END_POINTS.STUDENT_BY_ID.replace("{student_id}", studentId),
        );
        const s: Student = res.data;
        setStudent(s);
        const parts = s.name?.split(" ") ?? [];
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" ") ?? "");
        setEmail(s.email ?? "");
        const enrolledIds = s.enrolled_courses?.map((c) => c.id) ?? [];
        setCohortIds(enrolledIds);
        setOriginalCohortIds(enrolledIds);
        setStatus(s.is_active ? "Active" : "Archived");
      } catch (err) {
        toast.error((err as Error).message);
      }
    };
    fetch();
  }, [studentId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCohortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!studentId) return null;

  const toggleCohort = (id: string) => {
    setCohortIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const updated = {
        name: `${firstName} ${lastName}`.trim(),
        is_active: status === "Active",
      };
      await patch(
        END_POINTS.UPDATE_STUDENT_BY_ID.replace(
          "{teacher_id}",
          teacherId,
        ).replace("{student_id}", student.id),
        updated,
      );

      const toUnenroll = originalCohortIds.filter((id) => !cohortIds.includes(id));
      const toEnroll = cohortIds.filter((id) => !originalCohortIds.includes(id));

      await Promise.all([
        ...toUnenroll.map((classId) =>
          del(
            END_POINTS.UNENROLL_COURSE
              .replace("{student_id}", student.id)
              .replace("{class_id}", classId),
          ),
        ),
        ...toEnroll.map((classId) =>
          post(
            END_POINTS.ENROLL_STUDENT
              .replace("{class_id}", classId)
              .replace("{student_id}", student.id),
            {},
          ),
        ),
      ]);

      const updatedEnrolledCourses = classes.filter((c) => cohortIds.includes(c.id));
      toast.success("Student updated");
      onSaved({ ...student, ...updated, enrolled_courses: updatedEnrolledCourses });
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      await del(END_POINTS.DELETE_STUDENT.replace("{sid}", student.id));
      toast.success("Student deleted");
      onDeleted(student.id);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const fieldClass =
    "w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 px-4 py-2.5 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-400";
  const labelClass =
    "text-[10px] font-bold tracking-widest uppercase text-gray-400";

  const selectedNames = classes
    .filter((c) => cohortIds.includes(c.id))
    .map((c) => c.name);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="relative w-[560px] bg-[#222425] rounded-2xl p-8 shadow-2xl ">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-2xl font-bold text-white">
              Edit Student
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="border-b border-gray-800 mb-6" />

          {/* Personal Information */}
          <p className="text-xs font-bold tracking-widest uppercase text-white mb-4 border-b border-gray-800 pb-2">
            Personal Information
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                  First Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                  Email Address
                </label>
                <Input
                  value={email}
                  readOnly
                  className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-widest uppercase text-white">
                  Country
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#2c2f31] border-[#3a3d40] !rounded-xs border text-white placeholder:text-gray-500 px-4 py-2.5 transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-500 shadow-sm focus:shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1" ref={dropdownRef}>
                <label className={labelClass}>Active Cohorts</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCohortOpen((o) => !o)}
                    className={`${fieldClass} flex items-center justify-between text-left`}
                  >
                    <span className="truncate text-sm">
                      {selectedNames.length === 0
                        ? "— None —"
                        : selectedNames.join(", ")}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  </button>

                  {cohortOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-[#3a3d40] bg-[#2c2f31] shadow-lg h-[250px] overflow-auto ">
                      {classes.length === 0 ? (
                        <p className="px-4 py-2.5 text-sm text-gray-500">No classes found</p>
                      ) : (
                        classes.map((c) => {
                          const selected = cohortIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCohort(c.id)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-[#3a3d40] transition-colors"
                            >
                              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-green-500 bg-green-500" : "border-gray-500"}`}>
                                {selected && <Check className="h-3 w-3 text-black" />}
                              </div>
                              {c.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>System Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`${fieldClass} appearance-none`}
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save */}
          <Button
            variant="green"
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-8 py-3 !rounded-xs !text-black text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete}
        title="Delete Student"
        description="Are you sure you'd like to delete this student? All of their data will be permanently removed. This cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
