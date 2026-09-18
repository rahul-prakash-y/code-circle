import { User } from './user';

export type EventType = 'Individual' | 'Team' | 'Duo' | 'Technical' | 'Non-Technical' | 'Lecture' | 'Workshop';
export type EventFormat = 'Individual' | 'Duo' | 'Team';

export interface CustomField {
  id?: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'checkbox';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface ClubEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  venueOrLink: string;
  type: string;
  format?: EventFormat;
  status?: string;
  maxParticipants: number;
  registrationDeadline: string;
  certificateTemplateUrl?: string;
  customFields?: CustomField[];
  createdBy?: User | string | { name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  _id: string;
  event: ClubEvent | string;
  enrolledBy: User | string;
  type: string;
  teamName?: string;
  members?: (User | string)[];
  attendanceStatus: boolean;
  certificateUrl?: string | null;
  customResponses?: Record<string, any>;
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
