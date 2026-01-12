
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, DayRecord, AuthUser, PunchPair } from '../types';
import { getYearMonthKey } from '../data';
import { 
  Search, ArrowRight, X, Building2, LayoutGrid, Info, CheckCircle, AlertCircle,
  Cloud, ShieldAlert, CalendarDays, Bell, PieChart as PieIcon, BarChart3, TrendingUp, Clock, LogIn, LogOut, ChevronDown, ChevronUp, Trash2, CheckCheck, Users, Edit3, Save, PlusCircle, Trash, UserPlus, Fingerprint, Activity, Phone, Mail, MapPin, HeartPulse, CreditCard, User, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  currentUser: AuthUser;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'Present': '#10b981', 
  'Absent': '#f43f5e',  
  'WeeklyOff': '#fbbf24', 
  'Week off': '#fbbf24',
  'W/O': '#fbbf24',
  'Weekoff Present': '#3b82f6' 
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatMins = (mins: number) => {
  if (mins === undefined || mins === null || isNaN(mins) || mins === 0) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const Dashboard: React.FC<DashboardProps> = ({ employees, setEmployees, currentUser, onUpdateEmployee, onDeleteEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'roster' | 'analytics'>('roster');
  const [selectedDept, setSelectedDept] = useState<string>('View All Departments');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{emp: Employee, record: DayRecord} | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editorTab, setEditorTab] = useState<'details' | 'logs'>('details');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getYearMonthKey(new Date()));
    employees.forEach(emp => {
      Object.keys(emp.monthlyData).forEach(m => months.add(m));
    });
    return Array.from(months).sort().reverse();
  }, [employees]);

  const [currentViewMonth, setCurrentViewMonth] = useState(availableMonths[0] || '2026-01');

  const departments = useMemo(() => ['View All Departments', ...Array.from(new Set(employees.map(e => e.department || 'General')))], [employees]);

  const filteredEmployees = useMemo(() => {
    let list = employees.filter(emp => {
      const matchDept = (selectedDept === 'View All Departments' || emp.department === selectedDept);
      const name = emp.name || '';
      const id = emp.id || '';
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });

    if (currentUser.role === 'EMPLOYEE') {
      list = list.filter(e => e.id === currentUser.employeeId);
    }
    return list;
  }, [employees, searchTerm, selectedDept, currentUser]);

  const analyticsData = useMemo(() => {
    const deptStats: Record<string, { present: number; absent: number; total: number; empCount: number }> = {};
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalOff = 0;
    let totalAnomalies = 0;

    filteredEmployees.forEach(emp => {
      const records = emp.monthlyData[currentViewMonth] || [];
      const dept = emp.department || 'General';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, absent: 0, total: 0, empCount: 0 };
      deptStats[dept].empCount++;

      records.forEach(r => {
        const status = r.status.toLowerCase();
        if (status.includes('weeklyoff') || status.includes('week off') || status.includes('w/o')) {
          totalOff++;
        } else if (status.includes('present')) {
          totalPresent++;
          deptStats[dept].present++;
        } else if (status.includes('absent')) {
          totalAbsent++;
          deptStats[dept].absent++;
        }
        if (r.isCycleImperfect) totalAnomalies++;
        deptStats[dept].total++;
      });
    });

    const empCount = Math.max(1, filteredEmployees.length);
    const avgPresent = (totalPresent / empCount).toFixed(1);
    const avgAbsent = (totalAbsent / empCount).toFixed(1);

    const pieData = [
      { name: 'Present', value: totalPresent },
      { name: 'Absent', value: totalAbsent },
      { name: 'WeeklyOff', value: totalOff }
    ].filter(d => d.value > 0);

    const barData = Object.entries(deptStats).map(([name, stats]) => ({
      name,
      avgPresent: parseFloat((stats.present / Math.max(1, stats.empCount)).toFixed(1)),
      avgAbsent: parseFloat((stats.absent / Math.max(1, stats.empCount)).toFixed(1))
    }));

    return { pieData, barData, totalAnomalies, totalPresent, totalAbsent, avgPresent, avgAbsent, empCount };
  }, [filteredEmployees, currentViewMonth]);

  const notifications = useMemo(() => {
    const list: {emp: Employee, record: DayRecord, key: string}[] = [];
    employees.forEach(emp => {
      if (currentUser.role === 'EMPLOYEE' && emp.id !== currentUser.employeeId) return;
      Object.keys(emp.monthlyData).forEach(ym => {
        emp.monthlyData[ym].forEach(record => {
          if (record.isCycleImperfect) {
            const key = `${emp.id}-${record.date}`;
            if (!emp.readNotificationKeys?.includes(key)) {
              list.push({emp, record, key});
            }
          }
        });
      });
    });
    return list;
  }, [employees, currentUser]);

  const handleMarkRead = (key: string, empId: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        return { ...e, readNotificationKeys: [...(e.readNotificationKeys || []), key] };
      }
      return e;
    }));
  };

  const handleMarkAllRead = () => {
    setEmployees(prev => prev.map(e => {
      if (currentUser.role === 'EMPLOYEE' && e.id !== currentUser.employeeId) return e;
      const keysToAdd: string[] = [];
      Object.keys(e.monthlyData).forEach(ym => {
        e.monthlyData[ym].forEach(r => {
          if (r.isCycleImperfect) {
            const key = `${e.id}-${r.date}`;
            if (!e.readNotificationKeys?.includes(key)) keysToAdd.push(key);
          }
        });
      });
      return { ...e, readNotificationKeys: [...(e.readNotificationKeys || []), ...keysToAdd] };
    }));
  };

  const getStats = (emp: Employee, month: string) => {
    const data = emp.monthlyData[month] || [];
    return {
      present: data.filter(r => r.status.toLowerCase().includes('present')).length,
      absent: data.filter(r => r.status.toLowerCase().includes('absent')).length,
      off: data.filter(r => {
        const s = r.status.toLowerCase();
        return s.includes('weeklyoff') || s.includes('week off') || s.includes('w/o');
      }).length
    };
  };

  const DailyStatusRibbon = ({ emp, data }: { emp: Employee, data: DayRecord[] }) => {
    const slots = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const record = data.find(r => r.day === day);
      let color = '#e2e8f0'; 
      if (record) {
        const status = record.status.toLowerCase();
        if (status.includes('weeklyoff') || status.includes('week off') || status.includes('w/o')) {
           color = STATUS_COLORS['WeeklyOff'];
        } else if (status.includes('present')) {
           color = STATUS_COLORS['Present'];
        } else if (status.includes('absent')) {
           color = STATUS_COLORS['Absent'];
        }
      }
      return (
        <div 
          key={i} 
          onClick={(e) => { e.stopPropagation(); if(record) setSelectedDayDetail({emp, record}); }}
          className="flex-1 h-20 rounded-md transition-all hover:scale-125 hover:shadow-2xl cursor-pointer relative border border-white hover:z-20 ring-1 ring-black/5" 
          style={{ backgroundColor: color }}
        >
          {record?.isCycleImperfect && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white animate-pulse"></div>}
        </div>
      );
    });
    return <div className="flex gap-[4px] w-full p-2 bg-slate-300/50 rounded-xl shadow-inner border border-slate-200">{slots}</div>;
  };

  const renderCalendarGrid = (emp: Employee, ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const startDay = startDate.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const calendar = [];
    for (let i = 0; i < startDay; i++) {
      calendar.push(<div key={`empty-${i}`} className="aspect-square bg-slate-50/20 rounded-2xl border border-dashed border-slate-200"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const record = emp.monthlyData[ym]?.find(r => r.day === day);
      let bgColor = '#ffffff';
      let borderCol = 'border-slate-200';
      if (record) {
        const status = record.status.toLowerCase();
        if (status.includes('weeklyoff') || status.includes('week off') || status.includes('w/o')) {
           bgColor = STATUS_COLORS['WeeklyOff'];
        } else if (status.includes('present')) {
           bgColor = STATUS_COLORS['Present'];
        } else if (status.includes('absent')) {
           bgColor = STATUS_COLORS['Absent'];
        }
        borderCol = 'border-white/40';
      }
      
      const firstIn = record?.cycles[0]?.in;
      const lastOut = record?.cycles[record.cycles.length - 1]?.out;

      calendar.push(
        <div 
          key={`day-${day}`} 
          onClick={(e) => { e.stopPropagation(); if(record) setSelectedDayDetail({emp, record}); }}
          className={`aspect-square rounded-2xl shadow-sm relative group overflow-hidden border-2 transition-all hover:scale-110 cursor-pointer ${borderCol} flex flex-col p-1`} 
          style={{ backgroundColor: bgColor }}
        >
          <div className="absolute top-2 left-2 text-xs md:text-sm font-black text-slate-900/40">{day}</div>
          
          {record && record.cycles.length > 0 && (
            <div className="mt-5 flex flex-col items-center justify-center opacity-40 group-hover:opacity-10 transition-opacity">
              <span className="text-[8px] font-black">{firstIn}</span>
              <span className="text-[8px] font-black">{lastOut || '--:--'}</span>
            </div>
          )}

          {record && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 opacity-0 group-hover:opacity-100 bg-black/70 backdrop-blur-md transition-all text-white text-center">
              <p className="text-[8px] font-black uppercase mb-0.5 tracking-tighter">{record.shift}</p>
              <p className="text-[10px] md:text-xs font-black">{formatMins(record.totalStayedInMinutes)}</p>
              {firstIn && <p className="text-[7px] font-bold mt-1 text-emerald-400">IN: {firstIn}</p>}
            </div>
          )}
          {record?.isCycleImperfect && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white"></div>}
        </div>
      );
    }
    
    return calendar;
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedEmployeeId(expandedEmployeeId === id ? null : id);
  };

  const handleEdit = (e: React.MouseEvent | React.FocusEvent, emp: Employee) => {
    if ('stopPropagation' in e) e.stopPropagation();
    setEditingEmployee(JSON.parse(JSON.stringify(emp))); 
    setEditorTab('details');
  };

  const handleSaveEdit = () => {
    if (editingEmployee && onUpdateEmployee) {
      onUpdateEmployee(editingEmployee);
      setEditingEmployee(null);
      // If we were editing the selected employee, update that view too
      if (selectedEmployee?.id === editingEmployee.id) {
        setSelectedEmployee(editingEmployee);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent | React.FocusEvent, id: string) => {
    if ('stopPropagation' in e) e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId && onDeleteEmployee) {
      onDeleteEmployee(confirmDeleteId);
      if (selectedEmployee?.id === confirmDeleteId) setSelectedEmployee(null);
      if (expandedEmployeeId === confirmDeleteId) setExpandedEmployeeId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCreateNew = () => {
    const nextNum = employees.length > 0 
      ? Math.max(...employees.map(e => parseInt(e.id.replace(/\D/g,'')) || 0)) + 1 
      : 147;
    const newId = `C${nextNum}`;
    const newEmp: Employee = {
      id: newId,
      name: 'NEW PERSONNEL',
      department: 'General',
      company: 'Copes Tech',
      monthlyData: {},
      details: { activeStatus: 'Active', designation: 'Staff' }
    };
    setEditingEmployee(newEmp);
    setEditorTab('details');
  };

  const updateLogRecord = (day: number, field: string, value: any) => {
    if (!editingEmployee) return;
    const newData = { ...editingEmployee.monthlyData };
    if (!newData[currentViewMonth]) newData[currentViewMonth] = [];
    
    const existingIdx = newData[currentViewMonth].findIndex(r => r.day === day);
    if (existingIdx > -1) {
      const rec = { ...newData[currentViewMonth][existingIdx] };
      (rec as any)[field] = value;
      newData[currentViewMonth][existingIdx] = rec;
    } else {
      const newRec: DayRecord = {
        day, date: `${day.toString().padStart(2, '0')}-${currentViewMonth.split('-')[1]}-${currentViewMonth.split('-')[0]}`,
        status: 'Absent', shift: 'GS', cycles: [], totalStayedInMinutes: 0, totalBreakMinutes: 0,
        totalDuration: '00:00', lateBy: '00:00', earlyBy: '00:00', isCycleImperfect: false, totalCyclesCount: 0,
        breakOverstayMinutes: 0
      };
      (newRec as any)[field] = value;
      newData[currentViewMonth].push(newRec);
    }
    setEditingEmployee({ ...editingEmployee, monthlyData: newData });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl text-white"><Building2 size={32} /></div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Personnel Intelligence</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Employee Logistics</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {currentUser.role !== 'EMPLOYEE' && (
              <button 
                onClick={handleCreateNew}
                className="px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl active:scale-95"
              >
                <UserPlus size={18}/> Add Personnel
              </button>
            )}
            <div className="bg-white p-1.5 rounded-3xl border border-slate-200 flex gap-2">
              <button onClick={() => setActiveView('roster')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'roster' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Roster</button>
              <button onClick={() => setActiveView('analytics')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Analytics</button>
            </div>
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-4 bg-white rounded-full border border-slate-200 text-slate-400 relative hover:text-indigo-600 transition-all">
              <Bell size={24}/>
              {notifications.length > 0 && <span className="absolute top-2 right-2 h-5 w-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">{notifications.length}</span>}
            </button>
          </div>
        </header>

        {activeView === 'roster' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
              {currentUser.role !== 'EMPLOYEE' && (
                <div className="relative md:col-span-2 lg:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Search Master Index</label>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" placeholder="Employee Name or Code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" />
                  </div>
                </div>
              )}
              <div className="col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Temporal Window</label>
                <select value={currentViewMonth} onChange={e => setCurrentViewMonth(e.target.value)} className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none cursor-pointer">
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {currentUser.role !== 'EMPLOYEE' && (
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Department (Designation)</label>
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none cursor-pointer">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b">
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                      <th className="px-12 py-10 text-left">Employee Identity</th>
                      <th className="px-12 py-10 text-center">Monthly Attendance</th>
                      <th className="px-12 py-10 text-left">Log Pattern</th>
                      <th className="px-6 py-10 text-right pr-12">Neural Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEmployees.map((emp) => {
                      const stats = getStats(emp, currentViewMonth);
                      return (
                        <React.Fragment key={emp.id}>
                          <tr className="hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => setSelectedEmployee(emp)}>
                            <td className="px-12 py-8">
                              <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 transition-all shadow-xl">{emp.name?.charAt(0) || '?'}</div>
                                <div>
                                  <p className="text-xl font-black text-slate-900 leading-tight mb-1">{emp.name || emp.id}</p>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{emp.id} • {emp.department}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-12 py-8 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                  <span className="block text-[8px] font-black text-emerald-500 uppercase">P</span>
                                  <span className="text-2xl font-black text-slate-900">{stats.present}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-100"></div>
                                <div className="text-center">
                                  <span className="block text-[8px] font-black text-rose-500 uppercase">A</span>
                                  <span className="text-2xl font-black text-slate-900">{stats.absent}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-100"></div>
                                <div className="text-center">
                                  <span className="block text-[8px] font-black text-amber-500 uppercase">W/O</span>
                                  <span className="text-2xl font-black text-slate-900">{stats.off}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-12 py-8 min-w-[500px]">
                              <DailyStatusRibbon emp={emp} data={emp.monthlyData[currentViewMonth] || []} />
                            </td>
                            <td className="px-6 py-8 text-right pr-12">
                              <div className="flex items-center justify-end gap-3">
                                {currentUser.role !== 'EMPLOYEE' && (
                                  <>
                                    <button 
                                      onClick={(e) => handleEdit(e, emp)}
                                      className="p-3 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                      title="Edit Records"
                                    >
                                      <Edit3 size={18}/>
                                    </button>
                                    <button 
                                      onClick={(e) => handleDelete(e, emp.id)}
                                      className="p-3 bg-rose-50 rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                      title="Delete Personnel"
                                    >
                                      <Trash2 size={18}/>
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={(e) => toggleExpand(e, emp.id)}
                                  className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                                >
                                  {expandedEmployeeId === emp.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedEmployeeId === emp.id && (
                            <tr className="bg-slate-50/30">
                              <td colSpan={4} className="px-12 py-10 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                  {/* Section 1: Identification */}
                                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-50 pb-3">
                                      <User size={18}/>
                                      <p className="text-[10px] font-black uppercase tracking-widest">Identification</p>
                                    </div>
                                    <div className="space-y-2.5">
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Father:</span> <span className="text-slate-900 font-black">{emp.details?.fatherName || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>D.O.B:</span> <span className="text-slate-900 font-black">{emp.details?.dob || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Gender:</span> <span className="text-slate-900 font-black">{emp.details?.gender || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Marital:</span> <span className="text-slate-900 font-black">{emp.details?.maritalStatus || 'N/A'}</span></p>
                                    </div>
                                  </div>

                                  {/* Section 2: Professional */}
                                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-600 border-b border-slate-50 pb-3">
                                      <ShieldCheck size={18}/>
                                      <p className="text-[10px] font-black uppercase tracking-widest">Professional</p>
                                    </div>
                                    <div className="space-y-2.5">
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Designation:</span> <span className="text-slate-900 font-black">{emp.details?.designation || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>D.O.J:</span> <span className="text-slate-900 font-black">{emp.details?.doj || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Status:</span> <span className={`${emp.details?.activeStatus === 'Active' ? 'text-emerald-500' : 'text-rose-500'} font-black`}>{emp.details?.activeStatus || 'Unknown'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Mail:</span> <span className="text-slate-900 font-black truncate ml-2">{emp.details?.mailId || 'N/A'}</span></p>
                                    </div>
                                  </div>

                                  {/* Section 3: Contact & Medical */}
                                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 text-rose-600 border-b border-slate-50 pb-3">
                                      <HeartPulse size={18}/>
                                      <p className="text-[10px] font-black uppercase tracking-widest">Contact & Health</p>
                                    </div>
                                    <div className="space-y-2.5">
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Phone:</span> <span className="text-slate-900 font-black">{emp.details?.contactNumber || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Blood Group:</span> <span className="text-slate-900 font-black">{emp.details?.bloodGroup || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Emergency:</span> <span className="text-slate-900 font-black">{emp.details?.emergencyContact || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>Relative:</span> <span className="text-slate-900 font-black">{emp.details?.emergencyContactPerson || 'N/A'}</span></p>
                                    </div>
                                  </div>

                                  {/* Section 4: Secure Data */}
                                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 text-amber-600 border-b border-slate-50 pb-3">
                                      <CreditCard size={18}/>
                                      <p className="text-[10px] font-black uppercase tracking-widest">Secure Credentials</p>
                                    </div>
                                    <div className="space-y-2.5">
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>AADHAR:</span> <span className="text-slate-900 font-black">{emp.details?.aadhar || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex justify-between"><span>PAN:</span> <span className="text-slate-900 font-black">{emp.details?.pan || 'N/A'}</span></p>
                                      <p className="text-xs font-bold text-slate-500 flex flex-col gap-1"><span>Address:</span> <span className="text-slate-900 font-black text-[10px] leading-relaxed italic">{emp.details?.address || 'N/A'}</span></p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col items-center text-center">
                 <div className="p-6 bg-emerald-100 text-emerald-600 rounded-[2rem] mb-6"><CheckCircle size={32}/></div>
                 <p className="text-5xl font-black text-slate-900 mb-2">{analyticsData.avgPresent}</p>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Avg Present Days / Emp</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col items-center text-center">
                 <div className="p-6 bg-rose-100 text-rose-600 rounded-[2rem] mb-6"><AlertCircle size={32}/></div>
                 <p className="text-5xl font-black text-slate-900 mb-2">{analyticsData.avgAbsent}</p>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Avg Absent Days / Emp</p>
              </div>
              <div className="bg-slate-900 p-10 rounded-[3rem] shadow-3xl flex flex-col items-center text-center text-white">
                 <div className="p-6 bg-white/10 text-indigo-400 rounded-[2rem] mb-6"><ShieldAlert size={32}/></div>
                 <p className="text-5xl font-black text-indigo-400 mb-2">{analyticsData.totalAnomalies}</p>
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Total Anomalies Detected</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col items-center text-center">
                 <div className="p-6 bg-indigo-100 text-indigo-600 rounded-[2rem] mb-6"><Users size={32}/></div>
                 <p className="text-5xl font-black text-slate-900 mb-2">{analyticsData.empCount}</p>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Active Dataset Employees</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-3xl min-h-[500px]">
                  <h4 className="text-xl font-black text-slate-900 mb-12 flex items-center gap-4 uppercase tracking-tighter">
                    <PieIcon size={24} className="text-indigo-600"/> Logistic Distribution (Absolute)
                  </h4>
                  <div className="h-[350px] w-full">
                    {analyticsData.pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analyticsData.pieData} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">
                            {analyticsData.pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs">No Data for this Period</div>
                    )}
                  </div>
               </div>

               <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-3xl min-h-[500px]">
                  <h4 className="text-xl font-black text-slate-900 mb-12 flex items-center gap-4 uppercase tracking-tighter">
                    <BarChart3 size={24} className="text-indigo-600"/> Dept Performance (Averages)
                  </h4>
                  <div className="h-[350px] w-full">
                    {analyticsData.barData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgPresent" name="Avg Present" fill="#10b981" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="avgAbsent" name="Avg Absent" fill="#f43f5e" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs">No Data for this Period</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {selectedEmployee && (
          <div className="fixed inset-0 z-[1200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-6xl h-full max-h-[92vh] rounded-[3rem] md:rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
              <div className="p-8 md:p-12 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 transform scale-150"><Fingerprint size={120}/></div>
                <div className="flex items-center gap-8 relative z-10">
                  <div className="h-24 w-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl">{selectedEmployee.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">{selectedEmployee.name}</h3>
                    <div className="flex flex-wrap gap-4">
                      <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">{selectedEmployee.id}</span>
                      <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedEmployee.department}</span>
                      <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">{selectedEmployee.details?.designation || 'Specialist'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                   {currentUser.role !== 'EMPLOYEE' && (
                     <>
                        <button 
                          onClick={(e) => handleEdit(e, selectedEmployee)}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                          <Edit3 size={16}/> Edit
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, selectedEmployee.id)}
                          className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-rose-500/20"
                        >
                          <Trash2 size={16}/> Delete
                        </button>
                     </>
                   )}
                   <button onClick={() => setSelectedEmployee(null)} className="p-4 bg-white/10 hover:bg-rose-500 rounded-full transition-all active:scale-90"><X size={32}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Neural Metrics</p>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-600">Compliance Score</span>
                          <span className="text-2xl font-black text-indigo-600">{selectedEmployee.complianceScore || 100}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${selectedEmployee.complianceScore || 100}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center p-4 bg-white rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Present</p>
                             <p className="text-xl font-black text-slate-900">{getStats(selectedEmployee, currentViewMonth).present}</p>
                          </div>
                          <div className="text-center p-4 bg-white rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black text-rose-500 uppercase mb-1">Absent</p>
                             <p className="text-xl font-black text-slate-900">{getStats(selectedEmployee, currentViewMonth).absent}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl">
                      <TrendingUp size={24} className="mb-4 opacity-50"/>
                      <h4 className="text-lg font-black tracking-tight mb-2">Pattern Prediction</h4>
                      <p className="text-xs font-medium text-indigo-100 leading-relaxed">System predicts high stability for the next 14 days based on current temporal alignment.</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="text-indigo-600" size={24}/>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Temporal Grid: {currentViewMonth}</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-[10px] font-black text-slate-400 text-center py-2">{d}</div>
                      ))}
                      {renderCalendarGrid(selectedEmployee, currentViewMonth)}
                    </div>
                    <div className="mt-8 flex gap-6">
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Present</div>
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-[#f43f5e]"></span> Absent</div>
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-[#fbbf24]"></span> Week Off</div>
                       <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-rose-600"></span> Anomaly</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingEmployee && (
          <div className="fixed inset-0 z-[1300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] md:rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
              <div className="p-8 md:p-10 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Edit3 size={24}/></div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Neural Editor</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Personnel Override Activated</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setEditingEmployee(null)} className="px-6 py-3 bg-white/10 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"><Save size={16}/> Commit Edits</button>
                </div>
              </div>

              <div className="flex border-b border-slate-100 shrink-0">
                <button 
                  onClick={() => setEditorTab('details')}
                  className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${editorTab === 'details' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Identity Configuration
                </button>
                <button 
                  onClick={() => setEditorTab('logs')}
                  className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${editorTab === 'logs' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Temporal Logs ({currentViewMonth})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                {editorTab === 'details' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Display Name</label>
                      <input 
                        type="text" 
                        value={editingEmployee.name} 
                        onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Neural ID (Primary Key)</label>
                      <input 
                        type="text" 
                        value={editingEmployee.id} 
                        readOnly
                        className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Designation (Dept.)</label>
                      <input 
                        type="text" 
                        value={editingEmployee.department} 
                        onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value, details: { ...editingEmployee.details, designation: e.target.value }})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Father Name</label>
                      <input 
                        type="text" 
                        value={editingEmployee.details?.fatherName || ''} 
                        onChange={(e) => setEditingEmployee({...editingEmployee, details: {...editingEmployee.details, fatherName: e.target.value}})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mobile Contact</label>
                      <input 
                        type="text" 
                        value={editingEmployee.details?.contactNumber || ''} 
                        onChange={(e) => setEditingEmployee({...editingEmployee, details: {...editingEmployee.details, contactNumber: e.target.value}})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">PAN Registry</label>
                      <input 
                        type="text" 
                        value={editingEmployee.details?.pan || ''} 
                        onChange={(e) => setEditingEmployee({...editingEmployee, details: {...editingEmployee.details, pan: e.target.value}})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="p-6 text-left">Day</th>
                          <th className="p-6 text-left">Log Status</th>
                          <th className="p-6 text-left">Shift</th>
                          <th className="p-6 text-left">In-Time</th>
                          <th className="p-6 text-left">Out-Time</th>
                          <th className="p-6 text-left">Total Dur.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm font-bold text-slate-700">
                        {Array.from({length: 31}, (_, i) => {
                          const day = i + 1;
                          const record = editingEmployee.monthlyData[currentViewMonth]?.find(r => r.day === day) || { day, status: 'Absent', shift: 'GS', totalDuration: '00:00', cycles: [] };
                          return (
                            <tr key={day} className="hover:bg-slate-50 transition-all">
                              <td className="p-4 pl-6 text-slate-400">{day}</td>
                              <td className="p-4">
                                <select 
                                  value={record.status} 
                                  onChange={(e) => updateLogRecord(day, 'status', e.target.value)}
                                  className="bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2"
                                >
                                  <option>Present</option>
                                  <option>Absent</option>
                                  <option>WeeklyOff</option>
                                  <option>Weekoff Present</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <input 
                                  type="text" 
                                  value={record.shift} 
                                  onChange={(e) => updateLogRecord(day, 'shift', e.target.value)}
                                  className="w-12 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                                />
                              </td>
                              <td className="p-4">
                                <input 
                                  type="text" 
                                  placeholder="00:00"
                                  value={record.cycles?.[0]?.in || ''} 
                                  onChange={(e) => {
                                    const cycles = [...(record.cycles || [])];
                                    if(cycles.length === 0) cycles.push({in: e.target.value, out: '', durationMinutes: 0});
                                    else cycles[0].in = e.target.value;
                                    updateLogRecord(day, 'cycles', cycles);
                                  }}
                                  className="w-16 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 font-mono"
                                />
                              </td>
                              <td className="p-4">
                                <input 
                                  type="text" 
                                  placeholder="00:00"
                                  value={record.cycles?.[0]?.out || ''} 
                                  onChange={(e) => {
                                    const cycles = [...(record.cycles || [])];
                                    if(cycles.length === 0) cycles.push({in: '', out: e.target.value, durationMinutes: 0});
                                    else cycles[0].out = e.target.value;
                                    updateLogRecord(day, 'cycles', cycles);
                                  }}
                                  className="w-16 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 font-mono"
                                />
                              </td>
                              <td className="p-4">
                                <input 
                                  type="text" 
                                  placeholder="00:00"
                                  value={record.totalDuration || ''} 
                                  onChange={(e) => updateLogRecord(day, 'totalDuration', e.target.value)}
                                  className="w-16 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 font-mono text-indigo-600"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-[1400] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in scale-95 duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center shadow-4xl border border-rose-100">
              <div className="h-20 w-20 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl">
                <ShieldAlert size={40}/>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Security Breach Warning</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">You are about to purge this personnel identity from the neural database. This action is irreversible.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Abort</button>
                <button onClick={confirmDelete} className="flex-1 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-200">Confirm Purge</button>
              </div>
            </div>
          </div>
        )}

        {showNotifications && (
          <div className="fixed top-24 md:top-36 right-4 md:right-12 w-[calc(100vw-32px)] md:w-96 bg-white rounded-[2.5rem] shadow-4xl border border-slate-100 z-[400] animate-in slide-in-from-right-4">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center rounded-t-[2.5rem]">
              <h5 className="font-black uppercase text-[10px] tracking-widest">Neural Breaches</h5>
              <div className="flex gap-4">
                {currentUser.role !== 'EMPLOYEE' && (
                  <button 
                    onClick={handleMarkAllRead} 
                    title="Resolve All Discrepancies"
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-emerald-400 flex items-center gap-1 active:scale-90"
                  >
                    <CheckCheck size={16}/>
                  </button>
                )}
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all"><X size={16}/></button>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-6">
                   <div className="p-6 bg-emerald-50 rounded-full text-emerald-500">
                     <CheckCircle size={48} />
                   </div>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Temporal Registry Clean.</p>
                </div>
              )}
              {notifications.map((n) => (
                <div key={n.key} className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-rose-200 text-rose-700 flex items-center justify-center rounded-xl shrink-0 font-black">{n.emp.name?.charAt(0) || '?'}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{n.emp.name || n.emp.id}</p>
                      <p className="text-[10px] text-rose-600 font-bold uppercase mt-1">Imperfect Cycle: {n.record.date}</p>
                    </div>
                  </div>
                  <button onClick={() => handleMarkRead(n.key, n.emp.id)} className="w-full py-3 bg-white border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">Mark as Resolved</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDayDetail && (
          <div className="fixed inset-0 z-[1500] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] md:rounded-[4rem] shadow-4xl overflow-hidden flex flex-col border border-white/20">
              <div className="p-8 md:p-12 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">{selectedDayDetail.emp.name.charAt(0)}</div>
                   <div>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">{selectedDayDetail.emp.name}</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-indigo-400">{selectedDayDetail.record.date} • {selectedDayDetail.record.status}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDayDetail(null)} className="p-4 md:p-6 bg-white/10 rounded-full hover:bg-rose-500 transition-all active:scale-90"><X size={32}/></button>
              </div>
              <div className="p-8 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-emerald-50 p-6 md:p-10 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6 md:gap-8 shadow-sm">
                    <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600"><Clock size={32}/></div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Total Stayed In</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900">{formatMins(selectedDayDetail.record.totalStayedInMinutes)}</p>
                    </div>
                  </div>
                  <div className="bg-rose-50 p-6 md:p-10 rounded-[2.5rem] border border-rose-100 flex items-center gap-6 md:gap-8 shadow-sm">
                    <div className="p-4 bg-rose-100 rounded-2xl text-rose-600"><AlertCircle size={32}/></div>
                    <div>
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Total Break Time</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900">{formatMins(selectedDayDetail.record.totalBreakMinutes)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={64}/></div>
                   <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4">Neural Punch Stream (Raw Logs)</p>
                     <p className="font-mono text-indigo-400 text-lg md:text-xl leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                        {selectedDayDetail.record.punchRecRaw || 'NO RAW LOG DATA RECORDED'}
                     </p>
                   </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Validated Punch Intervals</p>
                  {selectedDayDetail.record.cycles.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No valid punch intervals detected for this temporal node.</p>
                    </div>
                  ) : (
                    selectedDayDetail.record.cycles.map((cycle, i) => (
                      <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                        <div className="flex gap-12 md:gap-20">
                          <div className="text-center group-hover:scale-110 transition-transform">
                            <LogIn size={20} className="text-emerald-500 mb-2 mx-auto"/>
                            <span className="text-xl md:text-2xl font-black text-slate-800">{cycle.in}</span>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Check In</p>
                          </div>
                          <div className="text-center group-hover:scale-110 transition-transform">
                            <LogOut size={20} className="text-rose-500 mb-2 mx-auto"/>
                            <span className="text-xl md:text-2xl font-black text-slate-800">{cycle.out || '--:--'}</span>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Check Out</p>
                          </div>
                        </div>
                        <div className="text-right px-8 py-4 bg-indigo-50 rounded-3xl border border-indigo-100/50 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1 group-hover:text-white/60">Duration</p>
                          <p className="text-2xl md:text-3xl font-black text-indigo-600 group-hover:text-white">{formatMins(cycle.durationMinutes)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
