import { Check } from "lucide-react";

const AUDIENCE = [
  "Professionals who want confidence at work",
  "Students & career changers preparing for new jobs",
  "Managers who want to lead teams in English",
  "Business owners who need clear, strong English",
];

const AudienceSection = () => {
  return (
    <div>
      <h2 className="mb-3 text-2xl font-bold leading-[26px] text-gray-900">
        Who this is for
      </h2>

      <ul role="list" className="flex flex-col gap-2.5">
        {AUDIENCE.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#45F2A7]">
              <Check
                className="h-3 w-3 text-white"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            <span className="text-[16px] leading-5 font-normal text-[#2B2B2B]">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { AudienceSection };
