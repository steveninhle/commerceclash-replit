import { END_POINTS, getCsv } from "@/api";
import { useUserContext } from "@/context";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { PerformancePanel } from "./PerformancePanel";
import { PerformanceSkeleton } from "./PerformanceSkeleton";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "../hooks/useLeaderboard";

export const Performance = ({ courseId: courseIdProp }: { courseId?: string | null }) => {
  const location = useLocation();
  const { role } = useUserContext();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");
  const courseId =
    courseIdProp ??
    location.state?.courseId ??
    (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { topStudents, isLoading } = useLeaderboard(courseId);

  const handleExport = async () => {
    try {
      setIsSubmitting(true);
      const endpoint = END_POINTS.EXPORT_CLASS_DATA.replace("{cid}", courseId);
      const response = await getCsv(endpoint, {
        responseType: "blob",
        headers: { Accept: "text/csv" },
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `class_data_${courseId}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) filename = match[1].replace(/"/g, "");
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="h-full flex flex-col">
      {role === "teacher" && (
        <div className="relative flex items-center justify-between">
          <div className="flex items-center justify-between gap-2 absolute z-10 right-0 top-2 left-0">
            <Button className="!rounded-md !text-white" disabled={isSubmitting} onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <PerformanceSkeleton />
        ) : (
          <PerformancePanel topStudents={topStudents} />
        )}
      </div>
    </section>
  );
};
