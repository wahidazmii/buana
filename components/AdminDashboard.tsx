import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Candidate, JobPosition } from '../types';

interface AdminDashboardProps {
  candidates: Candidate[];
  positions: JobPosition[];
}

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1'];
const STATUS_COLORS = { pass: '#10B981', fail: '#F43F5E' };

const AdminDashboard: React.FC<AdminDashboardProps> = ({ candidates, positions }) => {
  
  // --- DATA AGGREGATION ---

  const totalCandidates = candidates.length;
  const completedTests = candidates.filter(c => c.status === 'COMPLETED').length;
  const activePositionsCount = positions.filter(p => p.isActive).length;
  const totalDepartments = new Set(positions.map(p => p.department)).size;

  // Assuming Recommendation logic
  const passedCount = candidates.filter(c => 
    c.results?.recommendation === 'Highly Recommended' || 
    c.results?.recommendation === 'Recommended'
  ).length;
  const failedCount = completedTests - passedCount;

  // Monthly Trend Mockup Data (Augmented with current data)
  const monthlyData = [
    { name: 'Jan', total: 40, passed: 24 },
    { name: 'Feb', total: 30, passed: 13 },
    { name: 'Mar', total: 20, passed: 18 },
    { name: 'Apr', total: 27, passed: 19 },
    { name: 'Mei', total: 18, passed: 8 },
    { name: 'Jun', total: 23, passed: 13 },
    { name: 'Jul', total: totalCandidates, passed: passedCount },
  ];

  // Department Distribution
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    positions.forEach(p => {
        counts[p.department] = (counts[p.department] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [positions]);

  // Pass Ratio
  const passRatioData = [
    { name: 'Recommended', value: passedCount || 1 },
    { name: 'Needs Review', value: failedCount || 1 }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none">Executive<br/><span className="text-emerald-500 text-3xl">Dashboard</span></h2>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Recruitment Analytics & Talent Insights</p>
        </div>
        <div className="flex gap-3">
           <button className="px-8 py-4 bg-white text-slate-600 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all border border-slate-100 flex items-center gap-2">
              <span className="text-lg">📊</span> Export PDF
           </button>
           <button className="px-8 py-4 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2">
              <span className="text-lg">🔄</span> Sync Data
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl text-xl shadow-inner">👥</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicants</span>
               </div>
               <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{totalCandidates}</h3>
               <p className="text-[10px] font-bold text-emerald-500 mt-4 flex items-center gap-1 uppercase tracking-wider">
                  <span>▲ 12%</span> <span className="text-slate-300">from last month</span>
               </p>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl text-xl shadow-inner">🎓</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passed</span>
               </div>
               <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{passedCount}</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1 uppercase tracking-wider">
                  Quality Ratio: <span className="text-emerald-500">{((passedCount / (completedTests || 1)) * 100).toFixed(0)}%</span>
               </p>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl text-xl shadow-inner">💼</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Slots</span>
               </div>
               <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{activePositionsCount}</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1 uppercase tracking-wider">
                  Active in <span className="text-slate-800">{totalDepartments}</span> Depts
               </p>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-2xl text-xl shadow-inner">⏳</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
               </div>
               <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{totalCandidates - completedTests}</h3>
               <p className="text-[10px] font-bold text-rose-500 mt-4 uppercase tracking-wider">Requires Attention</p>
            </div>
         </div>
      </div>

      {/* TREND ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Recruitment Funnel</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Total Participants vs Selection Rate</p>
               </div>
               <select className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 text-[10px] font-black text-slate-600 outline-none uppercase tracking-widest">
                  <option>Last 6 Months</option>
                  <option>Current Year</option>
               </select>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                           <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={15} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                     <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px'}} 
                        itemStyle={{fontWeight: '900', fontSize: '12px', textTransform: 'uppercase'}}
                     />
                     <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="5 5" />
                     <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={5} fillOpacity={1} fill="url(#colorTotal)" name="Total Applicants" />
                     <Area type="monotone" dataKey="passed" stroke="#10B981" strokeWidth={5} fillOpacity={1} fill="url(#colorPass)" name="Selection OK" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-12 rounded-[4rem] shadow-xl shadow-slate-200/40 border border-slate-50 flex flex-col">
            <div className="mb-8">
               <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Talent Quality</h4>
               <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Recommended Ratio</p>
            </div>
            <div className="flex-1 min-h-[300px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={passRatioData}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={8}
                        dataKey="value"
                        cornerRadius={15}
                     >
                        <Cell key="cell-0" fill={STATUS_COLORS.pass} />
                        <Cell key="cell-1" fill={STATUS_COLORS.fail} />
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-20">
                  <span className="text-5xl font-black text-slate-800 tracking-tighter">{passedCount}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Verified Talents</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="bg-white p-12 rounded-[4rem] shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="mb-8">
               <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dept. Mapping</h4>
               <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Distribution of Roles</p>
            </div>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} layout="vertical" barSize={12}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase'}} />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px'}} />
                     <Bar dataKey="value" fill="#10B981" radius={[0, 10, 10, 0]} background={{ fill: '#f8fafc', radius: [0, 10, 10, 0] }} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-125 duration-1000"></div>
             
             <div className="flex justify-between items-center mb-10 relative z-10">
               <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Priority Openings</h4>
                  <p className="text-[10px] font-bold text-emerald-500/60 mt-2 uppercase tracking-widest">High-Demand Job Slots</p>
               </div>
               <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:bg-white/10 transition-all">Manage Roles →</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {positions.filter(p => p.isActive).slice(0, 3).map((pos, idx) => (
                   <div key={pos.id} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/[0.08] transition-all group/item">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black mb-6 group-hover/item:scale-110 transition-transform">
                         {idx + 1}
                      </div>
                      <h5 className="font-black text-lg text-white leading-tight mb-2 truncate uppercase tracking-tighter">{pos.title}</h5>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">{pos.department}</p>
                      
                      <div className="flex justify-between items-end border-t border-white/5 pt-6">
                         <div>
                            <p className="text-2xl font-black text-white leading-none">{pos.applicantCount || 0}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-black mt-2 tracking-widest">Total Applicants</p>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                   </div>
                ))}
                {positions.filter(p => p.isActive).length === 0 && (
                   <div className="col-span-3 py-10 text-slate-500 text-center text-xs font-black uppercase tracking-widest">No Priority Positions Active</div>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;