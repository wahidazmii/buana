
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Candidate, UserRole, TestType, JobPosition, TestModule } from './types';
import { DISC_QUESTIONS } from './constants';
import { calculateDiscScore, calculateIshiharaScore } from './services/scoringService';
import { api } from './services/apiService';
import ReportView from './components/ReportView';
import PositionManagement from './components/PositionManagement';
import TestManagement from './components/TestManagement';
import KraepelinTest from './components/KraepelinTest';
import IshiharaTest from './components/IshiharaTest';

const BUANA_GREEN = '#10B981';
const DARK_EMERALD = '#064e3b';

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
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'positions' | 'test_management' | 'candidates'>('dashboard');
  const [loginContext, setLoginContext] = useState<'CANDIDATE' | 'ADMIN'>('CANDIDATE');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [discAnswers, setDiscAnswers] = useState<{ id: number; most: number; least: number }[]>([]);
  const [currentDiscIndex, setCurrentDiscIndex] = useState(0);

  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [adminStats, setAdminStats] = useState({ total: 0, completed: 0, activePositions: 0, avgScore: 0 });

  const [testModules] = useState<TestModule[]>([
    { id: 'tm_ishihara', title: 'Ishihara Color Vision', type: TestType.ISHIHARA, isActive: true, questionCount: 14, config: {}, questions: Array.from({ length: 14 }, (_, i) => ({ id: `plate-${i+1}`, text: `https://images.unsplash.com/photo-1579546678183-a9c101ad2c22?q=80&w=200&auto=format&fit=crop`, options: [], correctOptionId: '12' })) },
    { id: 'tm_disc', title: 'DISC Gaya Kerja', type: TestType.DISC, isActive: true, questionCount: 24, config: { durationSeconds: 900 } },
    { id: 'tm_kraepelin', title: 'Kraepelin Speed Test', type: TestType.KRAEPELIN, isActive: true, questionCount: 0, config: { timerPerLine: 15, totalLines: 40, digitsPerLine: 45, direction: 'DOWN_TO_UP' } },
  ]);

  const [registration, setRegistration] = useState({ name: '', whatsapp: '', dob: '', education: '', address: '', appliedPositionId: '' });

  // Load Data via ApiService
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const data = await api.getActivePositions();
        setJobPositions(data);
      } catch (err) {
        showToast("Gagal memuat posisi dari server.", "error");
      }
    };
    loadPositions();
  }, []);

  useEffect(() => {
    if (role === UserRole.ADMIN) {
      const loadAdminData = async () => {
        try {
          const stats = await api.getAdminStats();
          setAdminStats(stats);
          const candidates = await api.getAllCandidates();
          setAllCandidates(candidates);
        } catch (err) {
          showToast("Gagal memuat data administrasi.", "error");
        }
      };
      loadAdminData();
    }
  }, [role, activeAdminTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });
  const handleLogout = () => { window.location.reload(); };
  const handleAdminLogin = () => { setRole(UserRole.ADMIN); showToast('Selamat Datang Administrator.', 'success'); };

  const startNextTest = (currentCandidate: Candidate) => {
    const nextIndex = currentCandidate.currentTestIndex;
    const nextModuleId = currentCandidate.package[nextIndex];
    if (nextModuleId) {
      const module = testModules.find(m => m.id === nextModuleId);
      if (module) { setActiveTestModule(module); return; }
    }
    setCandidate({ ...currentCandidate, status: 'COMPLETED' });
    setActiveTestModule(null);
  };

  const handleRegisterAndStart = async () => {
    const pos = jobPositions.find(p => p.id === registration.appliedPositionId);
    if (!registration.name || !registration.whatsapp || !registration.address || !pos) { showToast("Data tidak lengkap.", "error"); return; }
    
    try {
      const data = await api.registerCandidate(registration);
      const newCandidate: Candidate = { 
        id: data.id, 
        ...registration, 
        age: 25, 
        appliedPosition: pos.title, 
        status: 'IN_PROGRESS', 
        package: pos.testIds, 
        currentTestIndex: 0 
      };
      setCandidate(newCandidate);
      setRole(UserRole.CANDIDATE);
      startNextTest(newCandidate);
      showToast("Registrasi berhasil. Mulai tes sekarang.", "success");
    } catch (err) {
      showToast("Gagal registrasi.", "error");
    }
  };

  const finishCurrentTest = async (testData: any) => {
    if (!candidate || !activeTestModule) return;
    const isLast = candidate.currentTestIndex === candidate.package.length - 1;
    
    try {
      await api.submitTestResult(candidate.id, activeTestModule.type, testData, isLast);
      const updated: Candidate = { 
        ...candidate, 
        currentTestIndex: candidate.currentTestIndex + 1, 
        results: { ...candidate.results, [activeTestModule.type.toLowerCase()]: testData } 
      };
      setCandidate(updated);
      startNextTest(updated);
    } catch (err) {
      showToast("Gagal menyimpan hasil.", "error");
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (window.confirm(`Hapus data ${name} secara permanen?`)) {
      try {
        await api.deleteCandidate(id);
        setAllCandidates(prev => prev.filter(c => c.id !== id));
        showToast("Kandidat berhasil dihapus.", "success");
      } catch (err) {
        showToast("Gagal menghapus.", "error");
      }
    }
  };

  const renderActiveTest = () => {
    if (!activeTestModule) return null;
    switch (activeTestModule.type) {
      case TestType.DISC: return renderDisc();
      case TestType.KRAEPELIN: return <KraepelinTest config={activeTestModule.config} onComplete={(data) => finishCurrentTest(data)} />;
      case TestType.ISHIHARA: return <IshiharaTest questions={activeTestModule.questions || []} onComplete={(data) => {
          const correctKeys: Record<string, string> = {}; 
          activeTestModule.questions?.forEach(q => correctKeys[q.id] = q.correctOptionId || ''); 
          finishCurrentTest(calculateIshiharaScore(data.answers, correctKeys));
      }} />;
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
           <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">TES GAYA KERJA (DISC)</h3>
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
          <button onClick={() => currentDiscIndex < DISC_QUESTIONS.length - 1 ? setCurrentDiscIndex(prev => prev + 1) : finishCurrentTest(calculateDiscScore(discAnswers))} disabled={sel.most === -1 || sel.least === -1} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-20">{currentDiscIndex === DISC_QUESTIONS.length - 1 ? 'Selesai' : 'Selanjutnya'}</button>
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
                    <option value="">-- Pilih Posisi Dilamar --</option>
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
                {id: 'dashboard', label: 'Dashboard'},
                {id: 'candidates', label: 'Data Pelamar'},
                {id: 'positions', label: 'Manajemen Posisi'}
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveAdminTab(tab.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeAdminTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-6 py-4 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">Keluar Portal</button>
        </aside>
        <main className="flex-1 p-12 overflow-y-auto">
          {activeAdminTab === 'dashboard' && (
            <div className="grid grid-cols-4 gap-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-emerald-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Pelamar</p>
                  <h3 className="text-4xl font-black text-slate-800">{adminStats.total}</h3>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-blue-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selesai Tes</p>
                  <h3 className="text-4xl font-black text-slate-800">{adminStats.completed}</h3>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-amber-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Lowongan Aktif</p>
                  <h3 className="text-4xl font-black text-slate-800">{adminStats.activePositions}</h3>
               </div>
            </div>
          )}
          {activeAdminTab === 'candidates' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Database Pelamar Aktif</h3>
                    <input type="text" placeholder="Cari Nama / WhatsApp..." value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 font-bold text-sm w-72" />
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Peserta</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-right">Tindakan</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                        {allCandidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-8 py-10">
                                <p className="font-bold text-slate-800 text-lg">{c.name}</p>
                                <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{c.appliedPosition || 'Unknown'} • {c.education || 'N/A'}</p>
                            </td>
                            <td className="px-8 py-10 text-center">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                            </td>
                            <td className="px-8 py-10 text-right">
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => handleDeleteCandidate(c.id, c.name)} className="p-3 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                                    <button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Lihat Laporan ➔</button>
                                </div>
                            </td>
                        </tr>
                        ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
          {activeAdminTab === 'positions' && <PositionManagement positions={jobPositions} onUpdate={setJobPositions} showToast={showToast} />}
          {activeAdminTab === 'test_management' && <TestManagement testModules={testModules} onUpdate={() => {}} showToast={showToast} />}
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
           <div className="text-center space-y-10 max-w-xl bg-white p-24 rounded-[4rem] shadow-2xl border border-slate-50 animate-in zoom-in- duration-700">
              <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl mb-12"><svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Asesmen Selesai</h2>
              <p className="text-slate-500 font-medium italic text-lg leading-relaxed">Seluruh data Anda telah berhasil disinkronisasi dengan database pusat PT. Buana Megah.</p>
              <button onClick={handleLogout} className="w-full text-white py-7 rounded-[2.5rem] font-black text-lg shadow-xl hover:scale-105 transition-all" style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>KELUAR & SELESAI</button>
           </div>
         ) : renderActiveTest()}
       </main>
    </div>
  );
};

export default App;
