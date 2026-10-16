import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react";
import { cn } from "@/lib/utils";
import type { Leader } from "../types";
import { LeaderThumbnail } from "./LeaderThumbnail";
import { NavigationArrow } from "./NavigationArrow";

interface LeaderCarouselProps {
  leaders: Leader[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
}

/**
 * Horizontally-scrollable row of leader cards. Navigable by arrow buttons, arrow/Home/End keys,
 * mouse wheel, and mouse/touch dragging (native touch scrolling already works via `overflow-x-auto`).
 */
export const LeaderCarousel = ({
  leaders,
  selectedId,
  onSelect,
  onNext,
  onPrevious,
}: LeaderCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onPrevious();
    } else if (event.key === "Home") {
      event.preventDefault();
      const first = leaders[0];
      if (first) onSelect(first.id);
    } else if (event.key === "End") {
      event.preventDefault();
      const last = leaders[leaders.length - 1];
      if (last) onSelect(last.id);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.deltaY === 0) return;
    track.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag || drag.pointerId !== event.pointerId) return;
    track.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      role="group"
      aria-label="Choose your CEO"
      onKeyDown={handleKeyDown}
      className="flex items-center gap-2 rounded-2xl border border-amber-200/10 bg-white/[0.02] p-3"
    >
      <NavigationArrow direction="prev" onClick={onPrevious} />

      <div
        ref={trackRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 py-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isDragging ? "cursor-grabbing select-none snap-none scroll-auto" : "cursor-grab",
        )}
      >
        {leaders.map((leader) => (
          <LeaderThumbnail
            key={leader.id}
            leader={leader}
            isSelected={leader.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <NavigationArrow direction="next" onClick={onNext} />
    </div>
  );
};
