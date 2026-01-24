
import React, { useState, useEffect } from 'react';
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
const DARK_EMERALD = '#064E3B';

// --- STABLE SVG COMPONENTS ---

const PaperTreeIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="200" cy="200" r="180" fill="#F0FDF4" />
    <path d="M200 320V120" stroke={DARK_EMERALD} strokeWidth="12" strokeLinecap="round" />
    <path d="M200 240C240 240 280 200 280 160" stroke={BUANA_GREEN} strokeWidth="10" strokeLinecap="round" />
    <path d="M200 180C140 180 100 140 100 100" stroke={BUANA_GREEN} strokeWidth="10" strokeLinecap="round" />
  </svg>
);

const BuanaLogo: React.FC<{ className?: string; inverse?: boolean }> = ({ className = "h-8", inverse = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center relative shadow-sm overflow-hidden ${inverse ? 'bg-white' : 'bg-emerald-500'}`}>
      <div className={`w-5 h-5 rounded-tr-full transform -rotate-45 translate-y-1 ${inverse ? 'bg-emerald-900' : 'bg-white'}`}></div>
    </div>
    <div className="flex flex-col -space-y-1">
      <span className={`font-black tracking-tighter text-xl uppercase leading-none ${inverse ? 'text-white' : 'text-emerald-900'}`}>PT. BUANA MEGAH</span>
      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${inverse ? 'text-emerald-300' : 'text-slate-400'}`}>Paper Mills Pasuruan</span>
    </div>
  </div>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
  const styles = { success: 'bg-emerald-600 border-emerald-400', error: 'bg-rose-600 border-rose-400', info: 'bg-blue-500 border-blue-300' };
  return (
    <div className={`fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl border-2 animate-in slide-in-from-right duration-300 ${styles[type]}`}>
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
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'candidates' | 'positions' | 'tests'>('dashboard');
  const [loginContext, setLoginContext] = useState<'CANDIDATE' | 'ADMIN'>('CANDIDATE');
  
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [allTestModules, setAllTestModules] = useState<TestModule[]>([]);
  const [adminStats, setAdminStats] = useState({ total: 0, completed: 0, activePositions: 0, avgScore: 0 });
  const [registration, setRegistration] = useState({ name: '', whatsapp: '', address: '', appliedPositionId: '' });
  const [adminAuth, setAdminAuth] = useState({ user: '', pass: '' });
  const [isInitializing, setIsInitializing] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });

  // Load essential data on mount with high priority
  useEffect(() => {
    const initApp = async () => {
      try {
        const [positions, modules] = await Promise.all([
          api.getActivePositions(),
          api.getTestModules()
        ]);
        
        setJobPositions(positions);
        setAllTestModules(modules);

        const savedRole = localStorage.getItem('buana_role') as UserRole;
        const savedCandidate = localStorage.getItem('buana_candidate');
        
        if (savedRole === UserRole.ADMIN) {
          setRole(UserRole.ADMIN);
        } else if (savedRole === UserRole.CANDIDATE && savedCandidate) {
          const candData = JSON.parse(savedCandidate);
          setCandidate(candData);
          setRole(UserRole.CANDIDATE);
          
          // Resume test session if module metadata is loaded
          if (candData.status === 'IN_PROGRESS' && candData.package && candData.package.length > 0) {
            const currentTestId = candData.package[candData.currentTestIndex];
            const mod = modules.find(m => m.id === currentTestId);
            if (mod) setActiveTestModule(mod);
          }
        }
      } catch (err) {
        showToast("Sinkronisasi database gagal. Harap refresh.", "error");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (role === UserRole.ADMIN) {
      api.getAdminStats().then(setAdminStats);
      api.getParticipants().then(setAllCandidates);
    }
  }, [role, activeAdminTab]);

  const handleLogout = () => { 
    localStorage.removeItem('buana_role');
    localStorage.removeItem('buana_candidate');
    window.location.reload(); 
  };

  const handleRegister = async () => {
    if (!registration.name || !registration.whatsapp || !registration.appliedPositionId) {
      showToast("Lengkapi data Nama, WhatsApp, dan Posisi.", "error");
      return;
    }

    try {
      showToast("Mendaftarkan...", "info");
      const response = await api.register(registration);
      
      const pos = jobPositions.find(p => p.id == registration.appliedPositionId);
      const testIds = pos?.testIds || ['tm_disc']; 
      
      const newCand: Candidate = {
        id: response.id,
        ...registration,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos?.title || 'Kandidat',
        package: testIds
      };
      
      // Update State & Persistence
      localStorage.setItem('buana_role', UserRole.CANDIDATE);
      localStorage.setItem('buana_candidate', JSON.stringify(newCand));
      
      setCandidate(newCand);
      setRole(UserRole.CANDIDATE);
      
      // CRITICAL: Activate first test module immediately
      const firstModule = allTestModules.find(m => m.id === testIds[0]);
      if (firstModule) {
        setActiveTestModule(firstModule);
        showToast("Registrasi Berhasil. Selamat mengerjakan.", "success");
      } else {
        // Retry fetch modules if not found (edge case)
        const freshModules = await api.getTestModules();
        setAllTestModules(freshModules);
        const retryModule = freshModules.find(m => m.id === testIds[0]);
        if (retryModule) {
          setActiveTestModule(retryModule);
          showToast("Registrasi Berhasil. Selamat mengerjakan.", "success");
        } else {
          showToast("Gagal memuat modul tes. Hubungi admin.", "error");
        }
      }
    } catch (err) {
      showToast("Gagal registrasi. Cek koneksi server.", "error");
    }
  };

  const onTestComplete = async (testResults: any) => {
    if (!candidate || !activeTestModule) return;
    const isLast = candidate.currentTestIndex === candidate.package.length - 1;
    
    try {
      showToast("Menyimpan jawaban...", "info");
      await api.submitTest(candidate.id, activeTestModule.type, testResults, isLast);
      
      const nextIdx = candidate.currentTestIndex + 1;
      const updatedCand: Candidate = {
        ...candidate,
        currentTestIndex: nextIdx,
        results: { ...candidate.results, [activeTestModule.type.toLowerCase()]: testResults }
      };
      
      if (isLast) {
        updatedCand.status = 'COMPLETED';
        setActiveTestModule(null);
        showToast("Seluruh rangkaian tes telah selesai.", "success");
      } else {
        const nextTestId = candidate.package[nextIdx];
        const nextModule = allTestModules.find(m => m.id === nextTestId);
        if (nextModule) {
          setActiveTestModule(nextModule);
        } else {
          showToast("Gagal memuat modul selanjutnya.", "error");
        }
      }
      
      setCandidate(updatedCand);
      localStorage.setItem('buana_candidate', JSON.stringify(updatedCand));
    } catch (err) {
      showToast("Gagal menyimpan hasil tes.", "error");
    }
  };

  const renderActiveTest = () => {
    if (!activeTestModule) {
      return (
        <div className="flex flex-col items-center gap-10 p-24 bg-white rounded-[4rem] shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-50 text-center">
            <div className="w-24 h-24 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-slate-900 font-black text-3xl uppercase tracking-tighter">Sinkronisasi Modul Tes</p>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-3 italic">Mohon tunggu sebentar, sedang menyiapkan lembar jawaban digital...</p>
            </div>
            {candidate && (
              <button 
                onClick={async () => {
                  const mods = await api.getTestModules();
                  setAllTestModules(mods);
                  const currentTestId = candidate.package[candidate.currentTestIndex];
                  const mod = mods.find(m => m.id === currentTestId);
                  if (mod) setActiveTestModule(mod);
                  else showToast("Modul tes belum terdaftar di dashboard.", "error");
                }}
                className="mt-4 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200"
              >
                Muat Ulang Paksa (Retry)
              </button>
            )}
        </div>
      );
    }

    switch (activeTestModule.type) {
      case TestType.DISC: return renderDisc();
      case TestType.KRAEPELIN: return <KraepelinTest config={activeTestModule.config} onComplete={onTestComplete} />;
      case TestType.ISHIHARA: return <IshiharaTest questions={activeTestModule.questions || []} onComplete={(res) => {
        const correctKeys: Record<string, string> = {};
        activeTestModule.questions?.forEach(q => correctKeys[q.id] = q.correctOptionId || '');
        onTestComplete(calculateIshiharaScore(res.answers, correctKeys));
      }} />;
      default: return <div className="p-20 text-center bg-white rounded-[3rem] shadow-xl font-black text-slate-400 uppercase">Modul "{activeTestModule.type}" Belum Tersedia.</div>;
    }
  };

  // DISC Test Logic (Encapsulated for reactivity)
  const [discAnswers, setDiscAnswers] = useState<{ id: number; most: number; least: number }[]>([]);
  const [currentDiscIndex, setCurrentDiscIndex] = useState(0);

  const renderDisc = () => {
    const q = DISC_QUESTIONS[currentDiscIndex];
    if (!q) return null;
    const currentAns = discAnswers.find(a => a.id === q.id) || { id: q.id, most: -1, least: -1 };
    
    const handleSelect = (idx: number, type: 'most' | 'least') => {
      setDiscAnswers(prev => {
        const other = prev.find(a => a.id === q.id) || { id: q.id, most: -1, least: -1 };
        const updated = { ...other, [type]: idx };
        if (type === 'most' && updated.least === idx) updated.least = -1;
        if (type === 'least' && updated.most === idx) updated.most = -1;
        return [...prev.filter(a => a.id !== q.id), updated];
      });
    };

    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-10">
           <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">TES GAYA KERJA</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Personal Behavior Inventory (DISC)</p>
           </div>
           <div className="text-right">
              <p className="text-4xl font-black text-emerald-600 tracking-tighter">{currentDiscIndex + 1} <span className="text-slate-200 text-lg">/ {DISC_QUESTIONS.length}</span></p>
           </div>
        </div>
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-6 p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-emerald-200 group">
              <div className="flex-1 font-bold text-slate-700 text-xl group-hover:text-slate-900 transition-colors">{opt.text}</div>
              <div className="flex gap-4">
                 <button onClick={() => handleSelect(idx, 'most')} className={`w-16 h-16 rounded-2xl font-black text-xs transition-all ${currentAns.most === idx ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}>P</button>
                 <button onClick={() => handleSelect(idx, 'least')} className={`w-16 h-16 rounded-2xl font-black text-xs transition-all ${currentAns.least === idx ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}>K</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-10">
          <button onClick={() => setCurrentDiscIndex(p => Math.max(0, p-1))} disabled={currentDiscIndex === 0} className="px-12 py-6 font-black text-[10px] uppercase text-slate-400 disabled:opacity-0 hover:text-slate-600 transition-all tracking-widest">Sebelumnya</button>
          <button 
            onClick={() => currentDiscIndex < DISC_QUESTIONS.length - 1 ? setCurrentDiscIndex(p => p+1) : onTestComplete(calculateDiscScore(discAnswers))} 
            disabled={currentAns.most === -1 || currentAns.least === -1}
            className="bg-emerald-600 text-white px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-600/30 disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
          >
            {currentDiscIndex === DISC_QUESTIONS.length - 1 ? 'Selesai & Kirim' : 'Simpan & Lanjut'}
          </button>
        </div>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f2e26] flex flex-col items-center justify-center text-center p-10">
         <div className="w-24 h-24 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin mb-10"></div>
         <h2 className="text-white text-3xl font-black uppercase tracking-tighter">PsychoMetric Engine v2.5</h2>
         <p className="text-emerald-500/50 font-bold uppercase tracking-[0.3em] mt-4 text-[10px]">PT. BUANA MEGAH - Loading Security Layer</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f2e26] selection:bg-emerald-500/30">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="absolute top-[-15%] left-[-15%] w-[50vw] h-[50vw] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[50vw] h-[50vw] bg-emerald-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>

        <div className="bg-[#134e40] w-full max-w-6xl h-[800px] rounded-[70px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex relative border border-emerald-800/20">
          <div className="hidden lg:block w-[55%] bg-white relative h-full">
            <div className="absolute top-16 left-16 z-30"><BuanaLogo className="h-12 scale-110 origin-left" /></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-20 z-10 text-center">
              <div className="relative w-full max-w-md h-[400px] flex items-center justify-center scale-110"><PaperTreeIllustration /></div>
              <div className="max-w-md mt-12 space-y-6">
                <h3 className="text-5xl font-black text-emerald-950 tracking-tighter uppercase leading-[0.9]">Digital<br/><span className="text-emerald-600">Talent Hub</span></h3>
                <p className="text-slate-400 font-medium italic leading-relaxed text-lg px-4">"Digitalizing PT. Buana Megah recruitment experience."</p>
              </div>
            </div>
            <div className="particle p1"></div><div className="particle p2"></div><div className="particle p3"></div><div className="particle p4"></div>
          </div>

          <div className="w-full lg:w-[45%] p-12 lg:p-24 flex flex-col justify-center bg-[#134e40]">
            <div className="mb-14">
              <h2 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase leading-none">{loginContext === 'ADMIN' ? 'Login' : 'Portal'}</h2>
              <p className="text-emerald-300/40 font-black text-[10px] tracking-[0.3em] uppercase">{loginContext === 'ADMIN' ? 'HR Intelligence Login' : 'Candidate Registration'}</p>
            </div>

            <div className="space-y-6">
              {loginContext === 'ADMIN' ? (
                <div className="space-y-5 animate-in slide-in-from-right-10 duration-500">
                  <input type="text" value={adminAuth.user} onChange={e => setAdminAuth({...adminAuth, user: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] border border-emerald-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold" placeholder="Username" />
                  <input type="password" value={adminAuth.pass} onChange={e => setAdminAuth({...adminAuth, pass: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] border border-emerald-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold" placeholder="Password" />
                  <button onClick={() => { if(adminAuth.user && adminAuth.pass) { setRole(UserRole.ADMIN); localStorage.setItem('buana_role', UserRole.ADMIN); showToast("Sesi Admin Aktif.", "success"); } }} className="w-full py-6 rounded-full bg-emerald-400 text-emerald-950 font-black shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all">Authenticate ➔</button>
                  <button onClick={() => setLoginContext('CANDIDATE')} className="w-full text-emerald-500/60 font-black text-[9px] uppercase pt-4 hover:text-emerald-400 transition-colors">← Kembali ke Registrasi</button>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-right-10 duration-500">
                  <input type="text" value={registration.name} onChange={e => setRegistration({...registration, name: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] border border-emerald-800/50 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400 transition-all" placeholder="Nama Lengkap" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="tel" value={registration.whatsapp} onChange={e => setRegistration({...registration, whatsapp: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] border border-emerald-800/50 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400 transition-all" placeholder="08xxx..." />
                    <select value={registration.appliedPositionId} onChange={e => setRegistration({...registration, appliedPositionId: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] border border-emerald-800/50 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-all">
                        <option value="">Pilih Jabatan</option>
                        {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <textarea value={registration.address} onChange={e => setRegistration({...registration, address: e.target.value})} rows={2} className="w-full px-8 py-5 rounded-[40px] bg-[#063b2f] border border-emerald-800/50 text-white font-bold resize-none outline-none focus:ring-2 focus:ring-emerald-400 transition-all" placeholder="Alamat Domisili" />
                  <button onClick={handleRegister} className="w-full py-6 mt-8 rounded-full bg-emerald-500 text-emerald-950 font-black shadow-2xl shadow-emerald-500/30 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all">Mulai Asesmen ➔</button>
                  <button onClick={() => setLoginContext('ADMIN')} className="w-full text-emerald-500/20 font-black text-[9px] uppercase pt-12 hover:text-emerald-500/50 transition-colors">Akses Internal HR</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN & CANDIDATE MAIN LAYOUTS ---
  if (role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex animate-in fade-in duration-500">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <aside className="w-80 bg-white h-screen border-r border-slate-100 flex flex-col p-10 sticky top-0 no-print shadow-2xl shadow-slate-200/50 z-[200]">
          <BuanaLogo className="mb-14" />
          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'candidates', label: 'Database Pelamar', icon: '👥' },
              { id: 'positions', label: 'Manajemen Posisi', icon: '💼' },
              { id: 'tests', label: 'Bank Soal & Engine', icon: '⚙️' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveAdminTab(tab.id as any)} className={`w-full flex items-center gap-5 px-8 py-5 rounded-3xl font-black text-sm transition-all text-left ${activeAdminTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="uppercase tracking-tight leading-none">{tab.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-8 py-5 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-3xl transition-all">🚪 Keluar Portal</button>
        </aside>
        <main className="flex-1 p-16 overflow-y-auto bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:32px_32px]">
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-14">
               <div className="grid grid-cols-4 gap-10">
                  <div className="bg-white p-10 rounded-[3.5rem] border-b-[12px] border-emerald-500 shadow-2xl shadow-emerald-500/5 animate-in slide-in-from-bottom-4 duration-300">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Total Peserta Terdaftar</p>
                     <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{adminStats.total}</h3>
                  </div>
                  <div className="bg-white p-10 rounded-[3.5rem] border-b-[12px] border-blue-500 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-bottom-4 duration-400">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Asesmen Selesai</p>
                     <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{adminStats.completed}</h3>
                  </div>
                  <div className="bg-white p-10 rounded-[3.5rem] border-b-[12px] border-amber-500 shadow-2xl shadow-amber-500/5 animate-in slide-in-from-bottom-4 duration-500">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Posisi Kerja Aktif</p>
                     <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{adminStats.activePositions}</h3>
                  </div>
               </div>
               <div className="bg-emerald-900 rounded-[4.5rem] p-20 text-white flex justify-between items-center relative overflow-hidden group shadow-2xl animate-in fade-in duration-700">
                  <div className="relative z-10 space-y-8">
                     <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.9]">Human Capital<br/>Command Center</h2>
                     <p className="text-emerald-100/60 max-w-lg text-xl italic font-medium leading-relaxed">"Selamat bekerja, Admin HR. Gunakan data psikometri untuk pengambilan keputusan talenta yang tepat."</p>
                     <button onClick={() => setActiveAdminTab('positions')} className="bg-emerald-400 text-emerald-950 px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-400/20">Manajemen Lowongan ➔</button>
                  </div>
                  <div className="w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] absolute -right-32 -bottom-32 transition-transform group-hover:scale-125 duration-1000"></div>
                  <div className="absolute right-20 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000"><BuanaLogo className="h-64" inverse /></div>
               </div>
            </div>
          )}
          {activeAdminTab === 'candidates' && (
            <div className="bg-white rounded-[4rem] p-16 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in duration-500">
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-12">Database Pelamar Digital</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil Pelamar</th>
                        <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jabatan Dilamar</th>
                        <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Sesi</th>
                        <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {allCandidates.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                          <td className="px-10 py-10">
                            <p className="font-black text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">{c.name}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tight">WhatsApp: {c.whatsapp}</p>
                          </td>
                          <td className="px-10 py-10">
                             <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight inline-block">{c.appliedPosition}</div>
                          </td>
                          <td className="px-10 py-10 text-center">
                             <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 shadow-sm'}`}>
                                {c.status === 'COMPLETED' ? 'Selesai' : 'Sedang Tes'}
                             </span>
                          </td>
                          <td className="px-10 py-10 text-right">
                             <div className="flex justify-end gap-3">
                                <button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10">Lihat Laporan ➔</button>
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
          {activeAdminTab === 'tests' && <TestManagement testModules={allTestModules} onUpdate={setAllTestModules} showToast={showToast} />}
        </main>
        {candidate && role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] overflow-y-auto p-12 flex flex-col items-center animate-in fade-in duration-300">
            <button onClick={() => setCandidate(null)} className="self-end bg-white/10 text-white px-10 py-5 rounded-3xl hover:bg-rose-500 mb-12 font-black text-xs uppercase tracking-[0.2em] transition-all">TUTUP PRATINJAU LAPORAN ✖</button>
            <ReportView candidate={candidate} showToast={showToast} />
          </div>
        )}
      </div>
    );
  }

  // --- CANDIDATE TESTING LAYOUT ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 animate-in fade-in duration-500 selection:bg-emerald-500/20">
       {toast && <Toast {...toast} onClose={() => setToast(null)} />}
       <nav className="bg-white border-b-4 border-emerald-500/10 px-12 py-6 flex justify-between items-center sticky top-0 z-[120] shadow-xl shadow-slate-200/50 backdrop-blur-xl no-print">
          <BuanaLogo className="h-10" />
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Peserta Terotentikasi</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">{candidate?.name}</p>
             </div>
             <div className="h-12 w-[1px] bg-slate-100"></div>
             <div className="bg-emerald-50 px-10 py-4 rounded-[2rem] border border-emerald-100 flex flex-col items-center shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-1 leading-none relative z-10">Modul Tes {candidate?.currentTestIndex! + 1} / {candidate?.package.length}</span>
                <span className="text-sm font-black text-emerald-950 uppercase tracking-tight relative z-10">{activeTestModule?.title || 'Persiapan Modul...'}</span>
             </div>
             <button onClick={handleLogout} title="Keluar dan Hapus Sesi" className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 text-xl">🚪</button>
          </div>
       </nav>
       <main className="flex-1 p-12 flex items-center justify-center relative bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:28px_28px]">
         {candidate?.status === 'COMPLETED' ? (
           <div className="text-center space-y-12 max-w-xl bg-white p-24 rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 animate-in zoom-in-95 duration-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-emerald-500"></div>
              <div className="w-32 h-32 rounded-[3rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 mb-14 animate-bounce">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">Asesmen Tuntas</h2>
                <p className="text-slate-400 font-bold text-lg leading-relaxed uppercase tracking-tight">Terima kasih atas partisipasi Anda.</p>
                <p className="text-slate-500 font-medium italic mt-4">Seluruh data hasil tes telah disinkronisasi ke database pusat PT. Buana Megah.</p>
              </div>
              <button onClick={handleLogout} className="w-full text-white py-8 rounded-[2.5rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest bg-emerald-600 shadow-emerald-600/30">KELUAR DARI PORTAL ASESMEN</button>
           </div>
         ) : renderActiveTest()}
       </main>
    </div>
  );
};

export default App;
