import { useUserContext, useSocket } from "@/context";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEspionage } from "../hooks/useEspionage";
import { CEO } from "./Ceo";
import { Performance } from "./Performance";
import { RivalSkillTreesInline } from "./RivalSkillTreesInline";
import { Skill } from "./Skills";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export const Gamification = ({
  courseId: courseIdProp,
}: { courseId?: string | null } = {}) => {
  const [activeTab, setActiveTab] = useState("ceo");
  const [viewingRivals, setViewingRivals] = useState(false);

  const location = useLocation();
  const { id: userId, role } = useUserContext();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const courseId = useMemo(() => {
    if (courseIdProp) return courseIdProp;
    if (location.state?.courseId) return location.state.courseId as string;
    const searchParams = new URLSearchParams(location.search);
    const meetingId = searchParams.get("meetingId");
    return (
      searchParams.get("courseId") ||
      searchParams.get("classId") ||
      (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null) ||
      localStorage.getItem("currentCourseId") ||
      localStorage.getItem("activeCourseId") ||
      null
    );
  }, [courseIdProp, location.state?.courseId, location.search]);

  useEffect(() => {
    if (!courseId || !userId) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["assigned-ceo", courseId, userId] });
      void queryClient.invalidateQueries({ queryKey: ["skills", userId, courseId] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard", courseId] });
      void queryClient.invalidateQueries({ queryKey: ["students", courseId] });
    };
    const completed = (response: { success?: boolean; data?: { perk_status?: string } }) => {
      if (response.success && response.data?.perk_status === "used") refresh();
    };
    const scenarioEnded = (response: { success?: boolean }) => {
      if (response.success) refresh();
    };
    socket.on("perk-activated", completed);
    // Target completion broadcasts this only after the attacking effect commits.
    socket.on("skill-updated", refresh);
    socket.on("scenario-temporary-effects-ended", scenarioEnded);
    socket.on("connect", refresh);
    return () => {
      socket.off("perk-activated", completed);
      socket.off("skill-updated", refresh);
      socket.off("scenario-temporary-effects-ended", scenarioEnded);
      socket.off("connect", refresh);
    };
  }, [socket, queryClient, courseId, userId]);

  const { isExplorer, isActive, isSkillsLocked, rivalSkillTrees } =
    useEspionage({
      courseId,
      userId,
      role,
    });

  // Join the socket room on mount so leaderboard updates are received
  useEffect(() => {
    if (!courseId || !userId) return;
    const payload =
      role === "student"
        ? { classId: [courseId], studentId: userId }
        : { classId: [courseId], teacherId: userId };
    const joinRoom = () => socket.emit("join-room", payload);
    joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
    };
  }, [socket, courseId, userId, role]);

  // Auto-switch to Skills tab when a shifting perk (Rallying Cry / Strategic Rebirth) is activated
  // Only for the student who owns the perk — not all students in the class
  useEffect(() => {
    if (!socket || role !== "student") return;
    const handlePerkActivated = (response: { success?: boolean; data?: { studentId?: string; effects?: { shiftingEnabled?: boolean } } }) => {
      if (
        response?.success &&
        response?.data?.effects?.shiftingEnabled &&
        response?.data?.studentId === userId
      ) {
        setActiveTab("skill");
      }
    };
    socket.on("perk-activated", handlePerkActivated);
    return () => {
      socket.off("perk-activated", handlePerkActivated);
    };
  }, [socket, role, userId]);

  // Espionage panel is available when explorer has active espionage and skills aren't locked
  const espionageAvailable = isExplorer && isActive && !isSkillsLocked;

  // React to espionage becoming available or unavailable
  useEffect(() => {
    if (espionageAvailable) {
      setActiveTab("skill");
      setViewingRivals(true);
    } else {
      setViewingRivals(false);
    }
  }, [espionageAvailable]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Auto-show rivals when switching to skill tab if espionage is active
    if (tab === "skill" && espionageAvailable) setViewingRivals(true);
    // Re-join room on tab switch to ensure socket room membership
    if (courseId && userId) {
      const payload =
        role === "student"
          ? { classId: [courseId], studentId: userId }
          : { classId: [courseId], teacherId: userId };
      socket.emit("join-room", payload);
    }
  };

  if (role === "teacher") {
    return (
      <Card className="!w-full !h-full !flex !flex-col !bg-black-50 !p-0 !m-0 !border-0 md:!border-l-2 !border-l-[#3a3a3a] !rounded-none !gap-0 !shadow-none">
        <CardContent className="!flex-1 !flex !flex-col !overflow-hidden !p-0 !gap-0">
          <Performance courseId={courseId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="!w-full !h-full !flex !flex-col !bg-black-50 !p-0 !m-0 !border-0 md:!border-l-2 !border-l-[#3a3a3a] !rounded-none !gap-0 !shadow-none">
      <CardContent className="!flex-1 !flex !flex-col !overflow-hidden !p-0 !gap-0">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="!w-full !h-full !flex !flex-col"
        >
          {/* <TabsList className="!grid !grid-cols-3 !w-full !flex-shrink-0 !bg-black-50 !gap-1 !rounded-none !px-2 !py-1 !h-[55px]">
            <TabsTrigger
              value="ceo"
              className="!relative group !w-full !p-0 !m-0 !overflow-hidden !h-full !bg-transparent !border-none !rounded-none hover:!scale-[1.01]"
            >
              <BtnTab name="CEO" />
            </TabsTrigger>
            <TabsTrigger
              value="skill"
              className="!relative group !w-full !p-0 !m-0 !overflow-hidden !h-full !bg-transparent !border-none !rounded-none hover:!scale-[1.01]"
            >
              <BtnTab name="Skills" icon={SKillIcon} />
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="!relative group !w-full !p-0 !m-0 !overflow-hidden !h-full !bg-transparent !border-none !rounded-none hover:!scale-[1.01]"
            >
              <BtnTab name="Leaderboard" icon={Result} />
            </TabsTrigger>
          </TabsList> */}

          <TabsContent
            value="ceo"
            forceMount
            className="flex-1 overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=inactive]:hidden"
          >
            <CEO courseId={courseId} />
          </TabsContent>

          <TabsContent
            value="skill"
            forceMount
            className="!flex-1 !overflow-auto md:!overflow-hidden !m-0 data-[state=inactive]:hidden"
          >
            {espionageAvailable ? (
              <SkillTabWithEspionage
                rivalSkillTrees={rivalSkillTrees}
                viewingRivals={viewingRivals}
                onToggle={setViewingRivals}
              />
            ) : (
              <Skill />
            )}
          </TabsContent>

          <TabsContent
            value="performance"
            className="!flex-1 !overflow-y-auto !m-0 !data-[state=active]:!flex !data-[state=active]:!flex-col"
          >
            <Performance courseId={courseId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: skill tab split view when espionage is active
// ---------------------------------------------------------------------------
interface SkillTabWithEspionageProps {
  rivalSkillTrees: {
    studentId: string;
    name: string;
    skills: { attributeName: string; value: number }[];
  }[];
  viewingRivals: boolean;
  onToggle: (v: boolean) => void;
}

function SkillTabWithEspionage({
  rivalSkillTrees,
  viewingRivals,
  onToggle,
}: SkillTabWithEspionageProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-shrink-0 border-b border-[#3a3a3a]">
        <button
          onClick={() => onToggle(false)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            !viewingRivals
              ? "text-white border-b-2 border-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          My Skills
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            viewingRivals
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          All Players
        </button>
      </div>
      {viewingRivals ? (
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900">
          <RivalSkillTreesInline skillTrees={rivalSkillTrees} />
        </div>
      ) : (
        <Skill />
      )}
    </div>
  );
}
