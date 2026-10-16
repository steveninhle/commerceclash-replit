import { CenterPanel } from "@/features/student/pages/studentEnrolledCourses/components/CenterPanel";
import { Character } from "@/transformers/types";
import { studentCeoAssets } from "@/utils/helper";

const character: Character = {
  id: "ceo-1",
  title: "The Baron",
  subtitle: "Deal Hunter",
  xp: 8,
  level: 3,
  perks: [],
};

const nextClass = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();

export default function DevCenterPanelPreview() {
  const assets = studentCeoAssets("The Baron");
  return (
    <div className="h-screen w-full flex items-stretch bg-black p-4">
      <CenterPanel
        course={{
          id: "course-1",
          name: "Business 101",
          status: true,
          start_time: nextClass,
          meeting_id: "m1",
          passcode: "1234",
          allocate_points: 10,
        } as any}
        character={character}
        assets={assets}
        nextClassIso={nextClass}
        myRank={2}
        myMarketShare={22}
        isLoading={false}
        ceoLoading={false}
        onJoin={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}
