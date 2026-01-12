
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BarChart3, Sparkles, Download, ArrowUpRight, Maximize2 } from 'lucide-react';
import { ChatMessage, Employee, AuthUser } from '../types';
import { getChatResponse } from '../services/aiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, ComposedChart, Area, Legend
} from 'recharts';

interface ChatWindowProps {
  activeSessionMessages: ChatMessage[];
  onSendMessage: (message: string, response: string, chart?: any) => void;
  employees: Employee[];
  currentUser: AuthUser;
}

// Expanded vibrant color palette
const VIBRANT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#d946ef',
  '#0ea5e9', '#84cc16', '#fbbf24', '#f43f5e', '#6d28d9'
];

const ChatWindow: React.FC<ChatWindowProps> = ({ activeSessionMessages, onSendMessage, employees, currentUser }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSessionMessages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = textToSend;
    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      const { text, chart } = await getChatResponse(userMessage, activeSessionMessages, employees, currentUser);
      onSendMessage(userMessage, text, chart);
    } catch (err) {
      console.error(err);
      onSendMessage(userMessage, "Sorry, I encountered an error while processing your request.");
    } finally {
      setIsTyping(false);
    }
  };

  const renderChart = (chart: any) => {
    if (!chart || !chart.data) return null;

    return (
      <div className="mt-4 p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl w-full h-[400px] group relative overflow-hidden transition-all hover:shadow-2xl hover:border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <BarChart3 size={18} className="text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 text-xs font-black uppercase tracking-wider">AI Insight Engine</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{chart.type} Analysis</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Download size={16} />
            </button>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="80%">
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie 
                data={chart.data} 
                cx="50%" cy="50%" 
                innerRadius={70} 
                outerRadius={100} 
                paddingAngle={8} 
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
              >
                {chart.data.map((_: any, idx: number) => <Cell key={`c-${idx}`} fill={VIBRANT_COLORS[idx % VIBRANT_COLORS.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          ) : chart.type === 'radar' ? (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.5} 
                animationDuration={1500}
              />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          ) : chart.type === 'scatter' ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" dataKey="value" name="Risk" unit="%" axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="y" name="Compliance" unit="%" axisLine={false} tickLine={false} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} name="Anomalies" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
              <Scatter name="Employees" data={chart.data} fill="#6366f1" animationDuration={1500} />
            </ScatterChart>
          ) : chart.type === 'composed' ? (
            <ComposedChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
              <Bar dataKey="value" barSize={20} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="goal" stroke="#f59e0b" strokeWidth={3} dot={false} />
              <Area type="monotone" dataKey="value" fill="#6366f1" fillOpacity={0.05} stroke="none" />
            </ComposedChart>
          ) : chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                strokeWidth={5} 
                dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} 
                activeDot={{ r: 8 }} 
                animationDuration={1500}
              />
            </LineChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
              <Bar 
                dataKey="value" 
                fill="#6366f1" 
                radius={[8, 8, 0, 0]} 
                animationDuration={1500}
              >
                {chart.data.map((_: any, idx: number) => <Cell key={`c-${idx}`} fill={VIBRANT_COLORS[idx % VIBRANT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black mt-6 mb-3 text-slate-900 border-l-4 border-indigo-600 pl-3">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black mt-8 mb-4 text-slate-900">{line.replace('## ', '')}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-3 text-indigo-700">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc text-slate-700 mb-2 font-medium">{line.replace('- ', '')}</li>;
      return <p key={i} className="mb-3 text-slate-600 leading-relaxed font-medium">{line}</p>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <header className="bg-white/80 border-b px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-sm tracking-tight">Predictive HR Intelligence</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Neural Network Online
            </p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-12 scroll-smooth">
        {activeSessionMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-16">
            <div className="bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 p-7 rounded-[3rem] mb-10 shadow-3xl shadow-indigo-200 animate-bounce-slow">
              <Bot size={56} className="text-white" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Quantum Attendance <br/>Analytics & Prediction</h3>
            <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed">Analyzing 30-day temporal patterns and risk correlations. Query the neural personnel database below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {[
                "Radar profile of Sales performance",
                "Scatter plot: Risk vs Absences",
                "Attrition forecast for next 14 days",
                "Anomalous check-in distribution"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(undefined, suggestion)}
                  className="group p-5 text-sm font-black text-slate-600 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-left shadow-sm flex items-center justify-between active:scale-95"
                >
                  <span>"{suggestion}"</span>
                  <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSessionMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex gap-5 max-w-[92%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-100 text-indigo-600'
              }`}>
                {msg.role === 'user' ? <User size={24} /> : <Sparkles size={24} />}
              </div>
              <div className="flex flex-col gap-3">
                <div className={`p-7 rounded-[2.5rem] shadow-xl text-base ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none ring-4 ring-slate-50'
                }`}>
                  {msg.role === 'user' ? <span className="font-bold">{msg.content}</span> : formatText(msg.content)}
                </div>
                {msg.role === 'model' && msg.chartData && renderChart({ type: msg.chartType, data: msg.chartData })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-5">
              <div className="h-12 w-12 rounded-2xl bg-white border-2 border-indigo-50 text-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
                <Bot size={24} />
              </div>
              <div className="bg-white border border-slate-100 px-8 py-5 rounded-[2rem] rounded-tl-none shadow-xl flex items-center gap-4">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Processing Statistical Model</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-5xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query predictive analytics..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 pr-20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all text-sm font-bold shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`absolute right-4 p-4 rounded-2xl transition-all shadow-xl transform active:scale-90 ${
              input.trim() && !isTyping ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={22} />
          </button>
        </form>
        <div className="flex justify-center items-center gap-6 mt-4">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encryption</span>
           <span className="h-1 w-1 rounded-full bg-slate-200"></span>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ML Diagnostic Version 4.2</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
