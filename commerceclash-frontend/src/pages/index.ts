import { lazy } from "react";

export const NotFound = lazy(() =>
  import("./notFound/notFound.tsx").then((m) => ({ default: m.NotFound }))
);
export const Zoom = lazy(() =>
  import("./zoom/zoom.tsx").then((m) => ({ default: m.Zoom }))
);
export const Home = lazy(() =>
  import("./home/home.tsx").then((m) => ({ default: m.Home }))
);
export const Checkout = lazy(() =>
  import("./checkout/checkout.tsx").then((m) => ({ default: m.Checkout }))
);

// Auth
export const SignIn = lazy(() =>
  import("@/features/auth/pages/signIn/signIn.tsx").then((m) => ({ default: m.SignIn }))
);
export const ForgotPassword = lazy(() =>
  import("@/features/auth/pages/forgotPassword/forgotPassword.tsx").then((m) => ({
    default: m.ForgotPassword,
  }))
);
export const ResetPassword = lazy(() =>
  import("@/features/auth/pages/resetPassword/resetPassword.tsx").then((m) => ({
    default: m.ResetPassword,
  }))
);
export const SetPassword = lazy(() =>
  import("@/features/auth/pages/setPassword/setPassword.tsx").then((m) => ({
    default: m.SetPassword,
  }))
);

// Teacher
export const TeacherDashboard = lazy(() =>
  import("@/features/teacher/pages/teacherDashboard.tsx").then((m) => ({
    default: m.TeacherDashboard,
  }))
);

// Student
export const StudentDetails = lazy(() =>
  import("@/features/student/pages/studentDetails/studentDetails.tsx").then((m) => ({
    default: m.StudentDetails,
  }))
);
export const StudentEnrolledCourses = lazy(() =>
  import("@/features/student/pages/studentEnrolledCourses/studentEnrolledCourses.tsx").then((m) => ({
    default: m.StudentEnrolledCourses,
  }))
);
