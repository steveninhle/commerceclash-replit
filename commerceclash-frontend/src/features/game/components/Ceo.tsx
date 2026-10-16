/* eslint-disable @typescript-eslint/no-explicit-any */
import { END_POINTS, get } from "@/api";
import { useSocket, useUserContext } from "@/context";
import { transformCharacterResponse } from "@/transformers";
import { Character } from "@/transformers/types";
import { CharacterName, studentCeoAssets } from "@/utils/helper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AssignStudentCeo } from "@/features/student/components/AssignStudentCeo";
import { CeoTeacherSkeleton } from "./CeoTeacherSkeleton";
import { HeroSelectCardLive as HeroCard } from "./heroSelectCard/HeroSelectCardLive";
import { HeroCardSkeleton } from "./HeroCardSkeleton";

interface RivalSkill {
  attributeName: string;
  value: number;
}

interface RivalSkillTree {
  studentId: string;
  name: string;
  skills: RivalSkill[];
}

export interface ceoInfo {
  id: string;
  name: string;
}
interface StudentName {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  ceo: ceoInfo;
  perks: PerkInfo[];
}

export interface PerkInfo {
  id: string;
  title: string;
  description: string;
  perk_status: string;
  is_unlocked?: boolean;
  is_used?: boolean;
  is_approved?: boolean;
}

export interface PerkApprovalData {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  ceo: ceoInfo;
  perks: PerkInfo[];
}

export interface PerkApprovalResponse {
  success: boolean;
  message: string;
  data: PerkApprovalData;
}

// Query shape for the student's assigned CEO
interface AssignedCeoQueryData {
  character: Character;
  xp: number;
  level: number;
}

export const CEO = ({
  courseId: courseIdProp,
}: { courseId?: string | null } = {}) => {
  const socket = useSocket();
  const location = useLocation();
  const { role, id: student_id } = useUserContext();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");

  const courseId =
    courseIdProp ||
    location.state?.courseId ||
    searchParams.get("courseId") ||
    searchParams.get("classId") ||
    (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null) ||
    localStorage.getItem("currentCourseId") ||
    localStorage.getItem("activeCourseId") ||
    null;

  const [perkRequests, setPerkRequests] = useState<PerkApprovalData>();

  // ── Teacher queries ──────────────────────────────────────────────────────────

  const { data: studentsNames = [], isLoading: isTeacherLoading } = useQuery({
    queryKey: ["students", courseId],
    queryFn: async () => {
      const response = await get(
        END_POINTS.GET_STUDENTS_NAMES.replace("{cid}", courseId),
      );
      return response.data as StudentName[];
    },
    enabled: !!courseId && role === "teacher",
  });

  const { data: charactersList = null } = useQuery({
    queryKey: ["ceo-list", courseId],
    queryFn: async () => {
      const response = await get(
        END_POINTS.GET_CEO_DATA.replace("{cid}", courseId),
      );
      return response.data.map((character: Character) => ({
        id: character.id,
        label: character.title,
      }));
    },
    enabled: !!courseId && role === "teacher",
    staleTime: 60_000, // CEO archetype list rarely changes
  });

  // ── Student query ─────────────────────────────────────────────────────────────

  const { data: ceoData, isLoading } = useQuery({
    queryKey: ["assigned-ceo", courseId, student_id],
    queryFn: async () => {
      const response = await get(
        END_POINTS.GET_ASSIGNED_CEO.replace("{cid}", courseId).replace(
          "{sid}",
          student_id,
        ),
      );
      return {
        character: transformCharacterResponse(response.data),
        xp: response?.data?.xp ?? 0,
        level: response?.data?.level ?? 1,
      } satisfies AssignedCeoQueryData;
    },
    enabled: !!courseId && role === "student",
    // The current CEO response omits cooldown timestamps. Re-read the server's
    // computed is_used flag instead of inventing a local cooldown deadline.
    refetchInterval: (query) =>
      query.state.data?.character.perks.some((perk) => perk.used) ? 15_000 : false,
  });

  const assignedCharacter = ceoData?.character ?? null;
  useEffect(() => {
    const dates = assignedCharacter?.perks
      .filter((perk) => perk.used && perk.is_repeatable && perk.next_available_at)
      .map((perk) => Date.parse(perk.next_available_at!))
      .filter((date) => Number.isFinite(date) && date > Date.now()) ?? [];
    if (!dates.length) return;
    const timer = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ["assigned-ceo", courseId, student_id] });
    }, Math.min(...dates) - Date.now() + 50);
    return () => clearTimeout(timer);
  }, [assignedCharacter, queryClient, courseId, student_id]);

  const xpProgress = ceoData?.xp ?? 0;
  const levelProgress = ceoData?.level ?? 1;

  // Keep perkRequests in sync whenever students data refetches
  useEffect(() => {
    if (!perkRequests || !studentsNames.length) return;
    const updated = studentsNames.find((s) => s.id === perkRequests.id);
    if (updated) setPerkRequests(updated);
  }, [studentsNames, perkRequests?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared helpers ────────────────────────────────────────────────────────────

  const updatePerkInState = useCallback(
    (
      predicate: (p: Character["perks"][number]) => boolean,
      patch: Partial<Character["perks"][number]>,
    ) => {
      queryClient.setQueryData(
        ["assigned-ceo", courseId, student_id],
        (old: AssignedCeoQueryData | undefined) =>
          old
            ? {
                ...old,
                character: {
                  ...old.character,
                  perks: old.character.perks.map((p) =>
                    predicate(p) ? { ...p, ...patch } : p,
                  ),
                },
              }
            : old,
      );
    },
    [queryClient, courseId, student_id],
  );

  const orderedPerks = useMemo(() => {
    if (!assignedCharacter?.perks) return [];
    if (assignedCharacter.title !== "The Visionary") {
      return assignedCharacter.perks;
    }
    return [...assignedCharacter.perks].sort((a, b) => {
      if (a.key === "strategic_rebirth") return -1;
      if (b.key === "strategic_rebirth") return 1;
      return 0;
    });
  }, [assignedCharacter]);

  // ── Teacher socket callbacks ──────────────────────────────────────────────────

  const handlePerkApproveRequest = useCallback(
    () => {
      // toast.info(`Perk approval request from ${response.data.name}`);
      queryClient.invalidateQueries({ queryKey: ["students", courseId] });
    },
    [queryClient, courseId],
  );

  const isPerkUsed = useCallback(
    () => {
      // toast.info(`Perk used: ${response.data.name}`);
      queryClient.invalidateQueries({ queryKey: ["ceo-list", courseId] });
    },
    [queryClient, courseId],
  );

  const momentOfGlory = useCallback(
    () => {
      // toast.info(`momentOfGlory: ${response.data.name}`);
      queryClient.invalidateQueries({ queryKey: ["ceo-list", courseId] });
    },
    [queryClient, courseId],
  );

  const trendSetter = useCallback(
    () => {
      // toast.info(`trendSetter: ${response.data.name}`);
      queryClient.invalidateQueries({ queryKey: ["ceo-list", courseId] });
    },
    [queryClient, courseId],
  );

  const trailblazer = useCallback(
    () => {
      // toast.info(
      //   `🎯 Trailblazer: ${response.data.student.name} should choose from 2 challenge cards!`,
      //   { duration: 10000 },
      // );
      queryClient.invalidateQueries({ queryKey: ["ceo-list", courseId] });
    },
    [queryClient, courseId],
  );

  // ── Student socket callbacks ──────────────────────────────────────────────────

  const handleStudentSidePerkApprove = useCallback(
    (response: {
      success: boolean;
      message: string;
      data: {
        perkId: string;
        perk_status: string;
        effects?: {
          skillTrees?: RivalSkillTree[];
          requiresSelection?: boolean;
          pendingCompletion?: boolean;
        };
      };
    }) => {
      if (!response.success) return;
      const { perkId, perk_status, effects } = response.data;

      if (effects?.skillTrees && effects.skillTrees.length > 0) {
        // toast.success("Corporate Espionage activated! Viewing rival skill trees...");
        updatePerkInState((p) => p.id === perkId, {
          status: perk_status as any,
          used: true,
        });
        return;
      }

      if (effects?.requiresSelection || effects?.pendingCompletion) return;

      updatePerkInState((p) => p.id === perkId, {
        status: perk_status as any,
        used: perk_status === "used",
      });
    },
    [updatePerkInState],
  );

  const handleStudentSidePerkDeny = useCallback(
    (response: {
      success: boolean;
      message: string;
      data: { perkKey: string; perk_status: string; is_approved: boolean };
    }) => {
      if (response.success) {
        toast.error(response.message || "Your perk was denied by the teacher.");
      }
      updatePerkInState((p) => p.key === response.data.perkKey, {
        status: response.data.perk_status as any,
        approved: false,
      });
    },
    [updatePerkInState],
  );

  const handlePerkUpdated = useCallback(
    (response: {
      success: boolean;
      message: string;
      data: {
        perkId: string;
        action: "lock" | "unlock" | "reset";
        is_unlocked?: boolean;
        is_used?: boolean;
        is_approved?: boolean;
        perk_status?: string | null;
      };
    }) => {
      if (!response.success) return;
      // toast.info(response.message);
      void queryClient.invalidateQueries({
        queryKey: ["assigned-ceo", courseId, student_id],
      });
      const { perkId, action } = response.data;
      if (action === "lock") {
        updatePerkInState((p) => p.id === perkId, { is_unlocked: false });
      } else if (action === "unlock") {
        updatePerkInState((p) => p.id === perkId, {
          is_unlocked: true,
          status: null,
        });
      } else if (action === "reset") {
        updatePerkInState((p) => p.id === perkId, {
          used: false,
          approved: false,
          status: null,
        });
      }
    },
    [updatePerkInState, queryClient, courseId, student_id],
  );

  const handleXpUpdated = useCallback(
    (response: { success: boolean; data: { xp: number; level: number; studentId?: string } }) => {
      if (!response.success || (response.data.studentId && response.data.studentId !== student_id)) return;
      queryClient.setQueryData(
        ["assigned-ceo", courseId, student_id],
        (old: AssignedCeoQueryData | undefined) =>
          old
            ? { ...old, xp: response.data.xp, level: response.data.level ?? 1,
                character: { ...old.character, xp: response.data.xp, level: response.data.level ?? 1 } }
            : old,
      );
    },
    [queryClient, courseId, student_id],
  );

  const queuePerkRequest = (data: StudentName) => {
    setPerkRequests(data);
  };

  // ── Socket effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (role === "student") {
      const joinRoom = () => {
        socket.emit("join-room", { classId: [courseId], studentId: student_id });
      };

      const handlePerksAutoUnlocked = (response: {
        success: boolean;
        data?: { studentId: string; perkIds: string[]; level: number; xp: number };
      }) => {
        if (!response.success) return;
        const { studentId, perkIds, level, xp } = response.data ?? {};
        if (studentId !== student_id || !perkIds?.length) return;

        const perkIdSet = new Set(perkIds);
        queryClient.setQueryData(
          ["assigned-ceo", courseId, student_id],
          (old: AssignedCeoQueryData | undefined) => {
            if (!old) return old;
            return {
              ...old,
              xp: xp ?? old.xp,
              level: level ?? old.level,
              character: {
                ...old.character,
                perks: old.character.perks.map((p) =>
                  perkIdSet.has(p.id) ? { ...p, is_unlocked: true } : p,
                ),
              },
            };
          },
        );

        // const perkLabel = (xp ?? 0) >= 40 ? "Ultra perk" : "Core perk";
        // toast.success(
        //   `${perkLabel}${perkIds.length > 1 ? "s" : ""} unlocked! (Level ${level})`,
        // );
      };

      joinRoom();
      socket.on("connect", joinRoom);
      socket.on("perk-activated", handleStudentSidePerkApprove);
      socket.on("perk-denied", handleStudentSidePerkDeny);
      socket.on("perk-updated", handlePerkUpdated);
      socket.on("perk-request-confirmation", () => {});
      socket.on("perks-auto-unlocked", handlePerksAutoUnlocked);
      socket.on("xp-updated", handleXpUpdated);

      return () => {
        socket.off("connect", joinRoom);
        socket.off("perk-request-confirmation");
        socket.off("perk-activated", handleStudentSidePerkApprove);
        socket.off("perk-denied", handleStudentSidePerkDeny);
        socket.off("perk-updated", handlePerkUpdated);
        socket.off("perks-auto-unlocked", handlePerksAutoUnlocked);
        socket.off("xp-updated", handleXpUpdated);
      };
    } else if (role === "teacher") {
      socket.emit("join-room", { classId: [courseId], teacherId: student_id });
    }
  }, [
    courseId,
    student_id,
    socket,
    role,
    queryClient,
    handleStudentSidePerkApprove,
    handleStudentSidePerkDeny,
    handlePerkUpdated,
    handleXpUpdated,
  ]);

  useEffect(() => {
    if (role !== "student") return;
    const handleAssignedCeo = (response: {
      success: boolean;
      message: string;
      data: {
        result: {
          archetype: { id: string; title: string; sub_title: string };
          xp: number | null;
          level: number | null;
          perks: Parameters<typeof transformCharacterResponse>[0]["perks"];
        };
      };
    }) => {
      if (!response.success) return;
      const { archetype, xp, level, perks } = response.data.result;
      queryClient.setQueryData(["assigned-ceo", courseId, student_id], {
        character: transformCharacterResponse({
          id: archetype.id,
          title: archetype.title,
          sub_title: archetype.sub_title,
          xp: xp ?? 0,
          level: level ?? 0,
          perks,
        }),
        xp: xp ?? 0,
        level: level ?? 1,
      } satisfies AssignedCeoQueryData);
    };

    socket.on("joined-room", () => {});
    socket.on("assigned-ceo", handleAssignedCeo);
    return () => {
      socket.off("assigned-ceo", handleAssignedCeo);
      socket.off("joined-room");
    };
  }, [role, socket, queryClient, courseId, student_id]);

  useEffect(() => {
    if (role !== "teacher") return;
    socket.on("perk-approve-request", handlePerkApproveRequest);
    socket.on("perk-used", isPerkUsed);
    socket.on("moment-of-glory", momentOfGlory);
    socket.on("trendsetter", trendSetter);
    socket.on("trailblazer", trailblazer);
    socket.on("perk-action-confirmation", () => {
      queryClient.invalidateQueries({ queryKey: ["ceo-list", courseId] });
      queryClient.invalidateQueries({ queryKey: ["students", courseId] });
    });

    return () => {
      socket.off("perk-approve-request", handlePerkApproveRequest);
      socket.off("perk-used", isPerkUsed);
      socket.off("moment-of-glory", momentOfGlory);
      socket.off("trendsetter", trendSetter);
      socket.off("trailblazer", trailblazer);
      socket.off("perk-action-confirmation");
    };
  }, [
    role,
    socket,
    queryClient,
    courseId,
    handlePerkApproveRequest,
    isPerkUsed,
    momentOfGlory,
    trendSetter,
    trailblazer,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-2 h-full flex flex-col">
      {role === "teacher" ? (
        <div className="flex flex-col items-center gap-2 overflow-y-auto scrollbar-hide h-full p-2">
          {isTeacherLoading ? (
            <CeoTeacherSkeleton />
          ) : (
            studentsNames &&
            charactersList &&
            studentsNames.map((student: StudentName) => (
              <AssignStudentCeo
                key={student.id}
                id={student.id}
                studentName={student.name}
                initialRole={student.ceo?.name}
                roles={charactersList}
                onPerkRequest={() => queuePerkRequest(student)}
                perkRequests={perkRequests}
                onDataRefresh={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["students", courseId],
                  })
                }
              />
            ))
          )}
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {isLoading ? (
            <HeroCardSkeleton />
          ) : assignedCharacter?.id ? (
            <HeroCard
              key={`${courseId}:${student_id}:${assignedCharacter.id}`}
              courseId={courseId}
              xpProgress={xpProgress}
              levelProgress={levelProgress}
              character={{
                ...assignedCharacter,
                perks: orderedPerks,
              }}
              imageSrc={
                studentCeoAssets(assignedCharacter.title as CharacterName)
                  ?.imageSrc
              }
              imageAlt={
                studentCeoAssets(assignedCharacter.title as CharacterName)
                  ?.imageAlt
              }
              logoSrc={
                studentCeoAssets(assignedCharacter.title as CharacterName)
                  ?.logoSrc
              }
              onRefresh={() =>
                queryClient.invalidateQueries({
                  queryKey: ["assigned-ceo", courseId, student_id],
                })
              }
              onPerkUpdate={(sel, patch) =>
                updatePerkInState(
                  (p) =>
                    sel.id
                      ? p.id === sel.id
                      : sel.key
                        ? p.key === sel.key
                        : false,
                  patch,
                )
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                No CEO assigned at the moment
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
