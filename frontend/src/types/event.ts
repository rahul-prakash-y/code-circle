import { User } from './user';

export type EventType = 'Individual' | 'Team';

export interface ClubEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  venueOrLink: string;
  type: EventType;
  maxParticipants: number;
  registrationDeadline: string;
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  _id: string;
  event: ClubEvent | string;
  enrolledBy: User | string;
  type: EventType;
  teamName?: string;
  members?: (User | string)[];
  attendanceStatus: boolean;
  certificateUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceSession {
  _id: string;
  event: ClubEvent | string;
  sessionName: string;
  otp: string;
  otpExpiry: string;
  isActive: boolean;
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  _id: string;
  session: AttendanceSession | string;
  user: User | string;
  timestamp: string;
}

export interface LeaderboardEntry {
  _id: string;
  name: string;
  rollNo: string;
  department?: string;
  profilePicUrl?: string;
  totalPoints: number;
  eventsAttended: number;
  problemsSolved: number;
}
