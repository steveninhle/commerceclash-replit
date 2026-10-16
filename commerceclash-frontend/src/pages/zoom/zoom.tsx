import { Gamification } from "@/components";
import { ZoomMtg } from "@zoom/meetingsdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { END_POINTS, patch } from "@/api";
import { useWindowWidth } from "@/hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useUserContext } from "../../context/userContext/userContext";

const Zoom = () => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoadingVisible, setIsLoadingVisible] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { role, user, id: userId } = useUserContext();
  const location = useLocation();
  const meetingId = searchParams.get("meetingId");
  const passcode = searchParams.get("passcode");

  const hasJoined = useRef(false);

  const courseId = (() => {
    const fromState = location.state?.courseId as string | undefined;
    if (fromState && meetingId) {
      localStorage.setItem(`meeting_${meetingId}_courseId`, fromState);
      return fromState;
    }
    const fromStorage = meetingId
      ? localStorage.getItem(`meeting_${meetingId}_courseId`)
      : null;
    if (fromStorage) return fromStorage;
    const fromQuery = searchParams.get("courseId") || searchParams.get("classId");
    if (fromQuery) return fromQuery;
    return (
      localStorage.getItem("currentCourseId") ||
      localStorage.getItem("activeCourseId") ||
      null
    );
  })();

  // Use meeting-specific localStorage key to track activation per meeting
  const meetingActivatedKey = courseId ? `meetingActivated_${courseId}` : null;

  const [, setIsMeetingActivated] = useState<boolean>(() => {
    if (!meetingActivatedKey) return false;
    const saved = localStorage.getItem(meetingActivatedKey);
    return saved === "true";
  });
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const windowWidth = useWindowWidth();

  // Sidebar collapsed state - starts collapsed on mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 768;
  });

  // Sync sidebar state when viewport crosses mobile breakpoint
  useEffect(() => {
    const isMobile = windowWidth < 768;
    setIsSidebarCollapsed(isMobile);
  }, [windowWidth < 768]); // Only trigger when crossing the threshold

  // Toggle sidebar visibility — dispatch resize so Zoom SDK can reflow
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
    // Wait for CSS transition to finish (~350ms), then tell the SDK to resize
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 380);
  }, []);

  // Animate #zmmtg-root width directly via inline style so the SDK's
  // ResizeObserver receives the correct clientWidth on every animation frame
  // and recalculates video tile pixel dimensions in real time.
  useEffect(() => {
    const isMobile = windowWidth < 768;
    // Read the actual CSS variable instead of hardcoding it — #zoom-col's
    // margin-right and #content-col's width are both driven by
    // --zoom-sidebar-width, so this must match whatever that resolves to
    // (including its responsive breakpoint) or the SDK ends up sized for a
    // different width than the column actually shrank to, leaving a gap.
    const sidebarWidthPx =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--zoom-sidebar-width",
        ),
      ) || 0;
    const sidebarOffset = !isSidebarCollapsed && !isMobile ? sidebarWidthPx : 0;
    const targetW = window.innerWidth - sidebarOffset;
    const DURATION = 350; // match CSS sidebar transition

    const zmmtgRoot = document.getElementById("zmmtg-root");
    if (!zmmtgRoot) return;

    // Use current clientWidth as start; fall back to full viewport on first run
    const startW = zmmtgRoot.clientWidth > 0 ? zmmtgRoot.clientWidth : targetW;

    // Nothing to animate
    if (Math.abs(startW - targetW) < 1) {
      zmmtgRoot.style.width = `${targetW}px`;
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    // Cubic ease-in-out — same curve as the CSS sidebar transition
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

    const frame = (now: number) => {
      const t = Math.min((now - startTime) / DURATION, 1);
      zmmtgRoot.style.width = `${startW + (targetW - startW) * ease(t)}px`;
      // Notify the SDK on every frame so it recalculates tile sizes live
      window.dispatchEvent(new Event("resize"));
      if (t < 1) rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [isSidebarCollapsed, windowWidth]);
  const authEndpoint = `${baseUrl}${END_POINTS.JOIN_CLASS}`;
  const meetingNumber = String(meetingId);
  const passWord = String(passcode);
  const _role = role === "teacher" ? 1 : 0;

  const userName = user?.name;
  const userEmail = user?.email;

  // Create socket connection for teacher
  const socket = useMemo(() => {
    if (!baseUrl) return null;
    return io(baseUrl.replace(/\/+$/, ""), {
      withCredentials: true,
      transports: ["polling", "websocket"],
      auth: (cb) => {
        try {
          const token = localStorage.getItem("access_token");
          cb({ accessToken: token || undefined });
        } catch {
          cb({});
        }
      },
    });
  }, [baseUrl]);

  const handleActivateMeeting = useCallback(
    async (id: string, storageKey: string) => {
      try {
        setIsMeetingActivated(true);
        localStorage.setItem(storageKey, "true");

        await patch(END_POINTS.UPDATE_CLASS_STATUS.replace("{cid}", id));
        // toast.success("Meeting activated successfully");
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    [],
  );

  // Teacher joins WebSocket room first, then activates meeting
  // Only run after the countdown finishes (isWaiting = false)
  useEffect(() => {
    if (
      role !== "teacher" ||
      !socket ||
      !courseId ||
      !userId ||
      !meetingActivatedKey
    )
      return;

    const joinRoomAndActivate = () => {
      // Join the WebSocket room
      socket.emit("join-room", { classId: [courseId], teacherId: userId });

      // Check meeting-specific localStorage key
      const savedStatus = localStorage.getItem(meetingActivatedKey);
      if (savedStatus !== "true") {
        // Small delay to ensure socket room join is processed
        setTimeout(() => {
          void handleActivateMeeting(courseId, meetingActivatedKey);
        }, 500);
      }
    };

    // Listen for connection/reconnection to join room
    socket.on("connect", joinRoomAndActivate);

    // Join immediately if already connected
    if (socket.connected) {
      joinRoomAndActivate();
    }

    return () => {
      socket.off("connect", joinRoomAndActivate);
      if (socket) {
        socket.disconnect();
      }
      // Clear the meeting-specific activation flag when leaving
      if (meetingActivatedKey) {
        localStorage.removeItem(meetingActivatedKey);
      }
    };
  }, [
    courseId,
    role,
    socket,
    userId,
    meetingActivatedKey,
    handleActivateMeeting,
  ]);

  useEffect(() => {
    document.documentElement.classList.add("bg-[#242424]");
    document.body.classList.add("bg-[#242424]");

    return () => {
      document.documentElement.classList.remove("bg-[#242424]");
      document.body.classList.remove("bg-[#242424]");
    };
  }, []);

  // Auto-join immediately, or wait for countdown
  useEffect(() => {
    if (!hasJoined.current) {
      hasJoined.current = true;
      void getSignature();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown tick

  const failJoin = (message: string) => {
    toast.error(message);
    setJoinError(message);
    setIsLoadingVisible(false);
  };

  const getSignature = async () => {
    setJoinError(null);
    if (!courseId) {
      failJoin("Unable to join the meeting — course info is missing.");
      return;
    }
    try {
      const req = await fetch(authEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: courseId,
          role: _role,
        }),
      });
      const res = await req.json();
      if (!req.ok) {
        failJoin(
          (res?.message as string | undefined) ||
            "Unable to join the meeting. Please try again.",
        );
        return;
      }
      const signature = res.data?.signature as string | undefined;
      if (!signature) {
        failJoin("Unable to join the meeting. Please try again.");
        return;
      }
      const zak = res.data?.zak as string | undefined;
      startMeeting(signature, zak);
    } catch (e) {
      console.error("getSignature error:", e);
      failJoin("Unable to join the meeting. Please try again.");
    }
  };

  const handleRetryJoin = () => {
    setJoinError(null);
    setIsLoadingVisible(true);
    void getSignature();
  };

  function injectCustomLoading() {
    const customLoadingHTML = `
      <div style="
        position:fixed;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:24px;
        background:#1a1a1a;z-index:99999;
      ">
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;height:80px;width:80px;border-radius:50%;
            border:2px solid rgba(45,140,255,0.2);
            animation:cc-ping 1s cubic-bezier(0,0,0.2,1) infinite;
          "></div>
          <div style="
            position:absolute;height:64px;width:64px;border-radius:50%;
            border:2px solid rgba(45,140,255,0.3);
            animation:cc-ping 1s cubic-bezier(0,0,0.2,1) infinite;
            animation-delay:0.3s;
          "></div>
          <div style="
            height:48px;width:48px;border-radius:50%;
            border:4px solid rgba(45,140,255,0.2);
            border-top-color:#2D8CFF;
            animation:cc-spin 1s linear infinite;
          "></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">
          <span style="color:white;font-size:20px;font-weight:600;letter-spacing:0.05em;font-family:sans-serif;">Joining Meeting</span>
          <span style="color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;">Setting up your classroom experience...</span>
        </div>
        <div style="display:flex;gap:6px;">
          ${[0, 1, 2]
            .map(
              (i) => `
            <div style="
              height:6px;width:6px;border-radius:50%;background:#2D8CFF;
              animation:cc-bounce 1s infinite;animation-delay:${i * 0.15}s;
            "></div>
          `,
            )
            .join("")}
        </div>
        <style>
          @keyframes cc-ping{75%,100%{transform:scale(2);opacity:0}}
          @keyframes cc-spin{to{transform:rotate(360deg)}}
          @keyframes cc-bounce{0%,100%{transform:translateY(-25%);animation-timing-function:cubic-bezier(0.8,0,1,1)}50%{transform:none;animation-timing-function:cubic-bezier(0,0,0.2,1)}}
        </style>
      </div>
    `;

    const observer = new MutationObserver(() => {
      const wcLoading = document.getElementById("wc-loading");
      if (wcLoading) {
        wcLoading.innerHTML = customLoadingHTML;
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also check immediately in case it already exists
    const wcLoading = document.getElementById("wc-loading");
    if (wcLoading) {
      wcLoading.innerHTML = customLoadingHTML;
      observer.disconnect();
    }
  }

  function startMeeting(signature: string, zak?: string) {
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();
    injectCustomLoading();

    const zmmtgRoot = document.getElementById("zmmtg-root");
    if (zmmtgRoot) zmmtgRoot.style.display = "block";

    const leaveUrl = window.location.origin;

    ZoomMtg.init({
      leaveUrl: leaveUrl,
      patchJsMedia: true,
      defaultView: "speaker",
      disablePreview: true,
      isShowJoiningErrorDialog: true,

      meetingInfo: [
        "topic",
        "host",
        "mn",
        "pwd",
        "telPwd",
        "invite",
        "participant",
        "dc",
        "enctype",
        "report",
      ],
      success: () => {
        ZoomMtg.join({
          signature: signature,
          meetingNumber: meetingNumber,
          passWord: passWord ?? "",
          userName: userName || "john doe",
          userEmail: userEmail || "john.doe@example.com",
          ...(zak ? { zak } : {}),
          success: () => {
            setIsLoadingVisible(false);
            setIsVideoReady(true);
          },
          error: (error: unknown) => {
            console.error("ZoomMtg.join error:", error);
            failJoin("Unable to join the meeting. Please try again.");
          },
        });
      },
      error: (error: unknown) => {
        console.error("ZoomMtg.init error:", error);
        failJoin("Unable to join the meeting. Please try again.");
      },
    });
  }

  return (
    <div>
      {isLoadingVisible && (
        <div
          className={`fixed inset-0 flex flex-col items-center justify-center gap-6 bg-neutral-900 z-50 transition-opacity duration-500 ${
            isVideoReady ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ width: "100vw", height: "100vh" }}
        >
          {joinError ? (
            <>
              <div className="flex flex-col items-center gap-2 text-center px-6">
                <span className="text-white text-xl font-semibold tracking-wide">
                  Couldn't join the meeting
                </span>
                <span className="text-white/50 text-sm max-w-sm">
                  {joinError}
                </span>
              </div>
              <button
                onClick={handleRetryJoin}
                className="rounded-md bg-secondary-500 px-6 py-2 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              {/* Animated rings */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-20 w-20 rounded-full border-2 border-secondary-500/20 animate-ping" />
                <div className="absolute h-16 w-16 rounded-full border-2 border-secondary-500/30 animate-ping [animation-delay:0.3s]" />
                <div className="h-12 w-12 rounded-full border-4 border-secondary-500/20 border-t-secondary-500 animate-spin" />
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-white text-xl font-semibold tracking-wide">
                  Joining Meeting
                </span>
                <span className="text-white/50 text-sm">
                  Setting up your classroom experience...
                </span>
              </div>

              {/* Animated dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-secondary-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ----  Zoom layout with collapsible sidebar ---- */}
      <div
        id="zoom-root"
        className={isSidebarCollapsed ? "sidebar-collapsed" : ""}
      >
        <div id="zoom-col" className={isVideoReady ? "video-ready" : ""}>
          <div id="zmmtg-root" />
        </div>

        {/* Mobile backdrop overlay when sidebar is open */}
        {!isSidebarCollapsed && (
          <div
            className="sidebar-backdrop"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar toggle button */}

        {!isLoadingVisible && (
          <>
            <button
              onClick={toggleSidebar}
              className={`sidebar-toggle-btn ${isSidebarCollapsed ? "collapsed" : ""}`}
              aria-label={
                isSidebarCollapsed
                  ? "Open gamification panel"
                  : "Close gamification panel"
              }
              title={
                isSidebarCollapsed ? "Open Game Panel" : "Close Game Panel"
              }
            >
              {isSidebarCollapsed ? (
                <>
                  <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                  {/* <span className="sidebar-btn-label">GAME</span> */}
                </>
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </button>

            {/* Gamification sidebar */}
            <div
              id="content-col"
              className={isSidebarCollapsed ? "collapsed" : ""}
            >
              <Gamification courseId={courseId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { Zoom };
