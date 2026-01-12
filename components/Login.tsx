
import React, { useState } from 'react';
import { Lock, User, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthUser, Employee } from '../types';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
  employees: Employee[];
}

const Login: React.FC<LoginProps> = ({ onLogin, employees }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const upperUser = username.toUpperCase();
    
    // Admin check
    if ((upperUser === 'HR' || upperUser === 'MD') && password === '1234') {
      onLogin({ role: 'ADMIN', name: upperUser });
      return;
    }

    // Employee check
    const emp = employees.find(e => 
      e.name.toLowerCase() === username.toLowerCase() && 
      e.id === password.toUpperCase()
    );

    if (emp) {
      onLogin({ role: 'EMPLOYEE', employeeId: emp.id, name: emp.name });
    } else {
      setError('Neural recognition failed. Use Full Name as login and Employee ID as password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-[4rem] shadow-4xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-700">
          <div className="p-16 text-center bg-slate-50/50">
            <div className="h-24 w-24 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-100 rotate-3">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Access Node</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleSubmit} className="p-16 space-y-8">
            <div className="space-y-6">
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Full Identity Name" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password" 
                  placeholder="Employee Access Code" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-4 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={18}/> {error}
              </div>
            )}

            <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95">
              <span>Initialize System</span>
              <ChevronRight size={18}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
