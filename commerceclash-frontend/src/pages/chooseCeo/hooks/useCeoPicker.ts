import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { get, post, END_POINTS } from "@/api";
import { useUserContext } from "@/context";
import { normalizeCharacterTitle } from "@/utils/helper";

export interface CeoArchetypePerk {
  id: string;
  title: string;
  description: string | null;
}

export interface CeoArchetype {
  id: string;
  title: string;
  sub_title: string;
  perks: CeoArchetypePerk[];
}

interface EnrolledCourseLite {
  id: string;
  cohort_id?: string | null;
}

export interface CohortPlayer {
  id: string;
  name: string | null;
  ceo_title: string | null;
}

interface CohortPlayersResponse {
  max_students: number;
  students: CohortPlayer[];
}

interface AssignedCeoLite {
  id: string;
}

// When the student hasn't picked (or been assigned) a CEO yet, Baron is the
// default archetype shown/selected, falling back to the first one returned
// if Baron isn't in the list for some reason.
export const getDefaultArchetype = (
  archetypes: CeoArchetype[],
): CeoArchetype | undefined =>
  archetypes.find((a) => normalizeCharacterTitle(a.title) === "baron") ?? archetypes[0];

export const useCeoPicker = () => {
  const { id: studentId } = useUserContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["enrolled-course", studentId],
    queryFn: async () => {
      const res = await get(
        END_POINTS.STUDENT_ENROLLED_COURSES.replace("{student_id}", studentId),
      );
      return (res.data ?? null) as EnrolledCourseLite | null;
    },
    enabled: !!studentId,
  });
  const classId = course?.id ?? null;
  const cohortId = course?.cohort_id ?? null;

  const {
    data: cohortPlayersData,
    isLoading: isLoadingCohortPlayers,
    isError: isCohortPlayersError,
  } = useQuery({
    queryKey: ["cohort-players", cohortId, classId],
    queryFn: async () => {
      const res = await get(
        END_POINTS.COHORT_PLAYERS.replace("{cohort_id}", cohortId!).replace(
          "{class_id}",
          classId!,
        ),
      );
      return res.data as CohortPlayersResponse;
    },
    enabled: !!cohortId && !!classId,
  });

  const { data: archetypes = [], isLoading: isLoadingArchetypes } = useQuery({
    queryKey: ["ceo-archetypes", classId],
    queryFn: async () => {
      const res = await get(END_POINTS.GET_CEO_DATA.replace("{cid}", classId!));
      return (res.data ?? []) as CeoArchetype[];
    },
    enabled: !!classId,
    staleTime: 60_000,
  });

  const assignedCeoQueryKey = ["assigned-ceo", classId, studentId] as const;
  const { data: assignedCeo } = useQuery({
    queryKey: assignedCeoQueryKey,
    queryFn: async () => {
      try {
        const res = await get(
          END_POINTS.GET_ASSIGNED_CEO.replace("{cid}", classId!).replace("{sid}", studentId),
        );
        return (res.data ?? null) as AssignedCeoLite | null;
      } catch {
        return null;
      }
    },
    enabled: !!classId && !!studentId,
  });

  // Preselect the already-assigned CEO once known, otherwise default to Baron.
  useEffect(() => {
    if (selectedId) return;
    if (assignedCeo?.id) setSelectedId(assignedCeo.id);
    else {
      const defaultArchetype = getDefaultArchetype(archetypes);
      if (defaultArchetype) setSelectedId(defaultArchetype.id);
    }
  }, [assignedCeo, archetypes, selectedId]);

  const confirmCeo = async () => {
    if (!classId || !studentId || !selectedId || isConfirming) return;
    setIsConfirming(true);
    try {
      await post(
        END_POINTS.ASSIGN_STUDENT_CEO.replace("{cid}", classId).replace("{sid}", studentId),
        { ceoId: selectedId },
      );
      toast.success("CEO confirmed");
      queryClient.invalidateQueries({ queryKey: assignedCeoQueryKey });
      navigate("/student-enrolled-courses", { replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    studentId,
    classId,
    hasCohort: !!cohortId,
    cohortPlayers: cohortPlayersData?.students ?? [],
    cohortCapacity: cohortPlayersData?.max_students ?? 0,
    isLoadingCohortPlayers: isLoadingCourse || (!!cohortId && isLoadingCohortPlayers),
    isCohortPlayersError,
    archetypes,
    isLoading: !!studentId && (isLoadingCourse || (!!classId && isLoadingArchetypes)),
    selectedId,
    setSelectedId,
    assignedCeoId: assignedCeo?.id ?? null,
    confirmCeo,
    isConfirming,
  };
};
