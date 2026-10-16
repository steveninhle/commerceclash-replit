import { Ceo } from "@/assets";
import type { ComponentType } from "react";

type BtnTabProps = {
  name: string;
  icon?: ComponentType<{ className: string }>;
};

const BtnTab = ({ name = "", icon: Icon = Ceo }: BtnTabProps) => {
  return (
    <>
      <div className="shape-outer bevel h-full w-full transition-all duration-300 bg-[#1a5b4d] group-data-[state=active]:!bg-[linear-gradient(90deg,_#1b7562_0%,_#2b9e84_50%,_#176655_100%)] group-data-[state=active]:shadow-[0_0_12px_rgba(43,158,132,0.45)] cursor-pointer">
        <div className="shape-inner bevel flex items-center justify-center font-black text-white h-[calc(100%-4px)] w-[calc(100%-4px)] transition-all duration-300 bg-[#10433A] group-data-[state=active]:!bg-[linear-gradient(90deg,_rgba(41,171,146,0.72)_0%,_rgba(86,255,208,0.85)_50%,_rgba(37,163,140,0.72)_100%)]">
          <Icon className="!w-8 !h-8 max-[450px]:w-7 max-[450px]:h-7 opacity-85 transition-all duration-300 group-data-[state=active]:opacity-100 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(86,255,208,0.9)]" />

          <div
            className="
              hidden min-[550px]:block
              trajan-uppercase text-xl text-white/80 
              transition-all duration-300 
              group-data-[state=active]:text-black
              ml-2
            "
          >
            {name}
          </div>
        </div>
      </div>

      <div className="w-[17px] h-[3px] bg-[#2b9e84] rotate-[42deg] max-[450px]:rotate-[50deg] max-[500px]:rotate-[46deg] max-[550px]:rotate-[44deg] max-[660px]:rotate-[40deg] max-[768px]:rotate-[38deg] absolute top-[3px] max-[450px]:top-[2px] -right-[5px] transition-colors duration-300 group-data-[state=active]:bg-[#1a5b4d]"></div>

      <div className="w-[17px] h-[3px] bg-[#2b9e84] rotate-[137deg] max-[450px]:rotate-[131deg] max-[500px]:rotate-[136deg] max-[550px]:rotate-[137deg] max-[660px]:rotate-[140deg] max-[768px]:rotate-[142deg]  absolute bottom-[3px] max-[450px]:bottom-[2px] -right-[5px] transition-colors duration-300 group-data-[state=active]:bg-[#1a5b4d]"></div>

      <div className="w-[17px] h-[3px] bg-[#2b9e84] rotate-[222deg] max-[450px]:rotate-[229deg] max-[500px]:rotate-[46deg] max-[550px]:rotate-[224deg] max-[660px]:rotate-[219deg] max-[768px]:rotate-[217deg] absolute bottom-[3px] max-[450px]:bottom-[2px] -left-[5px] transition-colors duration-300 group-data-[state=active]:bg-[#1a5b4d]"></div>

      <div className="w-[17px] h-[3px] bg-[#2b9e84] -rotate-[42deg] max-[450px]:-rotate-[50deg] max-[500px]:-rotate-[42deg] max-[550px]:-rotate-[40deg] max-[768px]:-rotate-[38deg] absolute top-[3px] max-[450px]:top-[2px] -left-[5px] transition-colors duration-300 group-data-[state=active]:bg-[#1a5b4d]"></div>
    </>
  );
};

export default BtnTab;
