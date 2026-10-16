import { Navigate, Outlet } from "react-router-dom";
import { RouteProps } from "../types.ts";

const PublicRoutes: React.FC<RouteProps> = ({ isLoggedIn, role }) => {
  if (isLoggedIn) {
    return (
      <Navigate
        to={
          role === "teacher"
            ? "/teacher-dashboard"
            : "/student-enrolled-courses"
        }
        replace
      />
    );
  }
  return <Outlet />;
};

export { PublicRoutes };
