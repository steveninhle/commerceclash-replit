import { useCallback } from "react";
import { get, END_POINTS } from "@/api";
import type { ClassStudent } from "../pages/manageClass";
import type { ClassAction } from "./classReducer";

type Dispatch = React.Dispatch<ClassAction>;

export function useClassStudents(classId: string, dispatch: Dispatch) {
  const buildStudentList = useCallback(
    (overviewData: any[], skillsData: any[]): ClassStudent[] => {
      const skillsMap = new Map(skillsData.map((s: any) => [s.id, s]));
      return overviewData.map((s: any) => {
        const skillInfo = skillsMap.get(s.id);
        return {
          id: s.id,
          name: s.name,
          ceo: s.ceo?.id ? { id: s.ceo.id, name: s.ceo.title } : undefined,
          level: s.level || 1,
          xp: s.xp ?? 0,
          ms: s.market_share ?? 0,
          skill_unlocked: skillInfo?.skill_unlocked ?? false,
          skillEntries: skillInfo?.skills ?? [],
          perks: s.perks ?? [],
        };
      });
    },
    [],
  );

  const fetchStudents = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START" });
      const [overviewRes, skillsRes] = await Promise.all([
        get(END_POINTS.GET_CLASS_OVERVIEW.replace("{cid}", classId)),
        get(END_POINTS.GET_STUDENTS_SKILLS.replace("{cid}", classId)),
      ]);
      const merged = buildStudentList(
        overviewRes.data ?? [],
        skillsRes.data ?? [],
      );
      dispatch({ type: "FETCH_SUCCESS", students: merged });
    } catch {
      dispatch({ type: "FETCH_SUCCESS", students: [] });
    }
  }, [classId, buildStudentList, dispatch]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await get(END_POINTS.GET_CEO_DATA.replace("{cid}", classId));
      dispatch({
        type: "SET_ROLES",
        roles: (res.data ?? []).map((c: { id: string; title: string }) => ({
          id: c.id,
          label: c.title,
        })),
      });
    } catch {
      // silently fail
    }
  }, [classId, dispatch]);

  return { fetchStudents, fetchRoles };
}
