
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Candidate, UserRole, TestType, JobPosition, TestModule } from './types';
import { DISC_QUESTIONS } from './constants';
import { calculateDiscScore, calculateIshiharaScore } from './services/scoringService';
import ReportView from './components/ReportView';
import PositionManagement from './components/PositionManagement';
import TestManagement from './components/TestManagement';
import KraepelinTest from './components/KraepelinTest';
import IshiharaTest from './components/IshiharaTest';
import TokenRegistry from './components/TokenRegistry';

const BUANA_GREEN = '#10B981';
const DARK_EMERALD = '#064e3b';
const SOFT_BG = '#F3F4F6';

const CHART_COLORS = [BUANA_GREEN, '#34D399', '#D1FAE5', '#F59E0B', '#EF4444'];

const BuanaLogo: React.FC<{ className?: string; color?: string; inverse?: boolean }> = ({ className = "h-8", color = BUANA_GREEN, inverse = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center relative shadow-sm overflow-hidden ${inverse ? 'bg-white' : ''}`} style={{ backgroundColor: inverse ? 'white' : color }}>
      <div className={`w-5 h-5 rounded-tr-full transform -rotate-45 translate-y-1 ${inverse ? '' : 'bg-white'}`} style={{ backgroundColor: inverse ? color : 'white' }}></div>
    </div>
    <div className="flex flex-col -space-y-1">
      <span className="font-black tracking-tighter text-xl uppercase leading-none" style={{ color: inverse ? '#fff' : DARK_EMERALD }}>PT. BUANA MEGAH</span>
      <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: inverse ? '#fff' : '#94A3B8' }}>Paper Mills Pasuruan</span>
    </div>
  </div>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
  const styles = { success: 'bg-emerald-600 border-emerald-400', error: 'bg-rose-600 border-rose-400', info: 'bg-blue-500 border-blue-300' };
  return (
    <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl border-2 animate-in slide-in-from-right duration-300 ${styles[type]}`}>
      <span className="font-black text-xs uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="hover:opacity-50 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [activeTestModule, setActiveTestModule] = useState<TestModule | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'monitoring' | 'positions' | 'test_management' | 'candidates'>('dashboard');
  const [loginContext, setLoginContext] = useState<'CANDIDATE' | 'ADMIN'>('CANDIDATE');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [discAnswers, setDiscAnswers] = useState<{ id: number; most: number; least: number }[]>([]);
  const [currentDiscIndex, setCurrentDiscIndex] = useState(0);

  const [testModules, setTestModules] = useState<TestModule[]>([
    { id: 'tm_ishihara', title: 'Ishihara Color Vision', type: TestType.ISHIHARA, isActive: true, questionCount: 14, config: {}, questions: Array.from({ length: 14 }, (_, i) => ({ id: `plate-${i+1}`, text: `https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?q=80&w=200&auto=format&fit=crop`, options: [], correctOptionId: '12' })) },
    { id: 'tm_disc', title: 'DISC Gaya Kerja', type: TestType.DISC, isActive: true, questionCount: 24, config: { durationSeconds: 900 } },
    { id: 'tm_kraepelin', title: 'Kraepelin Speed Test', type: TestType.KRAEPELIN, isActive: true, questionCount: 0, config: { timerPerLine: 15, totalLines: 40, digitsPerLine: 45, direction: 'DOWN_TO_UP' } },
  ]);

  const [jobPositions, setJobPositions] = useState<JobPosition[]>([
    { id: 'pos1', title: 'Machine Operator', department: 'Production', isActive: true, applicantCount: 15, testIds: ['tm_ishihara', 'tm_disc', 'tm_kraepelin'] },
    { id: 'pos2', title: 'HR Generalist', department: 'HR & GA', isActive: true, applicantCount: 42, testIds: ['tm_disc'] },
  ]);

  const [allCandidates, setAllCandidates] = useState<Candidate[]>([
    { id: 'BM-2026-001', name: 'Budi Santoso', status: 'COMPLETED', package: ['tm_ishihara', 'tm_disc', 'tm_kraepelin'], currentTestIndex: 3, appliedPosition: 'Machine Operator', education: 'SMK Teknik', age: 24, whatsapp: '628123456789', address: 'Jl. Raya Beji, Pasuruan', results: { recommendation: 'Highly Recommended' } as any },
    { id: 'BM-2026-002', name: 'Siti Aminah', status: 'COMPLETED', package: ['tm_disc'], currentTestIndex: 1, appliedPosition: 'HR Generalist', education: 'S1 Psikologi', age: 26, whatsapp: '6287711223344', address: 'Kota Surabaya', results: { recommendation: 'Recommended' } as any },
  ]);

  const stats = useMemo(() => ({ total: allCandidates.length, completed: allCandidates.filter(c => c.status === 'COMPLETED').length, activePositions: jobPositions.filter(p => p.isActive).length, avgScore: 78 }), [allCandidates, jobPositions]);
  const monthlyTrends = [{ name: 'Jan', count: 45 }, { name: 'Feb', count: 52 }, { name: 'Mar', count: 38 }, { name: 'Apr', count: 65 }, { name: 'Mei', count: 82 }, { name: 'Jun', count: 95 }];
  const qualityDistribution = useMemo(() => [{ name: 'Highly Recommended', value: allCandidates.filter(c => c.results?.recommendation === 'Highly Recommended').length }, { name: 'Recommended', value: allCandidates.filter(c => c.results?.recommendation === 'Recommended').length }, { name: 'Consider', value: 1 }, { name: 'Not Recommended', value: 0 }], [allCandidates]);
  const [registration, setRegistration] = useState({ name: '', whatsapp: '', dob: '', education: '', address: '', appliedPositionId: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });
  const handleLogout = () => { setRole(null); setCandidate(null); setActiveTestModule(null); setLoginContext('CANDIDATE'); showToast('Sesi Berakhir', 'info'); };
  const handleAdminLogin = () => { setRole(UserRole.ADMIN); showToast('Selamat Datang Administrator.', 'success'); };

  const startNextTest = (currentCandidate: Candidate) => {
    const nextIndex = currentCandidate.currentTestIndex;
    const nextModuleId = currentCandidate.package[nextIndex];
    if (nextModuleId) {
      const module = testModules.find(m => m.id === nextModuleId);
      if (module) { setActiveTestModule(module); return; }
    }
    const finalCandidate: Candidate = { ...currentCandidate, status: 'COMPLETED' };
    setCandidate(finalCandidate);
    setAllCandidates(prev => prev.map(c => c.id === finalCandidate.id ? finalCandidate : c));
    setActiveTestModule(null);
    showToast("Asesmen Selesai.", "success");
  };

  const handleRegisterAndStart = () => {
    const pos = jobPositions.find(p => p.id === registration.appliedPositionId);
    if (!registration.name || !registration.whatsapp || !registration.address || !pos) { showToast("Data belum lengkap.", "error"); return; }
    const newCandidate: Candidate = { id: `BM-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, ...registration, age: 25, appliedPosition: pos.title, status: 'IN_PROGRESS', package: pos.testIds, currentTestIndex: 0 };
    setAllCandidates(prev => [...prev, newCandidate]);
    setCandidate(newCandidate);
    setRole(UserRole.CANDIDATE);
    startNextTest(newCandidate);
  };

  const finishCurrentTest = (testData: any) => {
    if (!candidate) return;
    const updated: Candidate = { ...candidate, currentTestIndex: candidate.currentTestIndex + 1, results: { ...candidate.results, ...testData } };
    setCandidate(updated);
    setAllCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
    startNextTest(updated);
  };

  const handleDeleteCandidate = (id: string, name: string) => {
    if (window.confirm(`Hapus data ${name} secara permanen? Seluruh hasil tes akan hilang.`)) {
      setAllCandidates(prev => prev.filter(c => c.id !== id));
      showToast("Data dihapus.", "success");
    }
  };

  const renderActiveTest = () => {
    if (!activeTestModule) return null;
    switch (activeTestModule.type) {
      case TestType.DISC: return renderDisc();
      case TestType.KRAEPELIN: return <KraepelinTest config={activeTestModule.config} onComplete={(data) => finishCurrentTest({ kraepelin: data })} />;
      case TestType.ISHIHARA: return <IshiharaTest questions={activeTestModule.questions || []} onComplete={(data) => { const correctKeys: Record<string, string> = {}; activeTestModule.questions?.forEach(q => correctKeys[q.id] = q.correctOptionId || ''); finishCurrentTest({ ishihara: calculateIshiharaScore(data.answers, correctKeys) }); }} />;
      default: return <div className="p-20 bg-white rounded-3xl text-center font-black">MODUL SEDANG DALAM PENGEMBANGAN</div>;
    }
  };

  const renderDisc = () => {
    const q = DISC_QUESTIONS[currentDiscIndex];
    if (!q) return null;
    const sel = discAnswers.find(a => a.id === q.id) || { id: q.id, most: -1, least: -1 };
    const handleSelect = (idx: number, type: 'most' | 'least') => {
      setDiscAnswers(prev => {
        const exist = prev.find(a => a.id === q.id);
        const next = exist ? { ...exist, [type]: idx } : { id: q.id, most: type === 'most' ? idx : -1, least: type === 'least' ? idx : -1 };
        if (type === 'most' && next.least === idx) next.least = -1;
        if (type === 'least' && next.most === idx) next.most = -1;
        return [...prev.filter(a => a.id !== q.id), next];
      });
    };
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center border-b pb-8">
           <h3 className="text-2xl font-black text-slate-800 tracking-tighter">TES DISC (GAYA KERJA)</h3>
           <p className="text-2xl font-black text-emerald-600">{currentDiscIndex + 1} <span className="text-slate-300 text-sm">/ {DISC_QUESTIONS.length}</span></p>
        </div>
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
              <div className="flex-1 font-bold text-slate-700 text-lg">{opt.text}</div>
              <div className="flex gap-4">
                 <button onClick={() => handleSelect(idx, 'most')} className={`w-14 h-14 rounded-2xl font-black transition-all ${sel.most === idx ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-300 hover:text-emerald-600'}`}>P</button>
                 <button onClick={() => handleSelect(idx, 'least')} className={`w-14 h-14 rounded-2xl font-black transition-all ${sel.least === idx ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-300 hover:text-rose-500'}`}>K</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-8">
          <button onClick={() => setCurrentDiscIndex(prev => Math.max(0, prev - 1))} disabled={currentDiscIndex === 0} className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 disabled:opacity-0">Sebelumnya</button>
          <button onClick={() => currentDiscIndex < DISC_QUESTIONS.length - 1 ? setCurrentDiscIndex(prev => prev + 1) : finishCurrentTest({ disc: calculateDiscScore(discAnswers) })} disabled={sel.most === -1 || sel.least === -1} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-20">{currentDiscIndex === DISC_QUESTIONS.length - 1 ? 'Selesai' : 'Selanjutnya'}</button>
        </div>
      </div>
    );
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="bg-white w-full max-w-7xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[850px] relative">
          <div className="w-full lg:w-3/5 p-8 lg:p-20 flex flex-col justify-center relative z-20 bg-white">
            <BuanaLogo className="h-10 mb-10" />
            <h1 className="text-5xl font-black tracking-tight mb-4" style={{ color: DARK_EMERALD }}>{loginContext === 'ADMIN' ? 'Portal Administrasi' : 'Mulai Karir Profesional'}</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">Portal seleksi cerdas berbasis AI untuk tenaga kerja masa depan PT. Buana Megah.</p>
            {loginContext === 'ADMIN' ? (
              <div className="space-y-8">
                <input type="text" placeholder="Identity" className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" />
                <input type="password" placeholder="••••••••" className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" />
                <button onClick={handleAdminLogin} className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest">MASUK ADMIN</button>
                <button onClick={() => setLoginContext('CANDIDATE')} className="w-full text-slate-300 font-black text-[10px] uppercase tracking-widest">Kembali ke Registrasi</button>
              </div>
            ) : (
              <div className="space-y-8">
                <input type="text" value={registration.name} onChange={e => setRegistration({...registration, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" placeholder="Nama Lengkap Sesuai KTP" />
                <div className="grid grid-cols-2 gap-8">
                  <input type="tel" value={registration.whatsapp} onChange={e => setRegistration({...registration, whatsapp: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" placeholder="WhatsApp Aktif" />
                  <select value={registration.appliedPositionId} onChange={e => setRegistration({...registration, appliedPositionId: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg">
                    <option value="">Pilih Posisi</option>
                    {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <textarea value={registration.address} onChange={e => setRegistration({...registration, address: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg resize-none" rows={3} placeholder="Alamat Domisili Lengkap"></textarea>
                <button onClick={handleRegisterAndStart} className="w-full py-7 bg-emerald-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest">Mulai Tes Seleksi ➔</button>
                <button onClick={() => setLoginContext('ADMIN')} className="w-full text-slate-200 hover:text-slate-400 font-bold text-[10px] uppercase tracking-widest transition-colors">Administrasi Portal</button>
              </div>
            )}
          </div>
          <div className="hidden lg:block w-2/5 relative bg-emerald-900 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1518173946687-a4c8a3b7792e?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover grayscale opacity-40" alt="Factory" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/20 to-transparent"></div>
            <div className="absolute top-0 bottom-0 left-0 w-24 z-10"><svg className="h-full w-full text-white fill-current" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 0 C 70 0 30 50 30 50 C 30 50 70 100 0 100 L 0 100 Z" /></svg></div>
            <div className="absolute z-20" style={{ top: '320px', left: '100px' }}>
                <div className="particle-container absolute inset-0 flex justify-center items-end pointer-events-none">
                    <div className="particle p1"></div><div className="particle p2"></div><div className="particle p3"></div><div className="particle p4"></div>
                </div>
                <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(22,198,12,0.7)]" viewBox="0 0 24 24" fill="none"><path d="M9 7C9 7 7 10 7 13C7 15 8 16 8 16C8 16 9 15 9 13C9 11 9 7 9 7Z" fill="#16C60C"/><path d="M15 7C15 7 17 10 17 13C17 15 16 16 16 16C16 16 15 15 15 13C15 11 15 7 15 7Z" fill="#16C60C"/><path d="M12 3C12 3 10 7 10 10C10 13 11 14 12 14C13 14 14 13 14 10C14 7 12 3 12 3Z" fill="#1BE40F"/><path d="M12 14C12 14 10.5 16 10.5 18C10.5 20 11 22 12 22C13 22 13.5 20 13.5 18C13.5 16 12 14 12 14Z" fill="#16C60C"/></svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <aside className="w-72 bg-white h-screen border-r border-slate-100 flex flex-col p-8 sticky top-0 no-print">
          <BuanaLogo className="mb-12" />
          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', label: 'Executive Summary', icon: 'M4 6h16M4 12h16M4 18h16' },
              { id: 'monitoring', label: 'Live Monitoring', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z' },
              { id: 'candidates', label: 'Database Pelamar', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'positions', label: 'Manajemen Posisi', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1' },
              { id: 'test_management', label: 'Bank Soal & Config', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveAdminTab(item.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeAdminTab === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
                {item.label}
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-6 py-4 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">Keluar Portal</button>
        </aside>
        <main className="flex-1 p-12 overflow-y-auto">
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-12">
               <div className="grid grid-cols-4 gap-8">
                  {[ { label: 'Total Pelamar', val: stats.total, color: 'emerald' }, { label: 'Selesai Tes', val: stats.completed, color: 'blue' }, { label: 'Lowongan Open', val: stats.activePositions, color: 'amber' }, { label: 'Index Performa', val: stats.avgScore + '%', color: 'slate' } ].map((c, i) => (
                    <div key={i} className={`bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-${c.color}-500`}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{c.label}</p>
                      <h3 className="text-4xl font-black text-slate-800">{c.val}</h3>
                    </div>
                  ))}
               </div>
               <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-8 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Tren Rekrutmen Bulanan</h4>
                     <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyTrends}><defs><linearGradient id="col" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BUANA_GREEN} stopOpacity={0.3}/><stop offset="95%" stopColor={BUANA_GREEN} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis hide /><Tooltip /><Area type="monotone" dataKey="count" stroke={BUANA_GREEN} strokeWidth={6} fill="url(#col)" /></AreaChart></ResponsiveContainer></div>
                  </div>
                  <div className="col-span-4 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Distribusi Kualitas</h4><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={qualityDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{qualityDistribution.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
               </div>
            </div>
          )}
          {activeAdminTab === 'candidates' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Database Pelamar</h3>
                  <input type="text" placeholder="Cari..." value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} className="bg-slate-50 px-8 py-4 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all w-96 shadow-sm font-bold" />
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50/50"><tr><th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat</th><th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Posisi</th><th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th><th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{allCandidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-10"><p className="font-bold text-slate-800 text-lg">{c.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.education} • {c.age} thn</p></td>
                    <td className="px-8 py-10"><span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{c.appliedPosition}</span></td>
                    <td className="px-8 py-10 text-center"><span className={`inline-flex px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span></td>
                    <td className="px-8 py-10 text-right"><div className="flex justify-end gap-3"><button onClick={() => handleDeleteCandidate(c.id, c.name)} className="p-3 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button><button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105">Laporan ➔</button></div></td>
                  </tr>
               ))}</tbody></table></div>
            </div>
          )}
          {activeAdminTab === 'monitoring' && <TokenRegistry />}
          {activeAdminTab === 'positions' && <PositionManagement positions={jobPositions} onUpdate={setJobPositions} showToast={showToast} />}
          {activeAdminTab === 'test_management' && <TestManagement testModules={testModules} onUpdate={setTestModules} showToast={showToast} />}
        </main>
        {candidate && role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[150] overflow-y-auto p-12 flex flex-col items-center">
            <button onClick={() => setCandidate(null)} className="self-end bg-white/10 text-white px-10 py-5 rounded-[2rem] hover:bg-rose-500 mb-12 font-black text-xs uppercase tracking-widest transition-all">Tutup Pratinjau</button>
            <ReportView candidate={candidate} showToast={showToast} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
       <nav className="bg-white border-b-4 border-emerald-500/10 px-12 py-5 flex justify-between items-center sticky top-0 z-[120] shadow-sm backdrop-blur-lg">
          <BuanaLogo className="h-8" />
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat Aktif</p><p className="text-sm font-black text-slate-800">{candidate?.name}</p></div>
             <div className="h-10 w-[1px] bg-slate-100"></div>
             <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100"><div className="flex flex-col"><span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Tes {candidate?.currentTestIndex! + 1} / {candidate?.package.length}</span><span className="text-xs font-black text-emerald-900 uppercase">{activeTestModule?.title}</span></div></div>
          </div>
       </nav>
       <main className="flex-1 p-12 flex items-center justify-center">
         {candidate?.status === 'COMPLETED' ? (
           <div className="text-center space-y-10 max-w-xl bg-white p-24 rounded-[4rem] shadow-2xl animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl mb-12"><svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Asesmen Selesai</h2>
              <p className="text-slate-500 font-medium italic text-lg leading-relaxed">Terima kasih. Seluruh jawaban Anda telah tersimpan. Data Anda akan diproses oleh Tim HR PT. Buana Megah.</p>
              <button onClick={handleLogout} className="w-full text-white py-7 rounded-[2.5rem] font-black text-lg shadow-xl hover:scale-105 transition-all" style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>KELUAR HALAMAN</button>
           </div>
         ) : renderActiveTest()}
       </main>
    </div>
  );
};

export default App;
