"use client";
import { cn } from "@/lib/utils";
import LoadingIcons from "react-loading-icons";
interface Props {
  className?: string;
  stroke?: string;
  isLoading?: boolean;
  size?: number;
}
const LoadingOverlay = ({ className, isLoading = true, size }: Props) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      {isLoading && (
        <LoadingIcons.Oval
          stroke="#22c55e"
          strokeOpacity={1}
          strokeWidth={3}
          style={{
            width: `${(size || 8) * 0.25}rem`,
            height: `${(size || 8) * 0.25}rem`,
          }}
        />
      )}
    </div>
  );
};

export default LoadingOverlay;
