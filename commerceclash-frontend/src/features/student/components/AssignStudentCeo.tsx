import { useEffect, useState } from "react";
import { useSocket } from "@/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AssignStudentCeoProps } from "@/components/types";
import { post, END_POINTS } from "@/api";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PerkApprovalData, PerkInfo } from "@/features/game/components/Ceo";
import { useUserContext } from "@/context";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";

interface AssignStudentCeoPropsExtended extends AssignStudentCeoProps {
  perkRequests?: PerkApprovalData;
  onPerkRequest?: () => void;
  onDataRefresh?: () => void;
}
export const AssignStudentCeo = ({
  id,
  studentName,
  initialRole,
  roles = [],
  perkRequests,
  onPerkRequest,
  onDataRefresh,
}: AssignStudentCeoPropsExtended) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [confirmedRole, setConfirmedRole] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [processedPerks, setProcessedPerks] = useState<Set<string>>(new Set());
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(() => Boolean(socket?.connected));
  const [isAssigning, setIsAssigning] = useState(false);

  // Initialize selectedRole with the role ID that matches initialRole name
  useEffect(() => {
    if (initialRole && roles.length > 0) {
      const matchingRole = roles.find((role) => role.label === initialRole);
      if (matchingRole) {
        setSelectedRole(matchingRole.id);
        setConfirmedRole(matchingRole.id);
      }
    }
  }, [initialRole, roles]);

  console.log("Initial Role:", initialRole);

  console.log(roles)

  // Clear processed perks when perkRequests data changes (fresh data from server)
  useEffect(() => {
    setProcessedPerks(new Set());
  }, [perkRequests]);

  const { id: teacherId } = useUserContext();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");
  const courseId =
    location.state?.courseId ||
    (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null);

  useEffect(() => {
    const handlePerkActionConfirmation = (response: {
      success: boolean;
      message: string;
      action: string;
      error?: string;
    }) => {
      // Backend confirmation received
      if (response.success) {
        // Clear processed perks so buttons are re-enabled for any new pending requests
        setProcessedPerks(new Set());
        // Trigger parent to refresh data so UI updates
        onDataRefresh?.();
      } else if (response.error) {
        toast.error("Something went wrong processing this perk. Please try again.");
        // Also clear on error so teacher can retry
        setProcessedPerks(new Set());
      }
    };

    socket.on("perk-action-confirmation", handlePerkActionConfirmation);

    return () => {
      socket.off("perk-action-confirmation", handlePerkActionConfirmation);
    };
  }, [socket, onDataRefresh]);

  // Handle WebSocket connection/disconnection for teacher
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error("Connection lost. Attempting to reconnect...");
    };

    const handleConnectError = (error: Error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      toast.error("Unable to connect. Please check your connection.");
    };

    const handleReconnect = (attemptNumber: number) => {
      toast.info(`Reconnected after ${attemptNumber} attempt(s)`);
      setIsConnected(true);
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      if (attemptNumber === 1) {
        toast.info("Attempting to reconnect...");
      }
    };

    const handleReconnectError = (error: Error) => {
      console.error("Reconnection error:", error);
    };

    const handleReconnectFailed = () => {
      toast.error("Unable to reconnect. Please refresh the page.");
    };

    // Handle general WebSocket errors
    const handleWsError = (data: any) => {
      toast.error(data.message || "Something went wrong. Please try again.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect", handleReconnect);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("reconnect_error", handleReconnectError);
    socket.on("reconnect_failed", handleReconnectFailed);
    socket.on("ws-error", handleWsError);

    // Set initial connection state
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect", handleReconnect);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("reconnect_error", handleReconnectError);
      socket.off("reconnect_failed", handleReconnectFailed);
      socket.off("ws-error", handleWsError);
    };
  }, [socket]);
  const handleAssignCeo = async (
    cid: string,
    sid: string,
    selectedRoleId: string,
  ) => {
    if (isAssigning) return;
    setIsAssigning(true);
    try {
      const payload = {
        ceoId: selectedRoleId,
      };
      await post(
        END_POINTS.ASSIGN_STUDENT_CEO.replace("{cid}", cid).replace(
          "{sid}",
          sid,
        ),
        payload,
      );
      toast.success("CEO assigned successfully");
      onDataRefresh?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirm = (cid: string, sid: string, selectedRoleid: string) => {
    if (!cid || !sid || !selectedRoleid || isAssigning) return;
    handleAssignCeo(cid, sid, selectedRoleid);
    setConfirmedRole(selectedRole);
  };

  const handleRequest = () => {
    setOpen(true);
    setProcessedPerks(new Set()); // Reset processed perks when opening dialog
    onPerkRequest?.();
  };

  const handleApprove = (request: PerkInfo) => {
    if (processedPerks.has(request.id)) return;

    if (!isConnected) {
      toast.error(
        "Cannot approve perk: you're disconnected. Please wait for reconnection.",
      );
      return;
    }

    socket.emit("perk-approve-response", {
      classId: courseId,
      studentId: perkRequests?.id,
      perkId: request.id,
      teacherId: teacherId,
      isApproved: true,
    });
    toast.success(`Approved "${request.title}" for ${perkRequests?.name}`);
    setProcessedPerks((prev) => new Set(prev).add(request.id));
  };
  const handleDecline = (request: PerkInfo) => {
    if (processedPerks.has(request.id)) return;

    if (!isConnected) {
      toast.error(
        "Cannot decline perk: you're disconnected. Please wait for reconnection.",
      );
      return;
    }

    socket.emit("perk-approve-response", {
      classId: courseId,
      studentId: perkRequests?.id,
      perkId: request.id,
      teacherId: teacherId,
      isApproved: false,
    });
    toast.error(`Declined "${request.title}" for ${perkRequests?.name}`);
    setProcessedPerks((prev) => new Set(prev).add(request.id));
  };

  const handleManagePerk = (
    perkId: string,
    action: "lock" | "unlock" | "reset",
  ) => {
    if (!isConnected) {
      toast.error("Cannot manage perk: you're disconnected.");
      return;
    }

    socket.emit("manage-perk", {
      classId: courseId,
      studentId: id,
      perkId,
      action,
      teacherId: teacherId,
    });
  };

  return (
    <>
      <Card className="w-full h-80 !font-sans">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="text-lg">{studentName}</CardTitle>
            <Button
              onClick={handleRequest}
              size="sm"
              className="h-7 text-xs"
              variant="green"
            >
              Requests
            </Button>
          </div>
          <CardDescription className="text-xs">
            {selectedRole
              ? `Selected role: ${
                  roles.find((r) => r.id === selectedRole)?.label
                }`
              : initialRole
                ? `Current role: ${initialRole}`
                : "No role selected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div>
              <label
                htmlFor="role-select"
                className="!text-[12px] !font-medium"
              >
                Role
              </label>
              <Select
                value={selectedRole || ""}
                onValueChange={setSelectedRole}
                disabled={isAssigning}
              >
                <SelectTrigger
                  id="role-select"
                  className="!w-full !h-9 !rounded-md "
                >
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent className="z-[2100]">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole && (
              <div className="p-2 bg-primary/10 rounded-lg mt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">Selected:</span>{" "}
                    <span className="capitalize">
                      {roles.find((r) => r.id === selectedRole)?.label}
                    </span>
                  </p>
                  {confirmedRole !== selectedRole && (
                    <Button
                      onClick={() => handleConfirm(courseId, id, selectedRole)}
                      disabled={isAssigning}
                      size="sm"
                      className="h-7 text-xs"
                      variant="green"
                    >
                      {isAssigning ? "Assigning..." : "Confirm"}
                    </Button>
                  )}
                </div>
                {confirmedRole === selectedRole && (
                  <p className="text-xs text-green-600 mt-1">✓ Confirmed</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Perk Requests - {studentName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[65vh] py-2">
            {perkRequests?.perks
              ?.sort((a, b) => {
                const score = (p: PerkInfo) => {
                  if (p.perk_status === "pending") return 0;
                  if (p.is_used) return 1;
                  if (p.is_unlocked) return 2;
                  return 3;
                };
                return score(a) - score(b);
              })
              .map((request) => (
                <div
                  key={request?.id}
                  className="!group !relative !border-2 !border-border !rounded-xl !p-5"
                >
                  <div className="!flex !items-center !gap-4 !mb-4">
                    <div className="!flex-1 !pt-1">
                      <div className="!flex !items-center !gap-2 !mb-1">
                        <h3 className="!text-xl !font-semibold">
                          {request?.title}
                        </h3>
                        <span
                          className={`!text-xs !px-2 !py-1 !rounded-full !border ${
                            request.perk_status === "pending"
                              ? "!bg-yellow-100 !text-yellow-800 !border-yellow-200"
                              : request.is_used
                                ? "!bg-blue-100 !text-blue-800 !border-blue-200"
                                : request.is_approved
                                  ? "!bg-orange-100 !text-orange-800 !border-orange-200"
                                  : request.is_unlocked
                                    ? "!bg-green-100 !text-green-800 !border-green-200"
                                    : "!bg-gray-100 !text-gray-800 !border-gray-200"
                          }`}
                        >
                          {request.perk_status === "pending"
                            ? "Request"
                            : request.is_used
                              ? "Used"
                              : request.is_approved
                                ? "In Use"
                                : request.is_unlocked
                                  ? "Unlocked"
                                  : "Locked"}
                        </span>
                      </div>
                      <p className="!text-sm !text-muted-foreground">
                        {request.perk_status === "pending"
                          ? `Requested by: ${request?.description}`
                          : request?.description}
                      </p>
                    </div>

                    <div className="!flex !gap-3 !items-center">
                      {request.perk_status === "pending" ? (
                        <>
                          <Button
                            size="lg"
                            onClick={() => handleApprove(request)}
                            disabled={processedPerks.has(request.id)}
                            className="!bg-primary !text-white !hover:bg-primary/90"
                          >
                            {processedPerks.has(request.id)
                              ? "Approved"
                              : "Approve"}
                          </Button>

                          <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => handleDecline(request)}
                            disabled={processedPerks.has(request.id)}
                            className="!bg-red-500 !hover:bg-red-400 !text-white"
                          >
                            {processedPerks.has(request.id)
                              ? "Declined"
                              : "Decline"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="!flex !items-center !gap-2 !mr-2">
                            <label className="!text-sm !font-medium !text-muted-foreground">
                              {request.is_unlocked ? "Unlocked" : "Locked"}
                            </label>

                            <Switch
                              checked={request.is_unlocked}
                              onCheckedChange={(checked) =>
                                handleManagePerk(
                                  request.id,
                                  checked ? "unlock" : "lock",
                                )
                              }
                            />
                          </div>

                          {(request.is_used || request.is_approved) && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleManagePerk(request.id, "reset")
                              }
                              className="!rounded-md"
                              title="Reset Perk"
                            >
                              <RefreshCw className="!h-4 !w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
