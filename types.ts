
export type AttendanceStatus = 'Present' | 'Absent' | 'WeeklyOff' | string;

export interface PunchPair {
  in: string;
  out: string | null;
  durationMinutes: number;
  isComplete?: boolean;
}

export interface DayRecord {
  date: string;
  day: number;
  status: AttendanceStatus;
  shift: string;
  cycles: PunchPair[];
  totalStayedInMinutes: number;
  totalBreakMinutes: number;
  totalDuration: string | null;
  lateBy: string | null;
  earlyBy: string | null;
  isCycleImperfect: boolean;
  totalCyclesCount: number;
  punchRecRaw?: string;
  breakOverstayMinutes: number;
  overtime?: string | null;
}

export interface EmployeePersonalDetails {
  fatherName?: string;
  designation?: string;
  dob?: string;
  doj?: string;
  dor?: string;
  doe?: string;
  activeStatus?: 'Active' | 'Inactive';
  gender?: string;
  maritalStatus?: string;
  address?: string;
  contactNumber?: string;
  emergencyContact?: string;
  emergencyContactPerson?: string;
  bloodGroup?: string;
  aadhar?: string;
  pan?: string;
  mailId?: string;
  team?: string;
  category?: string;
  grade?: string;
  ctc?: string;
  bondApplicable?: string;
}

export interface Employee {
  id: string;
  name: string;
  details?: EmployeePersonalDetails;
  monthlyData: { [yearMonth: string]: DayRecord[] }; 
  department: string;
  company: string;
  riskScore?: number;
  complianceScore?: number;
  tags?: string[];
  readNotificationKeys?: string[]; 
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  role: UserRole;
  employeeId?: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  chartData?: any[];
  chartType?: 'bar' | 'pie' | 'line' | 'radar' | 'scatter' | 'composed' | 'area';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}
