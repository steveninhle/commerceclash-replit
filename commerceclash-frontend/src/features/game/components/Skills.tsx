import { END_POINTS, get, patch } from "@/api";
import { useSocket } from "@/context";
import { Lock, Save, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext/userContext";
import { SkillAllocator } from "./SkillAllocator";
import { SkillsSkeleton } from "./SkillsSkeleton";
import { StudentSkillCard } from "./StudentSkillCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type StudentsSkills = {
  id: string;
  name: string;
  max: number;
  skill_unlocked?: boolean;
  skills: {
    label: string;
    value: number;
    id: string;
  }[];
};

type PendingChange = {
  studentId: string;
  skillId: string;
  newValue: number;
  originalValue: number;
};

export const Skill = () => {
  const socket = useSocket();
  const location = useLocation();
  const { role, id } = useUserContext();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");

  const courseId =
    location.state?.courseId ||
    (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null);
  const [studentsSkills, setStudentsSkills] = useState<StudentsSkills[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [skillsLockStatus, setSkillsLockStatus] = useState<
    Record<string, boolean>
  >({});
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const fetchSkills = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await get(
        END_POINTS.GET_STUDENTS_SKILLS.replace("{cid}", courseId),
      );
      setStudentsSkills(response.data);

      // Initialize lock status for each student
      const lockStatus: Record<string, boolean> = {};
      response.data.forEach((student: StudentsSkills) => {
        lockStatus[student.id] = student.skill_unlocked === false;
      });
      setSkillsLockStatus(lockStatus);

      // Clear pending changes after refresh
      setPendingChanges(new Map());
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const handleLocalSkillChange = useCallback(
    (studentId: string, skillId: string, newValue: number) => {
      // Find the original value
      const student = studentsSkills?.find((s) => s.id === studentId);
      const skill = student?.skills.find((sk) => sk.id === skillId);
      const originalValue = skill?.value ?? 0;

      const changeKey = `${studentId}-${skillId}`;

      setPendingChanges((prev) => {
        const newChanges = new Map(prev);

        if (newValue === originalValue) {
          // If value is back to original, remove the pending change
          newChanges.delete(changeKey);
        } else {
          newChanges.set(changeKey, {
            studentId,
            skillId,
            newValue,
            originalValue,
          });
        }

        return newChanges;
      });
    },
    [studentsSkills],
  );

  const handleSaveAllChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    const changes = Array.from(pendingChanges.values());

    try {
      // Attempt all changes in parallel, tracking successes and failures
      // const results =
       await Promise.allSettled(
        changes.map(async (change) => {
          return patch(
            END_POINTS.UPDATE_SKILL
              .replace("{sid}", change.studentId)
              .replace("{cid}", courseId)
              .replace("{skillId}", change.skillId),
            { value: change.newValue },
          );
        }),
      );

      // Always refresh to show current state from server
      await fetchSkills();
    } catch (error) {
      // This catch is for unexpected errors in the Promise.allSettled itself
      toast.error("Something went wrong saving your changes. Please try again.");
      // Still refresh to ensure UI matches server state
      await fetchSkills();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, courseId, fetchSkills]);

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges(new Map());
    // Force re-render by updating the key or refetching
    fetchSkills();
  }, [fetchSkills]);

  const handleToggleClassSkills = useCallback(() => {
    if (!courseId) return;

    socket.emit("update-skills-status", {
      classId: courseId,
      studentId: undefined, // No studentId means class-wide toggle
    });

    toast.info("Toggling skills status for all students...");
  }, [courseId, socket]);

  const handleToggleStudentSkills = useCallback(
    (studentId: string) => {
      if (!courseId) return;

      socket.emit("update-skills-status", {
        classId: courseId,
        studentId: studentId,
      });

      toast.info("Toggling skills status...");
    },
    [courseId, socket],
  );

  useEffect(() => {
    if (role === "teacher") {
      fetchSkills();

      // Join the class room for socket updates
      socket.emit("join-room", { classId: [courseId], teacherId: id });

      // Listen for skill status updates
      socket.on("skills-status-updated", (response: any) => {
        if (response.success) {
          // toast.success(response.message);
          // Update lock status
          if (response.data.studentId) {
            // Individual student update
            const isLocked = response.data.skill_unlocked === false;

            setSkillsLockStatus((prev) => ({
              ...prev,
              [response.data.studentId]: isLocked,
            }));
            // Update the studentsSkills array
            setStudentsSkills((prev) => {
              if (!prev) return prev;
              return prev.map((student) =>
                student.id === response.data.studentId
                  ? { ...student, skill_unlocked: response.data.skill_unlocked }
                  : student,
              );
            });
          } else {
            // Class-wide update
            const isLocked = response.data.skill_unlocked === false;

            setSkillsLockStatus((prev) => {
              const newStatus: Record<string, boolean> = {};
              Object.keys(prev).forEach((key) => {
                newStatus[key] = isLocked;
              });
              return newStatus;
            });
            // Update the studentsSkills array
            setStudentsSkills((prev) => {
              if (!prev) return prev;
              return prev.map((student) => ({
                ...student,
                skill_unlocked: response.data.skill_unlocked,
              }));
            });
          }
        }
      });

      // Listen for skill updates from students
      socket.on("skill-updated", (response: any) => {
        if (response.studentId) {
          fetchSkills();
        }
      });

      return () => {
        socket.off("skills-status-updated");
        socket.off("skill-updated");
      };
    }
  }, [fetchSkills, role, courseId, id, socket]);

  return (
    <section className="h-full w-full">
      {role === "student" ? (
        <SkillAllocator courseId={courseId} sid={id} />
      ) : (
        <div className="h-full w-full flex flex-col p-2">
          {isLoading ? (
            <SkillsSkeleton />
          ) : (
            <>
              {/* Class-wide toggle and Save button */}
              <div className="!font-sans !w-full !mb-2 !px-3 !py-2 !bg-white !border-b !border-[#3a3a3a]">
                <div className="flex items-center justify-between mb-2">
                  <p className="!text-xs !font-medium !text-black">
                    Class Control
                  </p>
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-xs !text-white/60">
                      {Object.values(skillsLockStatus).every((locked) => locked)
                        ? "All Locked"
                        : "Some Unlocked"}
                    </span>
                    <Switch
                      checked={
                        !Object.values(skillsLockStatus).every(
                          (locked) => locked,
                        )
                      }
                      onCheckedChange={handleToggleClassSkills}
                      className="data-[state=checked]:!bg-green-500 data-[state=unchecked]:!bg-red-500"
                    />
                  </div>
                </div>

                {/* Save/Discard buttons */}
                {pendingChanges.size > 0 && (
                  <div className="!flex !items-center !justify-between !gap-2 !pt-2 !border-[#3a3a3a]">
                    <span className="!text-xs !text-yellow-400">
                      {pendingChanges.size} unsaved change
                      {pendingChanges.size > 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDiscardChanges}
                        disabled={isSaving}
                        className="!h-7 !text-xs"
                      >
                        Discard
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAllChanges}
                        disabled={isSaving}
                        className="!h-7 !text-white !text-xs !bg-green-600 hover:!bg-green-700"
                      >
                        <Save className="!h-3 !!mr-1" />
                        {isSaving ? "Saving..." : "Save All"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Student skill cards */}
              <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center">
                {studentsSkills?.map((student) => (
                  <div key={student.id} className="w-full mb-2">
                    <div className="flex items-center justify-between mb-1 px-2">
                      <span className="text-xs text-white/60">
                        {skillsLockStatus[student.id] ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3 text-red-400" />
                            Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3 w-3 text-green-400" />
                            Unlocked
                          </span>
                        )}
                      </span>
                      <Switch
                        checked={!skillsLockStatus[student.id]}
                        onCheckedChange={() =>
                          handleToggleStudentSkills(student.id)
                        }
                        className="data-[state=checked]:!bg-green-500 data-[state=unchecked]:!bg-red-500"
                      />
                    </div>
                    <StudentSkillCard
                      studentID={student.id}
                      name={student.name}
                      skills={student.skills}
                      max={student.max}
                      courseId={courseId}
                      onSkillChange={fetchSkills}
                      isLocked={skillsLockStatus[student.id]}
                      batchMode={true}
                      onLocalChange={handleLocalSkillChange}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
