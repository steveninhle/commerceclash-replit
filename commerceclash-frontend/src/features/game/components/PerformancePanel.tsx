import { images } from "@/assets";
import { GroupStar } from "@/assets/svgs/GroupStar";
import { RandTwo } from "@/assets/svgs/RandTwo";
import { RandThree } from "@/assets/svgs/RandThree";
import { TopOne } from "@/assets/svgs/TopOne";
import { RandFive } from "@/assets/svgs/RandFive";
import { RandFour } from "@/assets/svgs/RandFour";
import { LinearGradient } from "@/assets/svgs/LineGradient";
import type { LeaderboardStudent } from "../hooks/useLeaderboard";

const CEO_IMAGE_MAP: Record<string, { avatar: string; bg: string }> = {
  the_tycoon: { avatar: images.kingAvatar, bg: images.bgKing },
  the_explorer: { avatar: images.explorerAvatar, bg: images.bgRandTwo },
  the_general: { avatar: images.commander, bg: images.bgRandThree },
  the_baron: { avatar: images.baronAvatar, bg: images.bgBaron },
  the_visionary: { avatar: images.visionaryAvatar, bg: images.visionaryBg },
  the_diplomat: { avatar: images.diplomat1, bg: images.diplomatBg },
};

const normalizeCEO = (ceo?: { title?: string }) =>
  ceo?.title?.trim().toLowerCase().replace(/\s/g, "_");

const getCEOImages = (ceoId?: string) =>
  CEO_IMAGE_MAP[ceoId || ""] ?? { avatar: images.explorerAvatar, bg: images.bgRandTwo };

const renderPercent = (value: number | string) =>
  value === "-" ? "-" : `${value}%`;

interface PerformancePanelProps {
  topStudents: LeaderboardStudent[];
}

export const PerformancePanel = ({ topStudents }: PerformancePanelProps) => {
  const getStudent = (index: number) =>
    topStudents[index] ?? { name: "-", market_share: "-" as unknown as number };

  const top1 = getStudent(0);
  const top2 = getStudent(1);
  const top3 = getStudent(2);

  const top1Images = getCEOImages(normalizeCEO(top1.ceo));
  const top2Images = getCEOImages(normalizeCEO(top2.ceo));
  const top3Images = getCEOImages(normalizeCEO(top3.ceo));

  return (
    <div
      className="relative flex flex-col justify-around h-full w-full bg-cover bg-center overflow-y-auto"
      style={{ backgroundImage: `url(${images.Result})` }}
    >
      {/* HEADER */}
      <div className="pt-[10px] pb-[65px] w-full flex flex-col items-center gap-4">
        <GroupStar total className="max-[450px]:w-[70px]" />
        <p
          className="text-[36px] max-[450px]:text-[26px] !font-sans leading-[26px] text-9xl font-black tracking-tighter uppercase
          bg-gradient-to-b from-[#b8bcc1] via-[#f3f4f6] to-[#71757a]
          bg-clip-text text-transparent
          drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
          style={{ WebkitTextStroke: "1px #4b4d50" }}
        >
          LEADER BOARD
        </p>
      </div>

      <div className="pb-7">
        {/* TOP 1-3 */}
        <div className="font-sans text-xl font-black uppercase tracking-tighter text-[#101316]">
          <div className="flex gap-x-6 justify-center max-[450px]:gap-x-[10px] max-[400px]:scale-[0.94]">
            {/* TOP 2 */}
            <div className="flex-1 relative max-w-[145px] h-[274px] max-[450px]:max-w-[120px] max-[450px]:h-[230px]">
              <div className="relative top-[5px] inset-0 w-full h-full bg-gradient-to-t from-[#A6A6A6] to-transparent max-[450px]:top-[2px]">
                <div className="w-full max-w-[115px] h-full mx-auto max-[450px]:max-w-[95px]">
                  <img src={top2Images.bg} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div className="absolute z-20 -top-[10px] left-1/2 -translate-x-1/2 max-[450px]:-top-[18px]">
                <RandTwo className="max-[450px]:w-[45px] max-[450px]:h-[45px]" />
              </div>
              <div className="absolute z-10 top-[96px] left-1/2 -translate-x-1/2 min-w-[145px] h-[175px] max-[450px]:min-w-[120px] max-[450px]:h-[145px] max-[450px]:top-[80px]">
                <img src={top2Images.avatar} className="w-full h-full object-contain" alt="" />
              </div>
              <div className="absolute z-50 font-black text-center p-3 w-[166px] left-1/2 -translate-x-1/2 h-[75px] bg-gradient-to-t from-[#5D5754] via-[#B8B8B8] to-[#999999] -bottom-[60px] rounded-tl-[9px] max-[450px]:w-[121px] max-[450px]:h-[65px] max-[450px]:p-2 max-[450px]:-bottom-[50px]">
                <p className="truncate text-xl max-[450px]:text-[11px]">{top2.name}</p>
                <p className="text-xl max-[450px]:text-[11px]">{renderPercent(top2.market_share)}</p>
              </div>
            </div>

            {/* TOP 1 */}
            <div className="flex-1 relative max-w-[145px] max-[450px]:max-w-[120px]">
              <div className="relative bottom-[37px] inset-x-0 h-full bg-gradient-to-t from-[#DEC462] to-transparent max-[450px]:bottom-[25px]">
                <div className="w-full max-w-[115px] h-full mx-auto max-[450px]:max-w-[95px]">
                  <img src={top1Images.bg} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div className="absolute z-10 -top-[52px] left-1/2 -translate-x-1/2 max-[450px]:-top-[49px]">
                <TopOne className="max-[450px]:w-[50px] max-[450px]:h-[50px]" />
              </div>
              <div className="absolute z-40 top-[46px] left-1/2 -translate-x-1/2 min-w-[145px] h-[233px] min-h-[233px] max-[450px]:min-w-[120px] max-[450px]:h-[195px] max-[450px]:top-[35px]">
                <img src={top1Images.avatar} className="w-full h-full object-contain" alt="" />
              </div>
              <div className="absolute z-50 font-black text-center p-3 w-full min-w-[172px] left-1/2 -translate-x-1/2 h-[97px] bg-gradient-to-t from-[#CA8934] via-[#F0CA81] to-[#BC7747] -bottom-[60px] rounded-tl-[9px] rounded-tr-[9px] max-[450px]:min-w-[140px] max-[450px]:h-[80px] max-[450px]:p-2 max-[450px]:-bottom-[50px]">
                <p className="truncate max-[450px]:text-[12px]">{top1.name}</p>
                <p className="max-[450px]:text-[12px]">{renderPercent(top1.market_share)}</p>
              </div>
            </div>

            {/* TOP 3 */}
            <div className="flex-1 relative max-w-[145px] max-[450px]:max-w-[120px] max-[450px]:pr-0">
              <div className="relative top-8 inset-x-0 h-full bg-gradient-to-t from-[#833700] to-transparent max-[450px]:top-4">
                <div className="w-full max-w-[115px] h-full mx-auto max-[450px]:max-w-[95px]">
                  <img src={top3Images.bg} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div className="absolute z-20 top-4 left-1/2 -translate-x-1/2 max-[450px]:top-[-5px]">
                <RandThree className="max-[450px]:w-[45px] max-[450px]:h-[45px]" />
              </div>
              <div className="absolute z-10 top-[115px] left-1/2 -translate-x-1/2 min-w-[145px] h-[175px] max-[450px]:min-w-[120px] max-[450px]:h-[145px] max-[450px]:top-[95px]">
                <img src={top3Images.avatar} className="w-full h-full object-contain" alt="" />
              </div>
              <div className="absolute z-50 font-black text-center p-3 w-[166px] left-1/2 -translate-x-1/2 h-[75px] bg-gradient-to-t from-[#905653] via-[#D77E4D] to-[#91492F] -bottom-[60px] rounded-tr-[9px] max-[450px]:w-[121px] max-[450px]:h-[65px] max-[450px]:p-2 max-[450px]:-bottom-[50px]">
                <p className="truncate max-[450px]:text-[11px]">{top3.name}</p>
                <p className="max-[450px]:text-[11px]">{renderPercent(top3.market_share)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TOP 4-5 */}
        <div className="relative z-10 mt-[44px] flex justify-center py-3 font-sans max-[400px]:mt-[22px] max-[430px]:mt-[31px] max-[450px]:mt-[26px] max-[450px]:px-2 max-[400px]:scale-[0.973] max-[430px]:scale-[0.962] max-[450px]:scale-[0.9]">
          <div className="flex flex-col bg-gradient-to-t from-[#177F67] to-[#55FBCD] divide-y divide-black/40 rounded-bl-lg rounded-br-lg overflow-hidden min-w-[504px] max-w-[504px] w-full shadow-xl max-[450px]:min-w-[0] max-[450px]:w-full">
            {[3, 4].map((index) => {
              const student = getStudent(index);
              const img = getCEOImages(normalizeCEO(student.ceo));
              return (
                <div
                  key={index}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-[26px] py-1 hover:bg-[#28c1ad] max-[450px]:gap-2 max-[450px]:px-4 max-[450px]:py-2"
                >
                  <div
                    className="relative h-20 w-20 overflow-hidden rounded-2xl max-[450px]:h-14 max-[450px]:w-14"
                    style={{ backgroundImage: `url(${img.bg || images.bgRandTwo})`, objectFit: "cover" }}
                  >
                    <img
                      src={img.avatar || images.explorerAvatar}
                      alt={student.name}
                      className="h-full w-full object-contain absolute top-0 left-0"
                    />
                  </div>
                  <div className="ml-2 overflow-hidden max-[450px]:ml-0">
                    <p className="truncate text-xl font-black uppercase tracking-tighter max-[450px]:text-sm">
                      {student.name}
                    </p>
                  </div>
                  <div className="px-2 max-[450px]:px-1">
                    <span className="text-xl font-black max-[450px]:text-sm">
                      {renderPercent(student.market_share)}
                    </span>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center max-[450px]:h-16 max-[450px]:w-16">
                    {index === 3 ? (
                      <RandFour className="max-[450px]:w-[45px] max-[450px]:h-[45px]" />
                    ) : (
                      <RandFive className="max-[450px]:w-[45px] max-[450px]:h-[45px]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute z-1 w-full bottom-[30px] flex justify-center">
        <LinearGradient />
      </div>
    </div>
  );
};
