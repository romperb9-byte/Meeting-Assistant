export interface MeetingGroup {
  id: string;
  name: string;
  description: string;
  password?: string; // Specific password for this group
  timestamp: number;
}

export interface AttendanceRecord {
  id: string;
  groupId: string;
  name: string;
  gender: string;
  position: string;
  organization: string;
  phone: string;
  remarks: string;
  timestamp: number;
}

export enum AppView {
  HOME = 'HOME',
  FORM = 'FORM',
  LIST = 'LIST',
  MINUTES = 'MINUTES',
  REPORT = 'REPORT'
}

export interface MinutesData {
  date: string;
  lunarDate: string;
  office: string;
  cluster: string;
  school: string;
  location: string;
  topic: string;
  agenda: string;
  chairperson: string;
  chairpersonPosition: string;
  secretary: string;
  secretaryPosition: string;
  recommendations: string;
  results: string;
  startTime: string;
  endTime: string;
}

export interface ReportData {
  district: string;
  province: string;
  office: string;
  cluster: string;
  school: string;
  title: string;
  targetGroup: string;
  referenceLetter: string;
  startDate: string;
  endDate: string;
  location: string;
  coordinator: string;
  trainer: string;
  reporter: string;
  reporterPosition: string;
  approver: string;
  approverPosition: string;
  overviewNotes: string;
  challenges: string;
  solutions: string;
  suggestions: string;
  photos: string[];
}
