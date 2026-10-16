interface StatCardProps {
  label: string;
  value: number;
}

export const StatCard = ({ label, value }: StatCardProps) => (
  <div className="border border-green-700 bg-[#0f1f0f] shadow-[0_0_12px_rgba(34,197,94,0.1)] px-6 py-5">
    <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
      {label}
    </p>
    <p className="text-4xl font-bold text-white">{value.toLocaleString()}</p>
  </div>
);
