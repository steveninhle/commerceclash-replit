import { CardStripe } from "@/components/ui/cart-stripe";
import { AudienceSection } from "./AudienceSection";
import { BenefitsSection } from "./BenefitsSection";

const Sidebar = () => {
  return (
    <CardStripe as="aside" className="flex flex-col">
      <BenefitsSection />
      <hr className="my-5 border-[#E3E3E3]" />
      <AudienceSection />
    </CardStripe>
  );
};

export { Sidebar };
