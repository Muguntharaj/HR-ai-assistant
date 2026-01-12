
import { Employee } from '../types';

/**
 * MASTER CLOUD REPOSITORY: shared_excel_files/
 * All network users fetch this data on startup.
 */
export const SHARED_NETWORK_DATA: Employee[] = [
  {
    id: 'C147',
    name: 'VISHAL SINGH',
    department: 'CAE',
    company: 'Copes Tech',
    details: {
      fatherName: 'AWADESH KUMAR SIN',
      designation: 'CAE ENG',
      dob: '01-Mar-22',
      activeStatus: 'Active',
      gender: 'MALE',
      contactNumber: '8977257970',
      mailId: 'singhvishu0301@gmail.com',
      aadhar: '303668319338',
      address: 'G3, OCC, Sector 18, Gurugram'
    },
    monthlyData: {
      '2026-01': [
        { date: '01-01-2026', day: 1, status: 'Absent', shift: 'NS', cycles: [], totalStayedInMinutes: 0, totalBreakMinutes: 0, totalDuration: '00:00', lateBy: '00:00', earlyBy: '00:00', overtime: '00:00', isCycleImperfect: false, totalCyclesCount: 0, breakOverstayMinutes: 0 },
        { date: '02-01-2026', day: 2, status: 'Present', shift: 'GS', cycles: [{ in: '10:14', out: '20:12', durationMinutes: 511, isComplete: true }], totalStayedInMinutes: 511, totalBreakMinutes: 0, totalDuration: '08:31', lateBy: '00:00', earlyBy: '00:00', overtime: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 },
        { date: '03-01-2026', day: 3, status: 'Present', shift: 'NS', cycles: [{ in: '21:00', out: '06:00', durationMinutes: 540, isComplete: true }], totalStayedInMinutes: 540, totalBreakMinutes: 0, totalDuration: '09:00', lateBy: '00:00', earlyBy: '00:00', overtime: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 },
        { date: '04-01-2026', day: 4, status: 'Weekoff Present', shift: 'NS', cycles: [{ in: '10:00', out: '18:00', durationMinutes: 480, isComplete: true }], totalStayedInMinutes: 480, totalBreakMinutes: 0, totalDuration: '08:00', lateBy: '00:00', earlyBy: '00:00', overtime: '08:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 }
      ]
    }
  },
  {
    id: 'C148',
    name: 'MOHAMMED MUBASHIR',
    department: 'CAE',
    company: 'Copes Tech',
    details: {
      fatherName: 'CHENNARI ISMAIL',
      designation: 'CAE ENG',
      activeStatus: 'Active',
      contactNumber: '8500152780',
      mailId: 'mubashir@example.com'
    },
    monthlyData: {
      '2026-01': [
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '01-01-2026', day: 1, status: 'Present', shift: 'GS', cycles: [{ in: '10:00', out: '19:00', durationMinutes: 540, isComplete: true }], totalStayedInMinutes: 540, totalBreakMinutes: 0, totalDuration: '09:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 },
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '04-01-2026', day: 4, status: 'WeeklyOff', shift: 'GS', cycles: [], totalStayedInMinutes: 0, totalBreakMinutes: 0, totalDuration: '00:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 0, breakOverstayMinutes: 0 }
      ]
    }
  },
  {
    id: 'C149',
    name: 'ANITA SHARMA',
    department: 'HR',
    company: 'Neelaminds',
    details: {
      designation: 'HR MANAGER',
      activeStatus: 'Active',
      contactNumber: '9988776655',
      mailId: 'anita.hr@neelaminds.com'
    },
    monthlyData: {
      '2026-01': [
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '01-01-2026', day: 1, status: 'Present', shift: 'GS', cycles: [{ in: '09:30', out: '18:30', durationMinutes: 540, isComplete: true }], totalStayedInMinutes: 540, totalBreakMinutes: 0, totalDuration: '09:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 }
      ]
    }
  },
  {
    id: 'C150',
    name: 'RAHUL VERMA',
    department: 'OPERATIONS',
    company: 'Copes Tech',
    details: {
      designation: 'OPS SUP',
      activeStatus: 'Active'
    },
    monthlyData: {
      '2026-01': [
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '01-01-2026', day: 1, status: 'Present', shift: 'GS', cycles: [{ in: '10:00', out: '20:00', durationMinutes: 600, isComplete: true }], totalStayedInMinutes: 600, totalBreakMinutes: 0, totalDuration: '10:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 },
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '02-01-2026', day: 2, status: 'Absent', shift: 'GS', cycles: [], totalStayedInMinutes: 0, totalBreakMinutes: 0, totalDuration: '00:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 0, breakOverstayMinutes: 0 }
      ]
    }
  },
  {
    id: 'C151',
    name: 'PRIYA DAS',
    department: 'QA',
    company: 'Copes Tech',
    details: {
      designation: 'QA TESTER',
      activeStatus: 'Active'
    },
    monthlyData: {
      '2026-01': [
        // Added lateBy and earlyBy to satisfy DayRecord interface
        { date: '01-01-2026', day: 1, status: 'Present', shift: 'GS', cycles: [{ in: '09:00', out: '18:00', durationMinutes: 540, isComplete: true }], totalStayedInMinutes: 540, totalBreakMinutes: 0, totalDuration: '09:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 1, breakOverstayMinutes: 0 }
      ]
    }
  }
];
