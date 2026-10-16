import { CohortPlayersPanel } from "./CohortPlayersPanel";
import { CeoCarousel } from "./CeoCarousel";
import { getDefaultArchetype, useCeoPicker } from "./hooks/useCeoPicker";
import LeadershipStrengths from "./LeadershipStrengths";
import { studentCeoAssets } from "@/utils/helper";
import { LoaderCircle } from "lucide-react";
import {
  ceoBackgroundVideoFor,
  ceoConfirmButtonFor,
  ceoFigureFor,
  ceoTitleImageFor,
  heroDescriptionFor,
} from "./heroArt";

const ChooseCeoPage = () => {
  const {
    studentId,
    hasCohort,
    archetypes,
    isLoading,
    cohortPlayers,
    cohortCapacity,
    isLoadingCohortPlayers,
    isCohortPlayersError,
    selectedId,
    setSelectedId,
    assignedCeoId,
    confirmCeo,
    isConfirming,
  } = useCeoPicker();
  const selectedCeo =
    archetypes.find((archetype) => archetype.id === selectedId) ??
    getDefaultArchetype(archetypes);
  const backgroundVideo = ceoBackgroundVideoFor(selectedCeo?.title);
  const selectedCeoColor = studentCeoAssets(selectedCeo?.title).color;
  const selectedCeoDescription = selectedCeo
    ? heroDescriptionFor(selectedCeo.title)
    : undefined;
  const confirmButtonLabel = !selectedCeo
    ? "Select a CEO"
    : selectedCeo.id === assignedCeoId
      ? "Current CEO"
      : isConfirming
        ? "Confirming..."
        : "Confirm CEO";

  return (
    <div className="relative h-full min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#05060c] xl:flex xl:h-dvh xl:min-h-0 xl:flex-col xl:items-center xl:justify-center xl:gap-4 xl:overflow-hidden">
      <video
        key={selectedCeo?.id ?? "baron"}
        className="pointer-events-none absolute inset-0 h-auto w-full object-cover max-h-3/4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        src={backgroundVideo}
      />
      <div className="absolute top-10 left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-3 xl:relative xl:top-auto xl:left-auto xl:shrink-0 xl:translate-x-0">
        <div className="h-1 w-28 flex-1 bg-gradient-to-r from-transparent via-[#997C3B] to-[#FFCF62] shadow-[3px_0px_15.3px_23px_#00000024]" />
        <div className="relative mx-2 flex h-3 w-3 items-center justify-center">
          <div className="absolute h-[10px] w-[10px] rotate-45 rounded-[1px] bg-[#FFCF62] shadow-[0_0_6px_#FFCF62] " />
        </div>
        <div className="font-gothic-condensed text-metal-gradient text-6xl font-normal xl:text-5xl">
          CHOOSE YOUR CEO
        </div>
        <div className="relative mx-2 flex h-3 w-3 items-center justify-center">
          <div className="absolute h-[10px] w-[10px] rotate-45 rounded-[1px] bg-[#FFCF62] shadow-[0_0_6px_#FFCF62] " />
        </div>
        <div className="h-1 w-28 flex-1 bg-gradient-to-r from-[#FFCF62] via-[#997C3B] to-transparentshadow-[3px_0px_15.3px_23px_#00000024]" />
      </div>
      <div className="relative z-10 flex w-full flex-col items-center gap-8 px-4 pt-24 pb-[320px] text-center animate-in fade-in duration-500 xl:h-[min(60dvh,650px)] xl:flex-none xl:gap-0 xl:overflow-hidden xl:pt-0 xl:pb-0">
        <div className="flex w-full flex-col items-center gap-4 xl:h-full xl:min-h-0 xl:flex-row xl:items-stretch xl:justify-between">
          <CohortPlayersPanel
            players={cohortPlayers}
            capacity={cohortCapacity}
            currentStudentId={studentId}
            hasCohort={hasCohort}
            isLoading={isLoadingCohortPlayers}
            hasError={isCohortPlayersError}
          />
          <div className="relative flex min-h-[500px] w-full max-w-lg flex-col items-center justify-end overflow-hidden xl:h-full xl:min-h-0 xl:flex-1 xl:max-w-none">
            <img
              src={ceoFigureFor(selectedCeo?.title)}
              alt={selectedCeo?.title ?? "CEO"}
              className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-full max-w-full object-contain object-bottom"
            />
            <div className="relative z-10 flex w-full flex-col items-center pb-2 xl:grid xl:grid-rows-[80px_48px_120px_64px] xl:justify-items-center 2xl:grid-rows-[112px_48px_120px_80px]">
              <img
                src={ceoTitleImageFor(selectedCeo?.title)}
                alt={selectedCeo?.title ?? "CEO"}
                className="h-auto max-h-16 w-full max-w-[380px] object-contain xl:h-[68px] xl:max-h-[68px] xl:self-center 2xl:h-[92px] 2xl:max-h-[92px] 2xl:max-w-[470px]"
              />
              <div
                className="text-2xl font-black uppercase xl:flex xl:h-full xl:items-center xl:text-lg 2xl:text-2xl"
                style={{ color: selectedCeoColor }}
              >
                {selectedCeo?.sub_title ?? ""}
              </div>
              <div className="text-lg text-white max-w-[350px] font-normal xl:flex xl:h-full xl:items-center xl:justify-center xl:text-sm 2xl:max-w-[500px] 2xl:text-lg">
                {selectedCeoDescription ?? ""}
              </div>
              <button
                type="button"
                onClick={confirmCeo}
                disabled={!selectedCeo || isConfirming || selectedCeo.id === assignedCeoId}
                aria-label={confirmButtonLabel}
                aria-busy={isConfirming}
                className="relative mt-5 block w-full max-w-[500px] transition-[transform,filter] duration-200 ease-out hover:scale-[1.03] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.45)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:drop-shadow-none xl:mt-0 xl:h-full 2xl:max-w-[600px]"
              >
                <img
                  src={ceoConfirmButtonFor(selectedCeo?.title)}
                  alt=""
                  className="block h-auto w-full xl:h-full xl:object-contain"
                />
                {isConfirming && (
                  <LoaderCircle
                    className="absolute top-1/2 left-[70%] h-5 w-5 -translate-y-1/2 animate-spin text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>
          <LeadershipStrengths hero={selectedCeo} isLoading={isLoading} />
        </div>
      </div>
      <div className="fixed bottom-2 left-2 right-2 z-10 flex justify-center xl:relative xl:inset-auto xl:w-full xl:flex-none">
        <CeoCarousel
          archetypes={archetypes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
};

export { ChooseCeoPage };
