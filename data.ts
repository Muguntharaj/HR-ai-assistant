
import { Employee, DayRecord, AttendanceStatus, PunchPair, EmployeePersonalDetails } from './types';
import * as XLSX from 'xlsx';

const formatExcelValue = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  const sVal = String(val).trim();
  if (sVal.toUpperCase() === 'N/A' || sVal.toLowerCase() === 'null') return '';

  const numVal = Number(val);
  if (!isNaN(numVal) && typeof val !== 'boolean') {
    const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime()) && numVal > 20000) { 
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    }
  }

  if (val instanceof Date) {
    const day = val.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[val.getMonth()];
    const year = val.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }

  return sVal;
};

const normalizeHeader = (header: string) => {
  return header.toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
};

const formatMinutesToHHmm = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatExcelTime = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, '0');
    const m = value.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 24 * 60);
    return formatMinutesToHHmm(totalMinutes);
  }
  const str = String(value).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return str.slice(0, 5);
  return str;
};

const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id).replace(/\s+/g, '').trim().toUpperCase();
};

const findValueByNormalizedKey = (row: any, ...keys: string[]) => {
  if (!row) return null;
  const normalizedSearchKeys = keys.map(k => normalizeHeader(k));
  const rowKeys = Object.keys(row);
  
  for (const rk of rowKeys) {
    const nrk = normalizeHeader(rk);
    if (normalizedSearchKeys.includes(nrk)) {
      const val = row[rk];
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).toUpperCase() !== 'N/A') {
        return val;
      }
    }
  }
  return null;
};

const extractId = (row: any): string | null => {
  const rawId = findValueByNormalizedKey(row, 
    'Emp Code', 'Employee Code', 'EmpCode', 'CardNo', 'Enroll ID', 'ID', 'SNo', 'Serial No'
  );
  if (rawId === null || rawId === undefined || rawId === '') return null;
  return normalizeId(rawId);
};

export const getYearMonthKey = (dateStr?: string | number | Date) => {
  if (!dateStr) return '2026-01';
  let d: Date;
  if (dateStr instanceof Date) {
    d = dateStr;
  } else if (typeof dateStr === 'number') {
    d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
  } else {
    const parts = String(dateStr).split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      else if (parts[0].length === 4) d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      else d = new Date(String(dateStr));
    } else d = new Date(String(dateStr));
  }
  if (isNaN(d.getTime())) return '2026-01';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parsePunchLogs = (punchStr: string): { cycles: PunchPair[], totalIn: number, totalBreak: number, imperfect: boolean } => {
  if (!punchStr || punchStr === 'null' || punchStr === 'undefined' || punchStr === '') {
    return { cycles: [], totalIn: 0, totalBreak: 0, imperfect: false };
  }
  const regex = /(\d{1,2}:\d{2})\s*(in|out|login|logout|T)?/gi;
  const events: { time: string, type: string }[] = [];
  let match;
  while ((match = regex.exec(punchStr)) !== null) {
    let type = (match[2] || 'in').toLowerCase();
    if (type.includes('login')) type = 'in';
    if (type.includes('logout')) type = 'out';
    events.push({ time: match[1], type: type });
  }

  const cycles: PunchPair[] = [];
  let currentIn: string | null = null;
  let totalInMinutes = 0;
  let totalBreakMinutes = 0;
  let lastOutMinutes = -1;

  events.forEach((event) => {
    const mins = parseTimeToMinutes(event.time);
    if (event.type === 'in' || event.type === 'login' || event.type === 'T') {
      currentIn = event.time;
      if (lastOutMinutes !== -1) {
        let bMins = mins - lastOutMinutes;
        if (bMins < 0) bMins += 1440;
        totalBreakMinutes += bMins;
      }
    } else if ((event.type === 'out' || event.type === 'logout') && currentIn) {
      const inMins = parseTimeToMinutes(currentIn);
      let duration = mins - inMins;
      if (duration < 0) duration += 1440; 
      cycles.push({ in: currentIn, out: event.time, durationMinutes: duration, isComplete: true });
      totalInMinutes += duration;
      lastOutMinutes = mins;
      currentIn = null;
    }
  });

  if (currentIn && cycles.length === 0) {
    cycles.push({ in: currentIn, out: null, durationMinutes: 0, isComplete: false });
  }
  return { cycles, totalIn: totalInMinutes, totalBreak: totalBreakMinutes, imperfect: (events.length % 2 !== 0) || events.length === 0 };
};

export const enrichWithML = (employees: Employee[]): Employee[] => {
  return employees.map(emp => {
    const allRecords = Object.values(emp.monthlyData).flat();
    if (allRecords.length === 0) return { ...emp, complianceScore: 100, riskScore: 0, tags: ['NEW'] };
    const anomalies = allRecords.filter(r => r.isCycleImperfect).length;
    const absents = allRecords.filter(r => r.status.toLowerCase().includes('absent')).length;
    const lates = allRecords.filter(r => r.lateBy && r.lateBy !== '00:00' && r.lateBy !== '0:00').length;
    const complianceScore = Math.max(0, 100 - (anomalies * 5) - (absents * 15) - (lates * 3));
    const riskScore = Math.min(100, (absents * 10) + (anomalies * 15));
    const tags: string[] = [];
    if (riskScore > 40) tags.push('AT_RISK');
    if (anomalies > 1) tags.push('PUNCH_ANOMALY');
    if (complianceScore > 95) tags.push('RELIABLE');
    return { ...emp, complianceScore, riskScore, tags };
  });
};

export const processPersonalData = async (file: File): Promise<Partial<Employee>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];
        
        const results = json.map(row => {
          const empId = extractId(row);
          if (!empId) return null;
          
          const designationVal = String(findValueByNormalizedKey(row, 'Designation', 'Desig', 'Designatio Grade', 'Grade', 'Role') || '').trim();
          const departmentVal = String(findValueByNormalizedKey(row, 'Dep', 'Dept', 'Department', 'Division') || 'General').trim();

          const details: EmployeePersonalDetails = {
            fatherName: formatExcelValue(findValueByNormalizedKey(row, 'Father Name', 'Father N', 'FatherName', 'Parents')),
            designation: designationVal,
            dob: formatExcelValue(findValueByNormalizedKey(row, 'D.O.B (DD/MM/YY)', 'DOB', 'Date of Birth', 'Birth Date')),
            doj: formatExcelValue(findValueByNormalizedKey(row, 'D.O.J (DD/MM/YY)', 'DOJ', 'Date of Joining', 'Joining Date')),
            activeStatus: (String(findValueByNormalizedKey(row, 'Active / Inactive', 'Active / Inac', 'Status', 'Employment Status') || '').toLowerCase().includes('active') ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
            gender: String(findValueByNormalizedKey(row, 'Gender', 'Gen', 'Sex') || '').trim(),
            maritalStatus: String(findValueByNormalizedKey(row, 'Marital status', 'Marital Status', 'Marital') || '').trim(),
            address: String(findValueByNormalizedKey(row, 'Address', 'Add', 'Location') || '').trim(),
            contactNumber: formatExcelValue(findValueByNormalizedKey(row, 'Contact Number', 'Phone', 'Mobile', 'Cell')),
            emergencyContact: formatExcelValue(findValueByNormalizedKey(row, 'Emergency contact number', 'Emergency No', 'SOS Number')),
            emergencyContactPerson: String(findValueByNormalizedKey(row, 'Emergency contact person', 'Emergency Person', 'Relative Name') || '').trim(),
            bloodGroup: String(findValueByNormalizedKey(row, 'Blood Group', 'Blood', 'BG') || '').trim(),
            aadhar: formatExcelValue(findValueByNormalizedKey(row, 'Aadhar Card Number', 'Aadhar', 'UID', 'Adhar')),
            pan: formatExcelValue(findValueByNormalizedKey(row, 'Pan Card Number', 'PAN', 'PAN NO')),
            mailId: String(findValueByNormalizedKey(row, 'Mail - Id', 'Email', 'Mail ID', 'Mail-Id', 'Gmail') || '').trim(),
          };

          return {
            id: empId,
            name: String(findValueByNormalizedKey(row, 'Emp Name', 'Employee Name', 'Name', 'FullName') || '').trim(),
            department: departmentVal,
            company: String(findValueByNormalizedKey(row, 'Company', 'Org', 'Organization', 'Firm') || 'Copes Tech').trim(),
            details
          };
        }).filter(Boolean);
        
        resolve(results as Partial<Employee>[]);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const processAttendanceData = async (file: File, existing: Employee[]): Promise<Employee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];
        const employeesMap = new Map<string, Employee>();
        existing.forEach(emp => employeesMap.set(emp.id, JSON.parse(JSON.stringify(emp))));

        json.forEach(row => {
          const empId = extractId(row);
          if (!empId) return;
          const rowName = String(findValueByNormalizedKey(row, 'Employee Name', 'Emp Name', 'Name') || '').trim();
          let emp = employeesMap.get(empId);
          if (!emp && rowName) {
             const matchByName = Array.from(employeesMap.values()).find(e => e.name.toLowerCase() === rowName.toLowerCase());
             if (matchByName) { emp = matchByName; employeesMap.set(empId, emp); }
          }

          let dateValue = findValueByNormalizedKey(row, 'Date', 'Att Date', 'Work Date');
          let dateStr = dateValue instanceof Date ? `${dateValue.getDate().toString().padStart(2, '0')}-${(dateValue.getMonth() + 1).toString().padStart(2, '0')}-${dateValue.getFullYear()}` : formatExcelValue(dateValue || '');
          if (!dateStr) return;
          
          const ym = getYearMonthKey(dateValue || dateStr);
          const day = dateValue instanceof Date ? dateValue.getDate() : parseInt(dateStr.split(/[-/]/)[0]) || 1;

          if (!emp) {
            emp = { id: empId, name: rowName || 'New Employee', company: 'Copes Tech', department: 'General', monthlyData: {} };
            employeesMap.set(empId, emp);
          }

          if (!emp.monthlyData[ym]) emp.monthlyData[ym] = [];
          
          let rawStatus = String(findValueByNormalizedKey(row, 'Status', 'Att Status', 'Attendance') || 'Absent');
          const inTime = formatExcelTime(findValueByNormalizedKey(row, 'In Time', 'Login', 'InTime'));
          const outTime = formatExcelTime(findValueByNormalizedKey(row, 'Out Time', 'Logout', 'OutTime'));
          const duration = formatExcelTime(findValueByNormalizedKey(row, 'Duration', 'Work Hrs', 'Total Hrs'));
          const overtime = formatExcelTime(findValueByNormalizedKey(row, 'Overtime', 'OT', 'Extra Hrs'));
          
          let punchRec = String(findValueByNormalizedKey(row, 'Punch Records', 'Punch Rec', 'Log') || '');
          if (!punchRec && (inTime || outTime)) punchRec = `${inTime ? inTime + 'in' : ''}${inTime && outTime ? ', ' : ''}${outTime ? outTime + 'out' : ''}`;
          
          const { cycles, totalIn, totalBreak, imperfect } = parsePunchLogs(punchRec);
          const hasPunch = cycles.length > 0 || (punchRec.trim() !== '' && punchRec.toLowerCase() !== 'null');
          const hasDuration = duration && duration !== '00:00' && duration !== '0:00';

          const normalizedStatus = rawStatus.toLowerCase();
          let statusVal = 'Absent';

          if (normalizedStatus.includes('week') || normalizedStatus.includes('w/o')) {
            statusVal = (hasPunch || hasDuration) ? 'Weekoff Present' : 'WeeklyOff';
          } else if (normalizedStatus.includes('present') || hasPunch || hasDuration) {
            statusVal = 'Present';
          } else if (normalizedStatus.includes('absent')) {
            statusVal = 'Absent';
          }

          const record: DayRecord = {
            date: dateStr, day, status: statusVal, shift: String(findValueByNormalizedKey(row, 'Shift', 'Work Shift') || 'GS'),
            cycles, totalStayedInMinutes: totalIn || parseTimeToMinutes(duration), totalBreakMinutes: totalBreak,
            totalDuration: duration, lateBy: formatExcelTime(findValueByNormalizedKey(row, 'Late By', 'Late')),
            earlyBy: formatExcelTime(findValueByNormalizedKey(row, 'Early By', 'Early')),
            isCycleImperfect: imperfect, totalCyclesCount: cycles.length || (hasDuration ? 1 : 0),
            breakOverstayMinutes: Math.max(0, totalBreak - 60), punchRecRaw: punchRec, overtime: overtime
          };

          const existingDayIdx = emp.monthlyData[ym].findIndex(d => d.day === day);
          if (existingDayIdx > -1) emp.monthlyData[ym][existingDayIdx] = record;
          else emp.monthlyData[ym].push(record);
        });
        resolve(Array.from(employeesMap.values()));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const exportEmployeesToExcel = (employees: Employee[]) => {
  const rows: any[] = [];
  employees.forEach(emp => {
    Object.keys(emp.monthlyData).forEach(ym => {
      emp.monthlyData[ym].forEach(record => {
        rows.push({
          "Emp Code": emp.id,
          "Employee Name": emp.name,
          "Department": emp.department,
          "Company": emp.company,
          "Designation": emp.details?.designation || '',
          "Date": record.date,
          "Status": record.status,
          "Shift": record.shift,
          "In Time": record.cycles[0]?.in || '',
          "Out Time": record.cycles[record.cycles.length - 1]?.out || '',
          "Total Duration": record.totalDuration || formatMinutesToHHmm(record.totalStayedInMinutes),
          "Late By": record.lateBy || '',
          "Early By": record.earlyBy || '',
          "Punch Records": record.punchRecRaw || '',
          "Compliance Score": emp.complianceScore || 100
        });
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Master_Attendance_Report");
  XLSX.writeFile(wb, `Neural_Cloud_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};
