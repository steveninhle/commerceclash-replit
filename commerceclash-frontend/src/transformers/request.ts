import { MeetingParams, MeetingPayload } from "./types";

export function createMeetingPayload({
  meetingId,
  name,
  meetingLink,
  passcode,
  duration,
  allocatePoints,
  enrolledStudents = [],
  startTime,
  endTime,
}: MeetingParams): MeetingPayload {
  return {
    meetingId: String(meetingId),
    name: String(name),
    meetingLink: String(meetingLink),
    passcode: String(passcode),
    duration: Number(duration),
    allocatePoints: Number(allocatePoints),
    enrolledStudents: enrolledStudents.map(String),
    ...(startTime && { startTime }),
    ...(endTime && { endTime }),
  };
}
