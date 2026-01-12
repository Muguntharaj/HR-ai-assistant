
import React, { useState, useEffect, useCallback } from 'react';
import { processAttendanceData, processPersonalData, enrichWithML } from './data';
import { SHARED_NETWORK_DATA } from './shared_data/repository';
import { ChatSession, ChatMessage, Employee, AuthUser } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';
import { ShieldCheck, X, FileCheck, Database } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [confirmUpload, setConfirmUpload] = useState<{ files: File[], category: 'attendance' | 'details' } | null>(null);

  // Initialize data
  useEffect(() => {
    const savedSessions = localStorage.getItem('hr_ai_sessions_v5');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    }
    
    const savedUser = localStorage.getItem('hr_ai_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedEmployees = localStorage.getItem('hr_ai_employees_v8');
    const savedDeletedIds = localStorage.getItem('hr_ai_deleted_ids_v1');
    
    let baseEmployees: Employee[] = [];
    let deletedIds: string[] = [];

    if (savedEmployees) baseEmployees = JSON.parse(savedEmployees);
    if (savedDeletedIds) deletedIds = JSON.parse(savedDeletedIds);

    const employeesMap = new Map<string, Employee>();
    baseEmployees.forEach(e => employeesMap.set(e.id, e));
    
    // Merge shared data only if not explicitly deleted
    SHARED_NETWORK_DATA.forEach(netEmp => {
      if (deletedIds.includes(netEmp.id)) return;

      const existing = employeesMap.get(netEmp.id);
      if (existing) {
        employeesMap.set(netEmp.id, { 
          ...existing, 
          ...netEmp, 
          monthlyData: { ...existing.monthlyData, ...netEmp.monthlyData },
          details: { ...existing.details, ...netEmp.details }
        });
      } else {
        employeesMap.set(netEmp.id, netEmp);
      }
    });

    setEmployees(enrichWithML(Array.from(employeesMap.values())));
  }, []);

  // Persist State
  useEffect(() => {
    localStorage.setItem('hr_ai_sessions_v5', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('hr_ai_employees_v8', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (user) localStorage.setItem('hr_ai_user', JSON.stringify(user));
    else localStorage.removeItem('hr_ai_user');
  }, [user]);

  const handleSyncToCloud = useCallback(async (currentEmployees: Employee[]) => {
    const updatedRepoCode = `
import { Employee } from '../types';

export const SHARED_NETWORK_DATA: Employee[] = ${JSON.stringify(currentEmployees, null, 2)};
    `;
    
    try {
      await navigator.clipboard.writeText(updatedRepoCode);
      console.log("Automatic Neural cloud update triggered.");
      setIsDirty(false);
    } catch (err) {
      console.warn("Clipboard access restricted. Use 'Sync' button in sidebar.", err);
    }
  }, []);

  const executeFileUpload = async (files: File[], category: 'attendance' | 'details') => {
    setIsProcessing(true);
    setConfirmUpload(null);
    try {
      let finalEmployees = [...employees];

      for (const file of files) {
        if (category === 'details') {
          const partials = await processPersonalData(file);
          const updatedMap = new Map<string, Employee>();
          finalEmployees.forEach(e => updatedMap.set(e.id, JSON.parse(JSON.stringify(e))));
          
          partials.forEach(p => {
            if (!p.id) return;
            let existing = updatedMap.get(p.id);
            if (!existing && p.name) {
              existing = Array.from(updatedMap.values()).find(e => e.name.toLowerCase() === p.name!.toLowerCase());
            }

            if (existing) {
              const mergedDetails = { ...(existing.details || {}) };
              if (p.details) {
                Object.entries(p.details).forEach(([key, val]) => {
                  const sVal = String(val || '').trim();
                  if (sVal !== '' && sVal.toUpperCase() !== 'N/A' && sVal.toLowerCase() !== 'null') {
                    (mergedDetails as any)[key] = sVal;
                  }
                });
              }

              const updatedEmp = { 
                ...existing, 
                name: (p.name && p.name !== '' && p.name.toUpperCase() !== 'N/A') ? p.name : existing.name,
                department: (p.department && p.department !== 'General') ? p.department : (existing.department || 'General'),
                company: (p.company && p.company !== 'Corporate') ? p.company : (existing.company || 'Corporate'),
                details: mergedDetails
              };
              updatedMap.set(existing.id, updatedEmp);
            } else {
              updatedMap.set(p.id, { ...p, monthlyData: {} } as Employee);
            }
          });
          finalEmployees = Array.from(updatedMap.values());
        } else {
          finalEmployees = await processAttendanceData(file, finalEmployees);
        }
      }
      
      const enriched = enrichWithML(finalEmployees);
      setEmployees(enriched);
      setIsDirty(true);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      alert('Neural sync interrupted. Check Excel headers.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => {
      const exists = prev.some(e => e.id === updatedEmp.id);
      let newList;
      if (exists) {
        newList = prev.map(e => e.id === updatedEmp.id ? updatedEmp : e);
      } else {
        newList = [...prev, updatedEmp];
      }
      return enrichWithML(newList);
    });
    setIsDirty(true);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return enrichWithML(filtered);
    });
    
    // Add to deleted registry to prevent shared repo from resurrecting it
    const savedDeletedIds = localStorage.getItem('hr_ai_deleted_ids_v1');
    const deletedIds: string[] = savedDeletedIds ? JSON.parse(savedDeletedIds) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('hr_ai_deleted_ids_v1', JSON.stringify(deletedIds));
    }

    setIsDirty(true);
  };

  const handleSendMessage = (content: string, response: string, chart?: any) => {
    const newSessionId = activeSessionId || Date.now().toString();
    const isNew = !activeSessionId;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    const assistantMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: Date.now() + 50,
      chartData: chart?.data, chartType: chart?.type
    };

    if (isNew) {
      const newSession: ChatSession = { id: newSessionId, title: content.slice(0, 30), messages: [userMsg, assistantMsg], updatedAt: Date.now() };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSessionId);
    } else {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg, assistantMsg], updatedAt: Date.now() } : s));
    }
  };

  if (!user) return <Login onLogin={setUser} employees={employees} />;
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans">
      {isProcessing && (
        <div className="absolute inset-0 z-[500] bg-slate-900/70 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-12 rounded-[4rem] shadow-3xl flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <div className="text-center">
              <p className="font-black text-slate-800 text-3xl tracking-tight">Updating Repository</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Persisting Neural Records...</p>
            </div>
          </div>
        </div>
      )}

      {confirmUpload && (
        <div className="absolute inset-0 z-[450] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-4xl border border-white/20 overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl"><ShieldCheck size={24}/></div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">Neural Sync Request</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Validation Protocol Active</p>
                </div>
              </div>
              <button onClick={() => setConfirmUpload(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400"><X size={24}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="flex flex-col items-center text-center gap-6">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                   <FileCheck size={48} className="text-indigo-600 mb-4 mx-auto"/>
                   <div className="max-h-32 overflow-y-auto px-4 w-full">
                     {confirmUpload.files.map(f => (
                       <p key={f.name} className="text-sm font-black text-slate-900 truncate mb-1">{f.name}</p>
                     ))}
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{confirmUpload.category === 'attendance' ? 'Attendance Logs' : 'Personnel Registry'}</p>
                 </div>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">System has detected {confirmUpload.files.length} data stream(s). Confirming will bind these records to the master neural index.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfirmUpload(null)} 
                  className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeFileUpload(confirmUpload.files, confirmUpload.category)} 
                  className="py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Database size={16}/>
                  Confirm Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onNewChat={() => { setActiveSessionId(null); setActiveTab('chat'); }} 
        onLogout={() => setUser(null)} 
        onFileUpload={(files, cat) => setConfirmUpload({ files, category: cat })} 
        onSync={() => handleSyncToCloud(employees)}
        isDirty={isDirty}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={user} 
        employees={employees}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'chat' ? (
          <ChatWindow activeSessionMessages={activeSession?.messages || []} onSendMessage={handleSendMessage} employees={employees} currentUser={user} />
        ) : (
          <Dashboard 
            employees={employees} 
            setEmployees={setEmployees} 
            currentUser={user} 
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
      </main>
    </div>
  );
};

export default App;
