import { X, TriangleAlert } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="relative w-[420px] bg-[#202222] rounded-2xl p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-950/60">
            <TriangleAlert className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-white text-center mb-3">
          {title}
        </h2>
        <p className="text-sm text-gray-400 text-center leading-relaxed mb-8">
          {description}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 !mt-2.5">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-xs bg-[#1e1e1e] font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="text-xs font-bold !rounded-xs  !border-[0.9px] border-red-500 tracking-wider !text-white hover:bg-red-500/10"
          >
            {loading ? "Deleting..." : "Yes, delete it"}
          </Button>
        </div>
      </div>
    </div>
  );
}
