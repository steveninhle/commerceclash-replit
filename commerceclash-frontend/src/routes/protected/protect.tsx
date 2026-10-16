import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RouteProps } from "../types.ts";
import { SocketProvider } from "@/context/index";

const ProtectedRoutes: React.FC<RouteProps> = ({ isLoggedIn, role }) => {
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check if user is trying to access a route they don't have permission for
  const currentPath = location.pathname;

  // Teacher-only routes
  if (
    (currentPath === "/teacher-dashboard" ||
      currentPath.startsWith("/student-details/")) &&
    role !== "teacher"
  ) {
    return <Navigate to="/student-enrolled-courses" replace />;
  }

  // Student-only routes
  if (
    (currentPath === "/home" || currentPath === "/student-enrolled-courses") &&
    role === "teacher"
  ) {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
};

export { ProtectedRoutes };
