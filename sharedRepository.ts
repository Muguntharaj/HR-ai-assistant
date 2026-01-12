
import { Employee } from './types';

/**
 * This file acts as your "Network Folder". 
 * Data placed here is compiled into the app and becomes 
 * available to every user on your network immediately.
 */
export const SHARED_NETWORK_DATA: Employee[] = [
  {
    id: 'ADMIN_MASTER_001',
    name: 'NETWORK MASTER LOG',
    department: 'SYSTEM',
    company: 'Corporate Network',
    monthlyData: {
      '2026-01': [
        // Added missing totalStayedInMinutes: 0 and totalBreakMinutes: 0
        { date: '01-01-2026', day: 1, status: 'WeeklyOff', shift: 'GS', cycles: [], totalStayedInMinutes: 0, totalBreakMinutes: 0, totalDuration: '00:00', lateBy: '00:00', earlyBy: '00:00', overtime: '00:00', isCycleImperfect: false, totalCyclesCount: 0, breakOverstayMinutes: 0 },
      ]
    },
    details: { 
      designation: 'Network Dataset',
      mailId: 'admin@company.network',
      activeStatus: 'Active'
    }
  }
];

export interface NetworkFolder {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  data: Employee[];
}

export const NETWORK_FOLDERS: NetworkFolder[] = [
  {
    id: 'f-001',
    name: 'Q1_Attendance_Master',
    description: 'Verified attendance logs for Jan-Mar 2026',
    lastUpdated: '2026-02-15',
    data: SHARED_NETWORK_DATA
  },
  {
    id: 'f-002',
    name: 'Employee_Compliance_Docs',
    description: 'Updated personal details and compliance scores',
    lastUpdated: '2026-02-10',
    data: [] // Can be populated with more master data
  }
];
