export const END_POINTS = {
  // Auth
  SIGN_IN: "/auth/signin",
  FORGOT_PASSWORD: "/auth/forgot-password",
  SET_SESSION: "/auth/set-session",
  VERIFY_RECOVERY_TOKEN: "/auth/verify-recovery-token",
  RESET_PASSWORD: "/auth/reset-password",
  SET_PASSWORD: "/auth/set-password",
  RESEND_SET_PASSWORD: "/auth/resend-set-password",

  // Class
  CLASS: "/class",
  CREATE_CLASS: "/class/create-class",
  CONTINUE_CLASS: "/class/{cid}/continue",
  CREATE_MEETING: "/class/create-meeting",
  JOIN_CLASS: "/class/join-meeting",
  DELETE_MEETING: "/class/{cid}",
  UPDATE_CLASS_STATUS: "/class/{cid}/toggle-class-status",
  GET_CEO_DATA: "/class/{cid}/ceo",
  EXPORT_CLASS_DATA: "/class/{cid}/export",

  // Students in a class
  GET_STUDENTS_NAMES: "/class/{cid}/students",
  GET_CLASS_OVERVIEW: "/class/{cid}/students/overview",
  GET_STUDENTS_SKILLS: "/class/{cid}/students/skills",
  CLASS_STUDENT_XP: "/class/{cid}/students/xp",
  MARKET_SHARE: "/class/{cid}/students/market-share",
  GET_LEADERBOARD: "/class/{cid}/students/market-share",
  ENROLL_STUDENT: "/class/{class_id}/students/{student_id}/enroll",
  ASSIGN_STUDENT_CEO: "/class/{cid}/students/{sid}/assign-ceo",
  GET_ASSIGNED_CEO: "/class/{cid}/students/{sid}/ceo",

  // Perks
  USE_PERK: "/class/{cid}/students/{sid}/perks/{pid}",
  ACTIVATE_PERK: "/class/{cid}/students/{sid}/perks/{pid}/activate",
  GET_ESPIONAGE_DATA: "/class/{cid}/students/{sid}/espionage-data",

  // Student
  STUDENT_BY_ID: "/student/{student_id}",
  DELETE_STUDENT: "/student/{sid}",
  STUDENT_ENROLLED_COURSES: "/student/{student_id}/classes",
  UNENROLL_COURSE: "/student/{student_id}/classes/{class_id}/un-enroll",

  // Teacher
  STUDENT: "/teacher/{teacher_id}/students",
  UPDATE_STUDENT_BY_ID: "/teacher/{teacher_id}/students/{student_id}",
  TOGGLE_STUDENT_STATUS:
    "/teacher/{teacher_id}/toggle-student-status/{student_id}",

  // Skills
  GET_SKILLS: "/student/{sid}/classes/{cid}/skills",
  UPDATE_SKILL: "/student/{sid}/classes/{cid}/skills/{skillId}",
  CONFIRM_SKILLS: "/student/{sid}/classes/{cid}/confirm",
  SHIFT_POINTS: "/student/{sid}/classes/{cid}/shift-points",
  // Cohorts
  COHORTS: "/cohorts",
  PUBLIC_COHORTS: "/cohorts/public",
  CREATE_COHORT: "/cohorts",
  COHORT_CLASSES: "/cohorts/{cohort_id}/classes",
  COHORT_STUDENTS: "/cohorts/{cohort_id}/students",
  COHORT_PLAYERS: "/cohorts/{cohort_id}/classes/{class_id}/players",
  COHORT_SCHEDULES: "/cohorts/{cohort_id}/schedules",
  COHORT_SCHEDULES_GENERATE: "/cohorts/{cohort_id}/schedules/generate",

  // Stripe
  STRIPE_SESSION_STATUS: "/stripe/session-status",
  STRIPE_PAYMENT_INTENT: "/stripe/payment-intent",
  STRIPE_PRICE: "/stripe/price",
  STRIPE_CHECK_EMAIL: "/stripe/check-email",

  // Cohort
  COHORT_BY_ID: "/cohorts/{id}",
};
