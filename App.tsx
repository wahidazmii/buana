import React, { useState, useEffect } from 'react';
import { Candidate, UserRole, TestType, JobPosition, TestModule, TestResults } from './types';
import { DISC_QUESTIONS, PAPI_QUESTIONS } from './constants';
import { api } from './services/apiService';
import { calculateDiscScore, calculateKraepelinScore, calculateIshiharaScore, calculatePapiScore } from './services/scoringUtils';
import ReportView from './components/ReportView';
import PositionManagement from './components/PositionManagement';
import TestManagement from './components/TestManagement';
import TokenRegistry from './components/TokenRegistry';
import KraepelinTest from './components/KraepelinTest';
import IshiharaTest from './components/IshiharaTest';
import AdminDashboard from './components/AdminDashboard';

const BUANA_GREEN = '#10B981';

// --- FALLBACK DUMMY DATA FOR PREVIEW ---
const DUMMY_MODULES: TestModule[] = [
  { 
    id: 'tm_disc', 
    title: 'Gaya Kerja (DISC)', 
    type: TestType.DISC, 
    isActive: true, 
    questionCount: 24, 
    config: { durationSeconds: 900 }, 
    questions: DISC_QUESTIONS 
  },
  { 
    id: 'tm_papi', 
    title: 'Kepribadian (PAPI)', 
    type: TestType.PAPI, 
    isActive: true, 
    questionCount: 90, 
    config: { durationSeconds: 1200 }, 
    questions: PAPI_QUESTIONS 
  },
  { 
    id: 'tm_kraepelin', 
    title: 'Speed Engine (Koran)', 
    type: TestType.KRAEPELIN, 
    isActive: true, 
    questionCount: 0, 
    config: { timerPerLine: 15, totalLines: 40, digitsPerLine: 45, direction: 'UP_TO_DOWN' }, 
    questions: [] 
  },
  { 
    id: 'tm_ishihara', 
    title: 'Color Vision (Buta Warna)', 
    type: TestType.ISHIHARA, 
    isActive: true, 
    questionCount: 14, 
    config: {}, 
    questions: [
      { id: '1', imageUrl: 'https://placehold.co/400x400/F0FDF4/10B981?text=Plate+1', correctOptionId: '12' },
      { id: '2', imageUrl: 'https://placehold.co/400x400/F0FDF4/10B981?text=Plate+2', correctOptionId: '8' }
    ] 
  },
  {
    id: 'tm_k3',
    title: 'Pengetahuan Dasar K3',
    type: TestType.K3,
    isActive: true,
    questionCount: 5,
    config: { durationSeconds: 1200, passingScore: 70 },
    questions: [
        {
            id: "k3-1",
            text: "Apa warna standar helm keselamatan (safety helmet) yang biasa digunakan oleh operator atau pekerja umum di lapangan?",
            options: [
                { id: "a", text: "Putih" },
                { id: "b", text: "Kuning" },
                { id: "c", text: "Merah" },
                { id: "d", text: "Hijau" }
            ],
            correctOptionId: "b"
        },
        {
            id: "k3-2",
            text: "Jika terjadi kebakaran ringan akibat korsleting listrik (Api Kelas C), jenis APAR apa yang PALING TEPAT digunakan?",
            options: [
                { id: "a", text: "Air (Water)" },
                { id: "b", text: "Busa (Foam)" },
                { id: "c", text: "Karbon Dioksida (CO2)" },
                { id: "d", text: "Pasir Basah" }
            ],
            correctOptionId: "c"
        }
    ]
  }
];

const DUMMY_POSITIONS: JobPosition[] = [
  { id: '1', title: 'Operator Produksi', department: 'Factory', isActive: true, applicantCount: 12, testIds: ['tm_ishihara', 'tm_kraepelin', 'tm_k3'] },
  { id: '2', title: 'Admin HRD', department: 'Human Resources', isActive: true, applicantCount: 5, testIds: ['tm_disc', 'tm_papi'] },
  { id: '3', title: 'Staff Gudang', department: 'Logistics', isActive: false, applicantCount: 0, testIds: ['tm_kraepelin'] }
];

const DUMMY_CANDIDATES: Candidate[] = [
  { 
    id: 'cand-001', 
    name: 'Budi Santoso', 
    whatsapp: '08123456789', 
    status: 'COMPLETED', 
    appliedPosition: 'Operator Produksi', 
    package: ['tm_ishihara', 'tm_kraepelin'],
    currentTestIndex: 2,
    results: {
      ishihara: { score: 14, status: 'NORMAL', totalPlates: 14 },
      kraepelin: { panker: 15.2, tianker: 2.1, janker: 5, trend: 'Rising', workCurve: [12,13,14,15,16], avg_speed: 15.2, accuracy_deviation: 2.1 },
      recommendation: 'Highly Recommended'
    }
  },
  { 
    id: 'cand-002', 
    name: 'Sari Wijaya', 
    whatsapp: '08571234567', 
    status: 'IN_PROGRESS', 
    appliedPosition: 'Admin HRD', 
    package: ['tm_disc', 'tm_papi'],
    currentTestIndex: 1 
  },
  {
    id: 'cand-003',
    name: 'Anton Pradana',
    whatsapp: '081333444555',
    status: 'COMPLETED',
    appliedPosition: 'Operator Produksi',
    package: ['tm_ishihara', 'tm_kraepelin'],
    currentTestIndex: 2,
    results: {
      recommendation: 'Recommended'
    }
  }
];

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
  const [activeAdminTab, setActiveAdminTab] = useState<'DASHBOARD' | 'CANDIDATES' | 'POSITIONS' | 'TESTS' | 'LIVE'>('DASHBOARD');
  const [loginContext, setLoginContext] = useState<'CANDIDATE' | 'ADMIN'>('CANDIDATE');
  
  // Initialize with Dummy Data for environment robustness
  const [jobPositions, setJobPositions] = useState<JobPosition[]>(DUMMY_POSITIONS);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>(DUMMY_CANDIDATES);
  const [allTestModules, setAllTestModules] = useState<TestModule[]>(DUMMY_MODULES);
  
  const [registration, setRegistration] = useState({ name: '', whatsapp: '', address: '', appliedPositionId: '' });
  const [adminAuth, setAdminAuth] = useState({ user: '', pass: '' });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // DISC & PAPI States
  const [discAnswers, setDiscAnswers] = useState<Record<number, { most: string; least: string }>>({});
  const [currentDiscIndex, setCurrentDiscIndex] = useState(0);
  const [papiAnswers, setPapiAnswers] = useState<Record<number, 'a' | 'b'>>({});
  const [currentPapiIndex, setCurrentPapiIndex] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });

  useEffect(() => {
    const initApp = async () => {
      try {
        const [positions, modules] = await Promise.all([
          api.getActivePositions(),
          api.getTestModules()
        ]);
        
        if (positions.length > 0) setJobPositions(positions);
        if (modules.length > 0) setAllTestModules(modules);

        const savedRole = localStorage.getItem('buana_role') as UserRole;
        const savedCandidate = localStorage.getItem('buana_candidate');
        
        if (savedRole === UserRole.ADMIN) {
          setRole(UserRole.ADMIN);
        } else if (savedRole === UserRole.CANDIDATE && savedCandidate) {
          const candData = JSON.parse(savedCandidate);
          setCandidate(candData);
          setRole(UserRole.CANDIDATE);
          
          if (candData.status !== 'COMPLETED' && candData.package && candData.package.length > 0) {
            const currentTestId = candData.package[candData.currentTestIndex];
            const mod = (modules.length > 0 ? modules : allTestModules).find(m => m.id === currentTestId);
            if (mod) setActiveTestModule(mod);
          }
        }
      } catch (err) {
        console.warn("Backend not detected, using fallback engine.");
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (role === UserRole.ADMIN) {
      api.getParticipants().then(data => { if (data.length > 0) setAllCandidates(data); }).catch(() => {});
    }
  }, [role, activeAdminTab]);

  const handleLogout = () => { 
    localStorage.removeItem('buana_role');
    localStorage.removeItem('buana_candidate');
    api.clearSession();
    window.location.reload(); 
  };

  const handleRegister = async () => {
    if (!registration.name || !registration.whatsapp || !registration.appliedPositionId) {
      showToast("Lengkapi profil dan jabatan yang dilamar.", "error");
      return;
    }

    setIsRegistering(true);
    try {
      const response = await api.register(registration);
      const pos = jobPositions.find(p => p.id.toString() === registration.appliedPositionId.toString());
      if (!pos) throw new Error("Posisi tidak valid.");
      
      const testPackage = pos.testIds && pos.testIds.length > 0 ? pos.testIds : ['tm_disc']; 
      
      const newCand: Candidate = {
        id: response.id,
        name: registration.name,
        whatsapp: registration.whatsapp,
        address: registration.address,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos.title,
        package: testPackage
      };
      
      localStorage.setItem('buana_role', UserRole.CANDIDATE);
      localStorage.setItem('buana_candidate', JSON.stringify(newCand));
      setCandidate(newCand);
      setRole(UserRole.CANDIDATE);
      
      const firstModule = allTestModules.find(m => m.id === testPackage[0]);
      if (firstModule) setActiveTestModule(firstModule);
      showToast("Pendaftaran berhasil. Silakan mulai tes.", "success");
    } catch (err: any) {
      showToast("Offline Mode: Simulasi registrasi...", "info");
      const pos = jobPositions.find(p => p.id.toString() === registration.appliedPositionId.toString());
      const testPackage = pos?.testIds || ['tm_disc'];
      const fakeCand: Candidate = {
        id: 'fake-' + Date.now(),
        name: registration.name,
        whatsapp: registration.whatsapp,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos?.title || 'Unknown',
        package: testPackage
      };
      setCandidate(fakeCand);
      setRole(UserRole.CANDIDATE);
      const firstModule = allTestModules.find(m => m.id === testPackage[0]);
      if (firstModule) setActiveTestModule(firstModule);
    } finally {
      setIsRegistering(false);
    }
  };

  const onTestComplete = async (testResults: any) => {
    if (!candidate || !activeTestModule) return;
    const isLast = candidate.currentTestIndex === candidate.package.length - 1;
    
    try {
      await api.submitTest(candidate.id, activeTestModule.type, testResults, isLast);
    } catch (err) {
      console.warn("Offline save locally only.");
    }

    const nextIdx = candidate.currentTestIndex + 1;
    const updatedCand: Candidate = {
      ...candidate,
      status: isLast ? 'COMPLETED' : 'IN_PROGRESS',
      currentTestIndex: nextIdx,
      results: { ...candidate.results, [activeTestModule.type.toLowerCase()]: testResults }
    };
    
    if (isLast) {
      setActiveTestModule(null);
      showToast("Rangkaian asesmen tuntas.", "success");
    } else {
      const nextTestId = candidate.package[nextIdx];
      const nextModule = allTestModules.find(m => m.id === nextTestId);
      if (nextModule) {
        setActiveTestModule(nextModule);
        setCurrentDiscIndex(0);
        setCurrentPapiIndex(0);
      }
    }
    setCandidate(updatedCand);
    localStorage.setItem('buana_candidate', JSON.stringify(updatedCand));
  };

  const renderActiveTest = () => {
    if (!activeTestModule) return <div className="p-20 text-center font-black text-slate-400">MEMUAT MODUL...</div>;

    switch (activeTestModule.type) {
      case TestType.DISC: return renderDisc();
      case TestType.PAPI: return renderPapi();
      case TestType.KRAEPELIN: 
        return <KraepelinTest config={activeTestModule.config} onComplete={(res) => onTestComplete(res.correct_counts)} />;
      case TestType.ISHIHARA: 
        return <IshiharaTest questions={activeTestModule.questions || []} onComplete={(res) => {
            const results = calculateIshiharaScore(res.answers, activeTestModule.questions || []);
            onTestComplete(results);
        }} />;
      default: return <div className="p-20 text-center text-slate-400">MODUL {activeTestModule.type} BELUM DIDUKUNG</div>;
    }
  };

  const renderDisc = () => {
    const questions = activeTestModule?.questions && activeTestModule.questions.length > 0 
        ? activeTestModule.questions as any[]
        : DISC_QUESTIONS;
        
    const q = questions[currentDiscIndex];
    if (!q) return null;
    
    const currentAns = discAnswers[q.id] || { most: '', least: '' };

    const handleSelect = (dim: string, type: 'most' | 'least') => {
      const nextAns = { ...currentAns, [type]: dim };
      if (type === 'most' && nextAns.least === dim) nextAns.least = '';
      if (type === 'least' && nextAns.most === dim) nextAns.most = '';
      
      setDiscAnswers(prev => ({ ...prev, [q.id]: nextAns }));
    };

    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 w-full px-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-10">
           <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Tes Karakter Kerja (DISC)</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Butir {currentDiscIndex + 1} / {questions.length}</p>
           </div>
        </div>
        <div className="space-y-4">
          {q.options.map((opt: any, idx: number) => (
            <div key={idx} className="flex items-center gap-6 p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-emerald-200 group">
              <div className="flex-1 font-bold text-slate-700 text-xl">{opt.text}</div>
              <div className="flex gap-4">
                 <button onClick={() => handleSelect(opt.most, 'most')} className={`w-16 h-16 rounded-2xl font-black text-xs transition-all ${currentAns.most === opt.most ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 text-slate-300 hover:text-emerald-600'}`}>P</button>
                 <button onClick={() => handleSelect(opt.least, 'least')} className={`w-16 h-16 rounded-2xl font-black text-xs transition-all ${currentAns.least === opt.least ? 'bg-rose-50 text-white shadow-xl shadow-rose-500/30' : 'bg-slate-50 text-slate-300 hover:text-rose-500'}`}>K</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-10">
          <button onClick={() => setCurrentDiscIndex(p => Math.max(0, p-1))} disabled={currentDiscIndex === 0} className="px-12 py-6 font-black text-[10px] uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Sebelumnya</button>
          <button 
            onClick={() => {
                if (currentDiscIndex < questions.length - 1) setCurrentDiscIndex(p => p+1);
                else {
                    const results = calculateDiscScore(discAnswers);
                    onTestComplete(results);
                }
            }} 
            disabled={!currentAns.most || !currentAns.least}
            className="bg-emerald-600 text-white px-16 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
          >
            {currentDiscIndex === questions.length - 1 ? 'Kirim Hasil' : 'Berikutnya'}
          </button>
        </div>
      </div>
    );
  };

  const renderPapi = () => {
    const questions = activeTestModule?.questions && activeTestModule.questions.length > 0 
        ? activeTestModule.questions as any[]
        : PAPI_QUESTIONS; 

    const q = questions[currentPapiIndex];
    if (!q) return <div className="text-center p-10">Soal PAPI tidak ditemukan.</div>;

    const handleSelect = (choice: 'a' | 'b') => {
        const nextAnswers = { ...papiAnswers, [currentPapiIndex]: choice };
        setPapiAnswers(nextAnswers);

        setTimeout(() => {
            if (currentPapiIndex < questions.length - 1) {
                setCurrentPapiIndex(prev => prev + 1);
            } else {
                onTestComplete(nextAnswers);
            }
        }, 200); 
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-500 px-4">
             <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
                <div>
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">TES KEPRIBADIAN (PAPI)</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Perception and Preference Inventory</p>
                </div>
                <div className="text-right">
                   <p className="text-4xl font-black text-blue-600 tracking-tighter">
                      {currentPapiIndex + 1} <span className="text-slate-300 text-lg">/ {questions.length}</span>
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => handleSelect('a')}
                    className={`group relative p-10 rounded-[2.5rem] border-2 text-left transition-all hover:scale-[1.02] active:scale-95
                    ${papiAnswers[currentPapiIndex] === 'a' 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/30' 
                        : 'bg-white border-slate-100 hover:border-emerald-400 hover:bg-emerald-50'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mb-4 transition-colors
                        ${papiAnswers[currentPapiIndex] === 'a' ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-200 group-hover:text-emerald-700'}`}>
                        A
                    </div>
                    <p className="text-lg font-bold leading-relaxed">{q.pair?.a?.text || 'Pernyataan A'}</p>
                </button>

                <button 
                    onClick={() => handleSelect('b')}
                    className={`group relative p-10 rounded-[2.5rem] border-2 text-left transition-all hover:scale-[1.02] active:scale-95
                    ${papiAnswers[currentPapiIndex] === 'b' 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-emerald-500/30' 
                        : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mb-4 transition-colors
                        ${papiAnswers[currentPapiIndex] === 'b' ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-200 group-hover:text-blue-700'}`}>
                        B
                    </div>
                    <p className="text-lg font-bold leading-relaxed">{q.pair?.b?.text || 'Pernyataan B'}</p>
                </button>
             </div>
             
             <p className="text-center mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                Pilih satu pernyataan yang paling menggambarkan diri Anda
             </p>
        </div>
    );
  };

  if (isInitializing) return <div className="min-h-screen bg-[#0f2e26] flex items-center justify-center text-emerald-500 font-black tracking-[0.5em] animate-pulse uppercase">BUANA ENGINE INITIALIZING...</div>;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f2e26]">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="bg-[#134e40] w-full max-w-5xl rounded-[70px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-emerald-800/20">
          <div className="w-full md:w-1/2 p-12 lg:p-24 flex flex-col justify-center">
            <BuanaLogo className="mb-14 scale-125 origin-left" inverse />
            <h2 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase leading-none">{loginContext === 'ADMIN' ? 'HR Portal' : 'Selamat Datang'}</h2>
            <div className="space-y-6 mt-10">
              {loginContext === 'ADMIN' ? (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <input type="text" value={adminAuth.user} onChange={e => setAdminAuth({...adminAuth, user: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] text-white border-none outline-none focus:ring-2 focus:ring-emerald-400 font-bold" placeholder="Username (any)" />
                  <input type="password" value={adminAuth.pass} onChange={e => setAdminAuth({...adminAuth, pass: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] text-white border-none outline-none focus:ring-2 focus:ring-emerald-400 font-bold" placeholder="Password (any)" />
                  <button onClick={() => { setRole(UserRole.ADMIN); localStorage.setItem('buana_role', UserRole.ADMIN); showToast("Otentikasi berhasil.", "success"); }} className="w-full py-6 rounded-full bg-emerald-400 text-emerald-950 font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all">Sign In ➔</button>
                  <button onClick={() => setLoginContext('CANDIDATE')} className="w-full text-emerald-500/60 font-black text-[9px] uppercase tracking-widest hover:text-emerald-400">← Back to Registration</button>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <input type="text" value={registration.name} onChange={e => setRegistration({...registration, name: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Nama Lengkap" />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="tel" value={registration.whatsapp} onChange={e => setRegistration({...registration, whatsapp: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] text-white font-bold outline-none focus:ring-2 focus:ring-emerald-400" placeholder="WhatsApp" />
                     <select value={registration.appliedPositionId} onChange={e => setRegistration({...registration, appliedPositionId: e.target.value})} className="w-full px-8 py-5 rounded-full bg-[#063b2f] text-white font-bold outline-none cursor-pointer focus:ring-2 focus:ring-emerald-400">
                        <option value="">Pilih Posisi</option>
                        {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                     </select>
                  </div>
                  <button onClick={handleRegister} disabled={isRegistering} className="w-full py-6 mt-8 rounded-full bg-emerald-500 text-emerald-950 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {isRegistering ? 'Processing...' : 'Start Assessment ➔'}
                  </button>
                  <button onClick={() => setLoginContext('ADMIN')} className="w-full text-emerald-500/20 font-black text-[9px] uppercase pt-12 tracking-widest hover:text-emerald-500/60">Akses Khusus HR</button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:flex w-1/2 bg-white items-center justify-center p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
             <div className="space-y-6 relative z-10">
                <h3 className="text-4xl font-black text-emerald-950 tracking-tighter uppercase leading-[0.9]">Digital<br/><span className="text-emerald-600">Psychometrics</span></h3>
                <p className="text-slate-400 font-medium italic text-lg px-4 italic leading-relaxed">"Measuring potential, unlocking performance."</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <aside className="w-80 bg-white border-r border-slate-100 flex flex-col p-10 z-[200] shadow-2xl">
          <BuanaLogo className="mb-14" />
          <nav className="space-y-3 flex-1">
            {[
              { id: 'DASHBOARD', label: 'Overview', icon: '📊' },
              { id: 'CANDIDATES', label: 'Participants', icon: '👥' },
              { id: 'POSITIONS', label: 'Job Slots', icon: '💼' },
              { id: 'TESTS', label: 'Bank Soal', icon: '⚙️' },
              { id: 'LIVE', label: 'Monitor', icon: '⚡' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveAdminTab(tab.id as any)} className={`w-full flex items-center gap-5 px-8 py-5 rounded-3xl font-black text-sm transition-all text-left ${activeAdminTab === tab.id ? 'bg-[#134e40] text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="uppercase tracking-tight">{tab.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto px-8 py-5 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-3xl transition-colors">🚪 Logout</button>
        </aside>
        <main className="flex-1 p-16 overflow-y-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]">
          {activeAdminTab === 'DASHBOARD' && (
            <AdminDashboard candidates={allCandidates} positions={jobPositions} />
          )}
          {activeAdminTab === 'POSITIONS' && <PositionManagement positions={jobPositions} availableModules={allTestModules} onUpdate={setJobPositions} showToast={showToast} />}
          {activeAdminTab === 'TESTS' && <TestManagement testModules={allTestModules} onUpdate={setAllTestModules} showToast={showToast} />}
          {activeAdminTab === 'LIVE' && <TokenRegistry />}
          {activeAdminTab === 'CANDIDATES' && (
             <div className="bg-white rounded-[4rem] p-16 shadow-xl border border-slate-100 animate-in fade-in duration-500">
               <table className="w-full text-left">
                 <thead className="bg-slate-50/50">
                   <tr>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {allCandidates.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-10 py-10">
                          <p className="font-black text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">{c.name}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{c.whatsapp}</p>
                        </td>
                        <td className="px-10 py-10 text-center">
                           <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {c.status}
                           </span>
                        </td>
                        <td className="px-10 py-10 text-right">
                           <button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Laporan ➔</button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          )}
        </main>
        {candidate && role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[250] overflow-y-auto p-12 flex flex-col items-center animate-in fade-in duration-300">
            <div className="w-full max-w-5xl flex justify-between items-center mb-10">
               <BuanaLogo inverse />
               <button onClick={() => setCandidate(null)} className="text-white px-10 py-5 font-black text-xs uppercase tracking-widest bg-white/10 rounded-2xl hover:bg-rose-500 transition-all">TUTUP [X]</button>
            </div>
            <ReportView candidate={candidate} showToast={showToast} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-500 selection:text-white">
       {toast && <Toast {...toast} onClose={() => setToast(null)} />}
       <nav className="bg-white border-b-4 border-emerald-500/10 px-12 py-6 flex justify-between items-center sticky top-0 z-[120] shadow-xl backdrop-blur-xl bg-white/80">
          <BuanaLogo className="h-10" />
          <div className="flex items-center gap-8">
             <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kandidat</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{candidate?.name}</p>
             </div>
             <div className="bg-emerald-50 px-10 py-4 rounded-[2rem] border border-emerald-100 flex flex-col items-center shadow-sm">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Modul {candidate?.currentTestIndex! + 1} / {candidate?.package?.length || 0}</span>
                <span className="text-sm font-black text-emerald-950 uppercase">{activeTestModule?.title || 'Menyiapkan...'}</span>
             </div>
             <button onClick={handleLogout} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">🚪</button>
          </div>
       </nav>
       <main className="flex-1 p-4 md:p-12 flex items-center justify-center relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
         {candidate?.status === 'COMPLETED' ? (
           <div className="text-center space-y-12 bg-white p-12 md:p-24 rounded-[5rem] shadow-2xl animate-in zoom-in-95 border border-slate-100 w-full max-w-2xl">
              <div className="w-32 h-32 rounded-[3rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl mb-14 animate-bounce"><svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
              <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">Asesmen Selesai</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Jawaban Anda telah tersimpan. Terima kasih.</p>
              <button onClick={handleLogout} className="w-full text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest bg-emerald-600 shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all">Keluar Portal</button>
           </div>
         ) : renderActiveTest()}
       </main>
    </div>
  );
};

export default App;