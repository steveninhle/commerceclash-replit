import { END_POINTS, get, patch, post } from "@/api";
import { ContainerBg, TextInvest, Vector } from "@/assets/svgs";
import { useSocket } from "@/context";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Lock, Shuffle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ConfirmSkillModal from "./ConfirmSkillModal";
import { defaultCategories } from "@/features/game/constants";
import { CrownBadge, images, SkillBadge } from "@/assets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Values = Record<string, number>;

type ShiftAction = {
  fromSkill: string;
  toSkill: string;
};

type SkillApiResponse = {
  id: string;
  name: string;
  value: number;
  temporaryValue?: number;
  effectiveValue?: number;
};

// Shape of the raw API response stored in React Query cache
type SkillsRaw = {
  available_points: number;
  skill_unlocked: boolean | undefined;
  is_shifting: boolean;
  shifting_points: number;
  skills: SkillApiResponse[];
};

export type SkillAllocatorProps = {
  onConfirm?: (values: Values) => void;
  courseId?: string;
  sid?: string;
};

export const SkillAllocator = ({
  onConfirm,
  courseId,
  sid,
}: SkillAllocatorProps) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["skills", sid, courseId] as const, [sid, courseId]);

  // ── Server state (React Query cache) ────────────────────────────────────
  const { data, isLoading: isInitialLoading } = useQuery<SkillsRaw>({
    queryKey,
    queryFn: async () => {
      const response = await get(
        END_POINTS.GET_SKILLS.replace("{sid}", sid!).replace("{cid}", courseId!),
      );
      return response.data as SkillsRaw;
    },
    enabled: !!sid && !!courseId,
  });

  // ── Local pending edits (user's +/- before Save) ─────────────────────
  const [pendingValues, setPendingValues] = useState<Values>({});
  const hasPendingRef = useRef(false); // synchronous guard for socket handlers

  // ── UI-only state ────────────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(false);
  const [shiftActions, setShiftActions] = useState<ShiftAction[]>([]);
  const [selectedFromSkill, setSelectedFromSkill] = useState<string | null>(null);

  // ── Derived from cache ───────────────────────────────────────────────────
  const serverValues = useMemo<Values>(
    () => Object.fromEntries((data?.skills ?? []).map((s) => [s.id, s.value])),
    [data?.skills],
  );

  const temporaryModifiers = useMemo<Record<string, number>>(
    () => Object.fromEntries((data?.skills ?? []).map((s) => [s.id, s.temporaryValue ?? 0])),
    [data?.skills],
  );

  const effectiveValues = useMemo<Record<string, number>>(
    () =>
      Object.fromEntries(
        (data?.skills ?? []).map((s) => [
          s.id,
          s.effectiveValue ?? Math.max(0, Math.min(8, s.value + (s.temporaryValue ?? 0))),
        ]),
      ),
    [data?.skills],
  );

  const categories = useMemo(() => {
    if (!data?.skills?.length) return defaultCategories;
    return data.skills.map((skill, index) => {
      const existing =
        defaultCategories.find((c) => c.key === skill.id) ?? defaultCategories[index];
      return { ...existing, label: skill.name || "N/A", key: skill.id || (index + 1).toString() };
    });
  }, [data?.skills]);

  // serverValues + pendingValues overlay = what the UI shows
  const values = useMemo<Values>(
    () => ({ ...serverValues, ...pendingValues }),
    [serverValues, pendingValues],
  );

  const hasUnsavedChanges = Object.keys(pendingValues).length > 0;
  const isSkillsLocked = data?.skill_unlocked === false;
  const isShifting = data?.is_shifting ?? false;
  const shiftingPoints = data?.shifting_points ?? 0;
  const availablePoints = data?.available_points ?? 0;

  const netPendingDelta = useMemo(
    () =>
      Object.entries(pendingValues).reduce(
        (acc, [id, val]) => acc + val - (serverValues[id] ?? 0),
        0,
      ),
    [pendingValues, serverValues],
  );
  const displayAvailable = Math.max(0, availablePoints - netPendingDelta);

  // Reset shift state when the server says shifting is over
  useEffect(() => {
    if (!isShifting || shiftingPoints === 0) {
      setShiftActions([]);
      setSelectedFromSkill(null);
    }
  }, [isShifting, shiftingPoints]);

  const handleModalVisibility = () => {
    setIsVisible(!isVisible);
    onConfirm?.(values);
  };

  // ── Save mutation (optimistic) ───────────────────────────────────────────
  const saveMutation = useMutation<
    { failedIds: string[]; allIds: string[] },
    Error,
    { snapshot: Values; serverSnap: Values },
    { previous: SkillsRaw | undefined }
  >({
    mutationFn: async ({ snapshot, serverSnap }) => {
      const changedSkills = Object.keys(snapshot).filter(
        (id) => snapshot[id] !== (serverSnap[id] ?? 0),
      );
      const decreases = changedSkills.filter((id) => snapshot[id] < (serverSnap[id] ?? 0));
      const increases = changedSkills.filter((id) => snapshot[id] > (serverSnap[id] ?? 0));

      const patchSkill = (skillId: string) =>
        patch(
          END_POINTS.UPDATE_SKILL.replace("{sid}", sid!)
            .replace("{cid}", courseId!)
            .replace("{skillId}", skillId),
          { value: snapshot[skillId] },
        );

      // Decreases first to free points, then increases — each batch in parallel
      const decreaseResults = await Promise.allSettled(decreases.map(patchSkill));
      const increaseResults = await Promise.allSettled(increases.map(patchSkill));

      const allIds = [...decreases, ...increases];
      const allResults = [...decreaseResults, ...increaseResults];
      const failedIds = allIds.filter((_, i) => allResults[i].status === "rejected");
      return { failedIds, allIds };
    },
    onMutate: async ({ snapshot, serverSnap }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SkillsRaw>(queryKey);
      queryClient.setQueryData<SkillsRaw>(queryKey, (old) => {
        if (!old) return old;
        const netDelta = Object.keys(snapshot).reduce(
          (acc, id) => acc + (snapshot[id] ?? 0) - (serverSnap[id] ?? 0),
          0,
        );
        return {
          ...old,
          skills: old.skills.map((s) => ({ ...s, value: snapshot[s.id] ?? s.value })),
          available_points: old.available_points - netDelta,
        };
      });
      return { previous };
    },
    onSuccess: ({ failedIds }, { snapshot, serverSnap }, context) => {
      if (failedIds.length > 0) {
        // Revert only failed skills in cache; keep succeeded at optimistic values
        queryClient.setQueryData<SkillsRaw>(queryKey, (old) => {
          if (!old || !context?.previous) return old;
          // Add back the points that were optimistically spent on failed skills
          const refundedDelta = failedIds.reduce(
            (acc, id) => acc + (snapshot[id] ?? 0) - (serverSnap[id] ?? 0),
            0,
          );
          return {
            ...old,
            available_points: old.available_points + refundedDelta,
            skills: old.skills.map((s) => {
              if (!failedIds.includes(s.id)) return s;
              const prev = context.previous!.skills.find((ps) => ps.id === s.id);
              return prev ? { ...s, value: prev.value } : s;
            }),
          };
        });
        const remaining: Values = {};
        failedIds.forEach((id) => { remaining[id] = snapshot[id]; });
        setPendingValues(remaining);
        hasPendingRef.current = failedIds.length > 0;
        toast.error(`${failedIds.length} skill(s) couldn't be saved. Please try again.`);
      } else {
        setPendingValues({});
        hasPendingRef.current = false;
        // toast.success("Skills saved successfully!");
      }
    },
    onError: (error, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setPendingValues({});
      hasPendingRef.current = false;
      toast.error((error as Error).message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Shift mutation (optimistic) ──────────────────────────────────────────
  const shiftMutation = useMutation<
    void,
    Error,
    ShiftAction[],
    { previous: SkillsRaw | undefined }
  >({
    mutationFn: (actions) =>
      post(
        END_POINTS.SHIFT_POINTS.replace("{sid}", sid!).replace("{cid}", courseId!),
        actions,
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SkillsRaw>(queryKey);
      queryClient.setQueryData<SkillsRaw>(queryKey, (old) =>
        old
          ? {
              ...old,
              skills: old.skills.map((s) => ({
                ...s,
                value: pendingValues[s.id] ?? s.value,
              })),
            }
          : old,
      );
      return { previous };
    },
    onSuccess: () => {
      setPendingValues({});
      hasPendingRef.current = false;
      setShiftActions([]);
      setSelectedFromSkill(null);
      // toast.success("Skill points shifted successfully!");
    },
    onError: (error, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setPendingValues({});
      hasPendingRef.current = false;
      setShiftActions([]);
      setSelectedFromSkill(null);
      toast.error((error as Error).message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const isSubmitting = saveMutation.isPending || shiftMutation.isPending;

  // ── Socket → invalidate / patch cache ───────────────────────────────────
  useEffect(() => {
    if (!sid || !courseId) return;

    socket.emit("join-room", { classId: [courseId], studentId: sid });

    const handleSkillsStatusUpdated = (response: {
      success: boolean;
      message?: string;
      data: {
        studentId?: string;
        skill_unlocked?: boolean;
      };
    }) => {
      if (
        response.success &&
        (response.data.studentId === sid || !response.data.studentId)
      ) {
        toast.info(response.message);
        const skillUnlocked = response.data.skill_unlocked;
        // Patch cache directly — no refetch needed for a lock toggle
        queryClient.setQueryData<SkillsRaw>(queryKey, (old) =>
          old ? { ...old, skill_unlocked: skillUnlocked } : old,
        );
        const isLocked = skillUnlocked === false;
        window.dispatchEvent(new CustomEvent(isLocked ? "skills-locked" : "skills-unlocked"));
      }
    };

    const handleSkillUpdated = (response: { studentId?: string }) => {
      if (
        response.studentId === sid &&
        queryClient.isMutating() === 0 &&
        !hasPendingRef.current
      ) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    const handleAssignedCeo = (response: {
      success: boolean;
      data?: { result?: { archetype?: { title?: string } } };
    }) => {
      const title = response?.data?.result?.archetype?.title ?? "";
      window.dispatchEvent(new CustomEvent("ceo-reassigned", { detail: { title } }));
    };

    const handlePerkActivated = (response: {
      success: boolean;
      data?: {
        studentId?: string;
        effects?: {
          shiftingEnabled?: boolean;
          shiftingPoints?: number;
          temporaryScenarioEffect?: boolean;
          affectedStudentIds?: string[];
          available_points?: number;
        };
      };
    }) => {
      if (!response.success) return;
      const effects = response.data?.effects;

      // Only react to shifting perks that belong to this student
      if (effects?.shiftingEnabled && response.data?.studentId === sid) {
        queryClient.setQueryData<SkillsRaw>(queryKey, (old) =>
          old
            ? { ...old, is_shifting: true, shifting_points: effects.shiftingPoints ?? 0, skill_unlocked: true }
            : old,
        );
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      // Temporary scenario effects (Afterburner, Extortion)
      if (
        (effects?.temporaryScenarioEffect || effects?.affectedStudentIds?.includes(sid)) &&
        queryClient.isMutating() === 0 &&
        !hasPendingRef.current
      ) {
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      // Other perks that affect available points (e.g. Corporate Empire, Spotlight, Masterpiece, Prophecy)
      if (
        effects?.available_points !== undefined &&
        queryClient.isMutating() === 0 &&
        !hasPendingRef.current
      ) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    const handleScenarioTemporaryEffectsEnded = () => {
      if (queryClient.isMutating() === 0 && !hasPendingRef.current) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    socket.on("skills-status-updated", handleSkillsStatusUpdated);
    socket.on("skill-updated", handleSkillUpdated);
    socket.on("assigned-ceo", handleAssignedCeo);
    socket.on("perk-activated", handlePerkActivated);
    socket.on("scenario-temporary-effects-ended", handleScenarioTemporaryEffectsEnded);

    return () => {
      socket.off("skills-status-updated", handleSkillsStatusUpdated);
      socket.off("skill-updated", handleSkillUpdated);
      socket.off("assigned-ceo", handleAssignedCeo);
      socket.off("perk-activated", handlePerkActivated);
      socket.off("scenario-temporary-effects-ended", handleScenarioTemporaryEffectsEnded);
      // Do not disconnect — socket is shared across the app
    };
  }, [sid, courseId, socket, queryClient, queryKey]);

  // ── Edit handlers (local state only) ────────────────────────────────────
  const handleIncreaseSkill = (skillId: string) => {
    if (isSkillsLocked || isSubmitting) return;
    const currentValue = values[skillId] ?? 0;
    if (displayAvailable <= 0 || currentValue >= 8) return;
    setPendingValues((prev) => {
      hasPendingRef.current = true;
      return { ...prev, [skillId]: currentValue + 1 };
    });
  };

  const handleDecreaseSkill = (skillId: string) => {
    if (isSkillsLocked || isSubmitting) return;
    const currentValue = values[skillId] ?? 0;
    if (currentValue <= 0) return;
    const newValue = currentValue - 1;
    setPendingValues((prev) => {
      const next = { ...prev };
      if (newValue === (serverValues[skillId] ?? 0)) {
        delete next[skillId];
      } else {
        next[skillId] = newValue;
      }
      hasPendingRef.current = Object.keys(next).length > 0;
      return next;
    });
  };

  const handleSubmitAll = () => {
    if (!hasUnsavedChanges) return;
    saveMutation.mutate({ snapshot: { ...values }, serverSnap: { ...serverValues } });
  };

  // ── Shift handlers ───────────────────────────────────────────────────────
  const handleSelectFromSkill = (skillId: string) => {
    if (!isShifting || shiftActions.length >= shiftingPoints) return;
    if ((values[skillId] ?? 0) <= 0) {
      toast.error("That skill is already at 0 — nothing to shift from.");
      return;
    }
    setSelectedFromSkill(skillId);
    toast.info("Now select a skill to shift the point TO");
  };

  const handleSelectToSkill = (skillId: string) => {
    if (!selectedFromSkill || selectedFromSkill === skillId) {
      toast.error("You can't shift to the same skill.");
      return;
    }
    if ((values[skillId] ?? 0) >= 8) {
      toast.error("That skill is already at the maximum level (8).");
      return;
    }

    const fromSkill = selectedFromSkill;
    setShiftActions((prev) => [...prev, { fromSkill, toSkill: skillId }]);
    setPendingValues((prev) => {
      const next = { ...prev };
      const fromNew = (prev[fromSkill] ?? serverValues[fromSkill] ?? 0) - 1;
      const toNew = (prev[skillId] ?? serverValues[skillId] ?? 0) + 1;
      if (fromNew === (serverValues[fromSkill] ?? 0)) delete next[fromSkill];
      else next[fromSkill] = fromNew;
      if (toNew === (serverValues[skillId] ?? 0)) delete next[skillId];
      else next[skillId] = toNew;
      hasPendingRef.current = Object.keys(next).length > 0;
      return next;
    });
    setSelectedFromSkill(null);

    const remainingShifts = shiftingPoints - shiftActions.length - 1;
    if (remainingShifts > 0) {
      toast.success(`Shift recorded! ${remainingShifts} shift(s) remaining`);
    } else {
      toast.success("All shifts recorded! Click 'Confirm Shifts' to apply");
    }
  };

  const handleUndoLastShift = () => {
    if (shiftActions.length === 0) return;
    const lastAction = shiftActions[shiftActions.length - 1];
    setShiftActions((prev) => prev.slice(0, -1));
    setPendingValues((prev) => {
      const next = { ...prev };
      const fromNew = (prev[lastAction.fromSkill] ?? serverValues[lastAction.fromSkill] ?? 0) + 1;
      const toNew = (prev[lastAction.toSkill] ?? serverValues[lastAction.toSkill] ?? 0) - 1;
      if (fromNew === (serverValues[lastAction.fromSkill] ?? 0)) delete next[lastAction.fromSkill];
      else next[lastAction.fromSkill] = fromNew;
      if (toNew === (serverValues[lastAction.toSkill] ?? 0)) delete next[lastAction.toSkill];
      else next[lastAction.toSkill] = toNew;
      hasPendingRef.current = Object.keys(next).length > 0;
      return next;
    });
    setSelectedFromSkill(null);
    toast.info("Last shift undone");
  };

  const handleSubmitShifts = () => {
    if (!sid || !courseId) {
      toast.error("Session info is missing. Please refresh and try again.");
      return;
    }
    if (shiftActions.length === 0) {
      const confirmNoShifts = window.confirm(
        "You haven't made any shifts. Do you want to lock your skills without changes?",
      );
      if (!confirmNoShifts) return;
    }
    if (shiftActions.length > shiftingPoints) {
      toast.error(`Too many shifts! You can only make ${shiftingPoints} shift(s).`);
      return;
    }
    shiftMutation.mutate(shiftActions);
  };

  const handleCancelShifting = () => {
    setPendingValues({});
    hasPendingRef.current = false;
    setShiftActions([]);
    setSelectedFromSkill(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-black via-slate-900 to-teal-900/20">
      {/* Background */}
      <div
        className="absolute inset-0 h-full w-full pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${images.SkillsBg})` }}
      />

      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden xxl:overflow-visible small-scroll">
        {isInitialLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-[#53f8cb]" />

            <p className="text-lg font-medium text-white">
              Loading investment points...
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 px-4 pt-4 text-center md:pt-2 xxl:pt-4">
              <div className="flex w-full justify-center pt-4 sm:pt-10">
                <TextInvest className="h-auto w-[180px] sm:w-[280px] md:w-[320px] lg:w-[358px] 2xl:w-[380px]" />
              </div>

              <p className="mx-auto max-w-[370px] w-full !font-sans text-sm !font-medium !leading-snug !text-white md:text-[20px] 2xl:text-[20px]">
                Invest points in strategic pillars to improve your company's
                performance
              </p>
            </div>
            {isSkillsLocked && !isShifting && (
              <div
                className={cn(
                  "absolute inset-0 z-50 flex items-center justify-center",
                  "bg-black/70 backdrop-blur-sm",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col items-center",
                    "gap-5 px-8 py-7",
                    "bg-gray-900/90",
                    "rounded-xl border-2 border-red-500/60 shadow-xl",
                    "max-w-md",
                  )}
                >
                  <Lock className="h-12 w-12 text-red-500" />

                  <div className="text-center space-y-2 text-white">
                    <h3 className="text-2xl font-bold">Skills Locked</h3>

                    <p className="text-sm text-white/80">
                      Your teacher has locked skill allocation.
                    </p>

                    <p className="text-xs text-white/60">
                      Wait for your teacher to unlock skills.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isShifting && shiftingPoints > 0 && (
              <div className="relative z-40 mx-3 mb-2 sm:mx-4 !font-sans">
                <div className="mt-4 rounded-xl border-2 border-purple-400/60 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 p-3 shadow-lg sm:p-4">
                  {/* Top row */}
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-5">
                    <Shuffle className="mt-0.5 h-5 w-5 flex-shrink-0 animate-pulse text-purple-300 sm:h-6 sm:w-6" />

                    <div className="min-w-0 flex-1">
                      <p className="!text-md !font-sans !font-bold !text-white sm:!text-base">
                        Skill Shifting Mode
                      </p>

                      <p className="!font-sans !mt-0.5 !text-[12px] !leading-snug !text-purple-200 sm:!text-xs">
                        {selectedFromSkill
                          ? "Click a skill to shift TO"
                          : "Select a skill to remove a point, then select a second skill to transfer your point there"}
                      </p>
                    </div>
                    {/* Right side: counter + buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="mr-2 text-center text-purple-200">
                        <p className="text-xl sm:text-2xl font-bold text-purple-300 leading-none">
                          {shiftingPoints - shiftActions.length}
                        </p>
                        <p className="text-[9px] sm:text-xs">Left</p>
                      </div>

                      {shiftActions.length > 0 && (
                        <button
                          onClick={handleUndoLastShift}
                          className="!px-3 !py-1.5 !text-xs !font-medium !text-white !text-center !rounded-lg !bg-yellow-600 !transition-colors !hover:bg-yellow-700"
                        >
                          Undo
                        </button>
                      )}

                      <button
                        onClick={handleCancelShifting}
                        className="!px-3 !py-1.5 !text-xs !font-medium !text-white !text-center !rounded-lg !bg-red-600 !transition-colors !hover:bg-red-700"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Pending shifts */}
                  {shiftActions.length > 0 && (
                    <div className="mt-2 border-t border-purple-400/30 pt-2">
                      <p className="mb-1.5 text-[10px] sm:text-xs text-purple-200">
                        Pending Shifts:
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {shiftActions.map((action, idx) => {
                          const fromLabel =
                            categories.find((c) => c.key === action.fromSkill)?.label || "?";
                          const toLabel =
                            categories.find((c) => c.key === action.toSkill)?.label || "?";

                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-purple-800/50 px-2 py-0.5 text-[10px] sm:text-xs text-white"
                            >
                              {fromLabel}
                              <ArrowRight className="h-3 w-3" />
                              {toLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pentagon Container */}
            <div className="mt-2 flex min-h-[340px] items-center justify-center sm:mt-5 sm:min-h-[450px] xxl:min-h-[500px]">
              <div className="relative h-[400px] w-[340px] origin-center scale-[0.82] sm:h-[420px] sm:w-96 sm:scale-100">
                {/* Background image */}
                <div className="pointer-events-none absolute inset-0 z-10 left-1/2 w-[400px] -translate-x-1/2">
                  <img
                    src={images.SkillsBg2}
                    alt="bg-2"
                    className="h-full w-full"
                  />
                </div>

                {/* Vector and Crown */}
                <div className="relative mt-10 flex justify-center">
                  <Vector />

                  <div className="!pointer-events-none !absolute !inset-0 !z-20 !flex !items-center !justify-center">
                    <CrownBadge
                      total={displayAvailable}
                      className="!h-[155px] min-[550px]:!h-[160px] sm:!h-[180px] md:!h-[190px] md:!w-[190px] !translate-x-1 !translate-y-9 md:!translate-y-6"
                    />
                  </div>
                </div>

                {/* Pillar hexagons */}
                {categories.map(({ key, label, Icon, position }) => {
                  const value = values[key] ?? 0;
                  const hasChanged = value !== (serverValues[key] ?? 0);
                  const isSelectedFrom = selectedFromSkill === key;

                  const canShiftFrom =
                    isShifting &&
                    shiftActions.length < shiftingPoints &&
                    value > 0 &&
                    !selectedFromSkill;

                  const canShiftTo =
                    isShifting &&
                    selectedFromSkill &&
                    selectedFromSkill !== key &&
                    value < 8;

                  return (
                    <div
                      key={key}
                      className="absolute z-20 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2"
                      style={{ top: position.top, left: position.left }}
                    >
                      <div
                        className={cn(
                          "relative h-full w-full cursor-pointer rounded-full transition-all",
                          hasChanged && "ring-2 ring-yellow-400",
                          isSelectedFrom && "animate-pulse ring-4 ring-purple-400",
                          canShiftFrom && "hover:ring-2 hover:ring-purple-300",
                          canShiftTo && "hover:ring-2 hover:ring-green-400",
                        )}
                        onClick={() => {
                          if (isShifting && shiftingPoints > 0) {
                            if (!selectedFromSkill && canShiftFrom) {
                              handleSelectFromSkill(key);
                            } else if (selectedFromSkill && canShiftTo) {
                              handleSelectToSkill(key);
                            }
                          }
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <SkillBadge
                            icon={
                              <Icon className="flex h-[38px] w-[38px] items-center justify-center text-white" />
                            }
                            text={<div>{label}</div>}
                            number={value}
                            className="!h-[140px] !w-[140px] xxl:!h-[150px] xxl:!w-[150px]"
                            starSize={0.9}
                          />
                        </div>

                        {/* Temporary scenario modifier badge */}
                        {(temporaryModifiers[key] ?? 0) !== 0 && (
                          <div
                            className={cn(
                              "absolute -left-2 -top-2 z-30 flex h-7 items-center justify-center gap-1 rounded-full px-2 shadow-lg ring-2 ring-black/40 backdrop-blur-sm transition-transform hover:scale-110",
                              (temporaryModifiers[key] ?? 0) > 0
                                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 ring-emerald-300/40"
                                : "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-rose-500/30 ring-rose-300/40",
                            )}
                            title={`Temporary scenario modifier: ${(temporaryModifiers[key] ?? 0) > 0 ? `+${temporaryModifiers[key]}` : temporaryModifiers[key]} (Effective value: ${effectiveValues[key] ?? value})`}
                          >
                            <span className="text-[11px] font-black tracking-tight">
                              {(temporaryModifiers[key] ?? 0) > 0
                                ? `+${temporaryModifiers[key]}`
                                : temporaryModifiers[key]}
                            </span>
                            <span className="text-[9px] font-medium opacity-85">
                              eff:{effectiveValues[key] ?? value}
                            </span>
                          </div>
                        )}

                        {/* Shift indicator badges */}
                        {isShifting && (
                          <>
                            {(isSelectedFrom || canShiftTo) && (
                              <div
                                className={cn(
                                  "absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full",
                                  isSelectedFrom ? "bg-purple-500" : "bg-green-500",
                                  canShiftTo && "animate-bounce",
                                )}
                              >
                                <span className="text-xs font-bold text-white">
                                  {isSelectedFrom ? "-1" : "+1"}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Control buttons */}
                        {!isShifting && (
                          <div className="absolute -bottom-[8px] left-1/2 flex -translate-x-1/2 items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDecreaseSkill(key);
                              }}
                              disabled={value <= 0 || isSkillsLocked || isSubmitting}
                              className="!flex !h-[24px] !w-[24px] !items-center !justify-center !border !border-[#56FFD0] !bg-gray-800 !text-xs !font-bold !text-[#56FFD0] !transition-all !hover:bg-gray-700 disabled:!cursor-not-allowed !disabled:border-gray-400 disabled:!bg-gray-500 disabled:!text-gray-300"
                            >
                              -
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncreaseSkill(key);
                              }}
                              disabled={
                                displayAvailable <= 0 ||
                                value >= 8 ||
                                isSkillsLocked ||
                                isSubmitting
                              }
                              className="!flex !h-[24px] !w-[24px] !items-center !justify-center !border !border-[#56FFD0] !bg-gray-800 !text-xs !font-bold !text-[#56FFD0] !transition-all !hover:bg-gray-700 disabled:!cursor-not-allowed disabled:!border-gray-400 disabled:!bg-gray-500 disabled:!text-gray-300"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="flex flex-col items-center gap-3 mt-6 sm:mt-12 xl:mt-20 pb-10">
              {isShifting && shiftingPoints > 0 ? (
                <button
                  onClick={handleSubmitShifts}
                  disabled={isSubmitting}
                  className={cn(
                    "!font-sans !flex !items-center !gap-2 !px-5 !py-2 md:!px-8 md:!py-3 text-xs md:!text-[15px] !font-semibold !rounded-xl !border-2 !shadow-lg !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed",
                    shiftActions.length > 0
                      ? "!bg-gradient-to-r !from-purple-600 !to-purple-500 !text-white !border-purple-400 !shadow-purple-500/30 !hover:from-purple-700 !hover:to-purple-600"
                      : "!bg-gray-700/80 !text-gray-200 !border-gray-500 !hover:bg-gray-600/80",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SHIFTING...
                    </>
                  ) : shiftActions.length > 0 ? (
                    <>
                      <Shuffle className="w-4 h-4" />
                      CONFIRM {shiftActions.length} SHIFT
                      {shiftActions.length > 1 ? "S" : ""}
                    </>
                  ) : (
                    `UP TO ${shiftingPoints} SHIFT(S) - CLICK TO LOCK`
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmitAll}
                  disabled={isSkillsLocked || isSubmitting || !hasUnsavedChanges}
                  className={cn(
                    "!flex !items-center !font-sans !px-6 !py-2 md:!py-3 text-xs md:!text-[15px] !font-semibold !border-2 !shadow-lg !rounded-xl !transition-all !duration-300 !disabled:cursor-not-allowed",
                    hasUnsavedChanges
                      ? "!bg-gradient-to-r !from-yellow-500 !to-amber-500 !text-black !border-yellow-400 !shadow-yellow-500/30 hover:!from-yellow-600 hover:!to-amber-600"
                      : "!bg-gradient-to-r !from-black-200 !to-black-200 !text-primary-150/60 !border-primary-150/30 !cursor-default !opacity-70",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    "SAVE CHANGES"
                  )}
                </button>
              )}

              {/* Background */}
              <div className="pointer-events-none mt-4 sm:mt-6 md:mt-8">
                <ContainerBg />
              </div>
            </div>

            <ConfirmSkillModal
              open={isVisible}
              setOpen={handleModalVisibility}
            />
          </>
        )}
      </div>
    </div>
  );
};
