
import * as XLSX from 'xlsx';

export const downloadAttendanceTemplate = () => {
  const headers = [
    "Date", "Employee Code", "Employee Name", "Company", "Department", 
    "Category", "Deginatio Grade", "Team", "Shift", "In Time", "Out Time", 
    "Duration", "Late By", "Early By", "Status", "Punch Rec", "Overtime"
  ];
  const sampleData = [
    ["01-01-2026", "C147", "VISHAL SINGH", "Copes Tech", "CAE", "Default", "CAE ENG", "", "NS", "", "", "00:00", "00:00", "00:00", "Absent", "", "00:00"],
    ["02-01-2026", "C147", "VISHAL SINGH", "Copes Tech", "CAE", "Default", "CAE ENG", "", "GS", "10:14", "20:12", "08:31", "00:00", "00:00", "Present", "10:14in(T), 20:12out(T)", "00:00"]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance_Log");
  XLSX.writeFile(wb, "Recommended_Attendance_Template.xlsx");
};

export const downloadPersonnelTemplate = () => {
  const headers = [
    "S.No", "Emp Code", "Emp Name", "Father Name", "Designation", 
    "D.O.B (DD/MM/YY)", "D.O.J (DD/MM/YY)", "Active / Inactive", "Gender", 
    "Marital status", "Address", "Contact Number", "Emergency contact number", 
    "Emergency contact person", "Blood Group", "Aadhar Card Number", 
    "Pan Card Number", "Mail - Id"
  ];
  const sampleData = [
    [1, "C147", "VISHAL SINGH", "AWADESH KUMAR SIN", "CAE ENG", "01-Mar-22", "01-Mar-22", "Active", "MALE", "Unmarried", "G3, OCC", "8977257970", "9703886462", "Mother", "O +VE", "303668319338", "OUMPS8219B", "singhvishu0301@gmail.com"]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Personnel_Data");
  XLSX.writeFile(wb, "Recommended_Personnel_Template.xlsx");
};
