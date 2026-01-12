
import React, { useRef, useState } from 'react';
import { ChatSession, AuthUser, Employee } from '../types';
import { exportEmployeesToExcel } from '../data';
import { 
  MessageSquare, BarChart2, History, Plus, LogOut, 
  FileSpreadsheet, FolderOpen, Shield, HardDrive, Cloud, Menu, X, RefreshCcw, Download
} from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onFileUpload: (files: File[], category: 'attendance' | 'details') => void;
  onSync: () => void;
  isDirty: boolean;
  activeTab: 'chat' | 'dashboard';
  setActiveTab: (tab: 'chat' | 'dashboard') => void;
  currentUser: AuthUser;
  employees: Employee[]; // Passed down to handle export
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onLogout,
  onFileUpload,
  onSync,
  isDirty,
  activeTab,
  setActiveTab,
  currentUser,
  employees
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<'attendance' | 'details'>('attendance');
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerUpload = (category: 'attendance' | 'details') => {
    setUploadCategory(category);
    fileInputRef.current?.click();
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(Array.from(files), uploadCategory);
      e.target.value = ''; 
    }
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onSync();
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const handleNav = (tab: 'chat' | 'dashboard') => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const handleSession = (id: string) => {
    onSelectSession(id);
    setActiveTab('chat');
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const handleExport = () => {
    exportEmployeesToExcel(employees);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 right-6 z-[300] p-4 bg-slate-900 text-white rounded-2xl shadow-2xl active:scale-90 transition-transform"
      >
        {isOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[250] animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed lg:relative z-[260] lg:z-auto
        w-80 bg-slate-900 h-screen text-white flex flex-col p-6 shadow-2xl border-r border-slate-800 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-hidden
      `}>
        {/* Brand Section */}
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl">
            <Cloud size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter italic">NEURAL CLOUD</h1>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em]">Shared Folder Active</p>
          </div>
        </div>

        <div className="mb-6 px-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <HardDrive size={20} className="text-emerald-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse border border-slate-900"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live Sync</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Network Active</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => { onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 transition-all w-full p-4 rounded-2xl font-bold shadow-xl active:scale-95 mb-6"
        >
          <Plus size={18} />
          <span className="text-sm">Ask AI Help</span>
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-8">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeTab === 'dashboard' ? 'bg-slate-800 text-indigo-400 font-bold' : 'hover:bg-slate-800/50 text-slate-500 font-bold'
              }`}
            >
              <BarChart2 size={18} />
              <span className="text-sm">View Work Board</span>
            </button>
            <button
              onClick={() => handleNav('chat')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                activeTab === 'chat' ? 'bg-slate-800 text-indigo-400 font-bold' : 'hover:bg-slate-800/50 text-slate-500 font-bold'
              }`}
            >
              <MessageSquare size={18} />
              <span className="text-sm">AI Chat Help</span>
            </button>
          </nav>

          {currentUser.role !== 'EMPLOYEE' && (
            <div>
              <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-2">
                <Shield size={14} />
                <span>Cloud Management</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => triggerUpload('attendance')}
                  className="flex items-center gap-4 bg-slate-800/30 hover:bg-slate-800 border border-slate-700/50 p-4 rounded-2xl transition-all"
                >
                  <FileSpreadsheet size={18} className="text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-slate-200 uppercase truncate">Attendance Log</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Select Excel(s)</p>
                  </div>
                </button>
                <button
                  onClick={() => triggerUpload('details')}
                  className="flex items-center gap-4 bg-slate-800/30 hover:bg-slate-800 border border-slate-700/50 p-4 rounded-2xl transition-all"
                >
                  <FolderOpen size={18} className="text-emerald-400" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-slate-200 uppercase truncate">Personnel Data</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Select Excel(s)</p>
                  </div>
                </button>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-4 bg-slate-800/10 hover:bg-slate-800 border border-slate-700/30 p-4 rounded-2xl transition-all"
                >
                  <Download size={18} className="text-amber-400" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-slate-200 uppercase truncate">Export Snapshot</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Download current state</p>
                  </div>
                </button>
                
                {/* Sync Button */}
                <button
                  onClick={handleSyncClick}
                  disabled={!isDirty || isSyncing}
                  className={`mt-2 flex items-center gap-4 p-4 rounded-2xl transition-all border group relative overflow-hidden ${
                    isDirty 
                    ? 'bg-indigo-600/10 border-indigo-500/50 hover:bg-indigo-600/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-800/10 border-slate-700/30 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <RefreshCcw size={18} className={`${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-tight">Sync to Master</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest">{isDirty ? 'Pending Changes' : 'Cloud Updated'}</p>
                  </div>
                  {isDirty && !isSyncing && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-indigo-50 rounded-full animate-ping"></span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-2">
              <History size={14} />
              <span>AI Chat Logs</span>
            </div>
            <div className="flex flex-col gap-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSession(session.id)}
                  className={`text-left p-3 rounded-xl text-xs font-bold truncate transition-all ${
                    activeSessionId === session.id
                      ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30'
                      : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  {session.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileChange}
        />

        <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-6">
          <div className="flex items-center gap-4 px-2">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black border border-indigo-500/20 shadow-lg shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-white uppercase tracking-wider">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 text-slate-600 hover:text-rose-400 transition-all w-full p-2 text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Exit System</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
