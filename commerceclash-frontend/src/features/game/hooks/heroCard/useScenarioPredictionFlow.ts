import { usePerkSubmission } from "./usePerkSubmission";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { ScenarioType } from "./types";

interface UseScenarioPredictionFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  onRefresh?: () => void;
}

export const useScenarioPredictionFlow = ({
  socket,
  courseId,
  studentId,
  onRefresh,
}: UseScenarioPredictionFlowOptions) => {
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const { isSubmitting: isSubmittingPrediction, begin, finish } = usePerkSubmission(socket, onRefresh);

  useEffect(() => {
    // 1. Prediction result listener (Prophecy)
    const handlePredictionResult = (response: {
      success: boolean;
      message?: string;
      data?: {
        correct: boolean;
        predictedType: string;
        actualType: string;
      };
    }) => {
      finish();

      if (response.success && response.data) {
        setPredictionModalOpen(false);
        if (response.data.correct) {
          toast.success(
            response.message || "The server confirmed a correct prediction.",
          );
        } else {
          toast.info(
            `Prophecy missed: Predicted "${response.data.predictedType}", actual was "${response.data.actualType}".`,
          );
        }
        onRefresh?.();
      } else {
        onRefresh?.();
        toast.error(
          response.message || "Failed to process prophecy prediction.",
        );
      }
    };

    // 2. Invest phase reveal result (Crystal Ball & Insider Trading)
    const handleInvestPhaseRevealResult = (response: {
      success: boolean;
      message?: string;
      data?: {
        scenarioType: string;
        perkTitle?: string;
      };
    }) => {
      if (response.success && response.data) {
        toast.info(
          `🔮 ${response.data.perkTitle ?? "Foresight"}: Next scenario will be "${response.data.scenarioType}".`,
          { duration: 6000 },
        );
      }
    };

    const interrupted = () => { finish(); setPredictionModalOpen(false); };
    socket.on("disconnect", interrupted);
    socket.on("scenario-prediction-result", handlePredictionResult);
    socket.on("invest-phase-reveal-result", handleInvestPhaseRevealResult);

    return () => {
      socket.off("disconnect", interrupted);
      socket.off("scenario-prediction-result", handlePredictionResult);
      socket.off("invest-phase-reveal-result", handleInvestPhaseRevealResult);
    };
  }, [socket, onRefresh, finish]);

  const handleScenarioPrediction = useCallback(
    (predictedType: ScenarioType) => {
      if (!courseId || !["market", "crisis", "opportunity", "challenge"].includes(predictedType)) return;
      if (!socket.connected) {
        toast.error("Connect to the class before submitting a prediction.");
        return;
      }

      if (!begin()) return;
      toast.info("Submitting scenario prophecy...");

      socket.emit("scenario-prediction-submitted", {
        classId: courseId,
        studentId,
        predictedType,
      });
    },
    [socket, courseId, studentId, begin],
  );

  return {
    predictionModalOpen,
    setPredictionModalOpen,
    isSubmittingPrediction,
    handleScenarioPrediction,
  };
};
