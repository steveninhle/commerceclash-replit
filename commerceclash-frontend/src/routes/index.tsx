import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  Checkout,
  ForgotPassword,
  Home,
  NotFound,
  ResetPassword,
  SetPassword,
  SignIn,
  StudentDetails,
  StudentEnrolledCourses,
  TeacherDashboard,
  Zoom,
} from "../pages";
import { ProtectedRoutes } from "./protected/protect";
import { PublicRoutes } from "./public/public";
import { RouteProps } from "./types";
import DevCenterPanelPreview from "@/dev/DevCenterPanelPreview";

const MarketShare = lazy(() =>
  import("@/features/game/components/MarketShare").then((m) => ({
    default: m.default,
  })),
);

const LeaderSelectionPage = lazy(() =>
  import("@/leader-selection/components/LeaderSelectionPage").then((m) => ({
    default: m.LeaderSelectionPage,
  })),
);

const ChooseClassPage = lazy(() =>
  import("@/pages/chooseClass/ChooseClassPage").then((m) => ({ default: m.ChooseClassPage }))
);
const ChooseCeoPage = lazy(() =>
  import("@/pages/chooseCeo/ChooseCeoPage").then((m) => ({ default: m.ChooseCeoPage }))
);
const PaymentSuccess = lazy(() =>
  import("@/pages/payment/PaymentSuccess").then((m) => ({ default: m.PaymentSuccess }))
);

const Navigation: React.FC<RouteProps> = ({ isLoggedIn, role }) => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              role === "teacher" ? (
                <Navigate to="/teacher-dashboard" replace />
              ) : (
                <Navigate to="/student-enrolled-courses" replace />
              )
            ) : (
              <Navigate to="/auth/signin" replace />
            )
          }
        />

        {/* Protected */}
        <Route
          element={<ProtectedRoutes isLoggedIn={isLoggedIn} role={role} />}
        >
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/student-details/:id" element={<StudentDetails />} />
          <Route path="/home" element={<Home />} />
          <Route path="/meeting" element={<Zoom />} />
          <Route path="/market-Share" element={<MarketShare />} />
          <Route path="/student-enrolled-courses" element={<StudentEnrolledCourses />} />
        </Route>

        {/* Public */}
        <Route element={<PublicRoutes isLoggedIn={isLoggedIn} role={role} />}>
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Fully public — no auth required */}
        <Route path="/choose-class" element={<ChooseClassPage />} />
        <Route path="/register" element={<Navigate to="/choose-class" replace />} />
        <Route path="/auth/signup" element={<Navigate to="/choose-class" replace />} />
        {/* Finish hosted payments started before the choose-class flow became the only entry. */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<Navigate to="/choose-class" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Checkout / post-checkout onboarding — accessible regardless of
            login state, same as the rest of this funnel. */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/choose-ceo" element={<ChooseCeoPage />} />

        {/* Alias so "Continue to Dashboard" has one stable target regardless
            of role — mirrors the same role check "/" already does. */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              role === "teacher" ? (
                <Navigate to="/teacher-dashboard" replace />
              ) : (
                <Navigate to="/student-enrolled-courses" replace />
              )
            ) : (
              <Navigate to="/auth/signin" replace />
            )
          }
        />

        {/* Temporary preview route for the Choose Your CEO redesign */}
        <Route path="/leader-selection" element={<LeaderSelectionPage />} />

        {/* TEMP DEV PREVIEW — remove before merging */}
        <Route path="/dev-preview" element={<DevCenterPanelPreview />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default Navigation;
