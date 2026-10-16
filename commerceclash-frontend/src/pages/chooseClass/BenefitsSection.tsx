import { Check } from "lucide-react";

const BENEFITS = [
  "Confidence in Meetings & Interviews",
  "Clarity in Presentations & Pitches",
  "Influence in Discussions & Decisions",
  "Connections with Global Professionals",
  "Authority & Respect in English",
];

const BenefitsSection = () => {
  return (
    <div>
      <h2 className="mb-3 text-2xl font-bold  leading-[26px] text-gray-900">
        You'll gain
      </h2>

      <ul role="list" className="flex flex-col gap-2.5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#45F2A7]">
              <Check
                className="h-3 w-3 text-white"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            <span className="text-[16px] leading-5 font-normal text-[#2B2B2B]">
              {benefit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { BenefitsSection };
