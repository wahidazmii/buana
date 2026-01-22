
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
const DARK_EMERALD = '#064e3b';

const BuanaLogo: React.FC<{ className?: string; inverse?: boolean }> = ({ className = "h-8", inverse = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center relative shadow-sm overflow-hidden ${inverse ? 'bg-white' : ''}`} style={{ backgroundColor: inverse ? 'white' : BUANA_GREEN }}>
      <div className={`w-5 h-5 rounded-tr-full transform -rotate-45 translate-y-1 ${inverse ? '' : 'bg-white'}`} style={{ backgroundColor: inverse ? BUANA_GREEN : 'white' }}></div>
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
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'candidates' | 'positions'>('dashboard');
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

  const [registration, setRegistration] = useState({ name: '', whatsapp: '', address: '', appliedPositionId: '' });

  // Load Positions
  useEffect(() => {
    api.getActivePositions().then(setJobPositions);
  }, []);

  // Admin Data Sync
  useEffect(() => {
    if (role === UserRole.ADMIN) {
      api.getAdminStats().then(setAdminStats);
      api.getParticipants().then(setAllCandidates);
    }
  }, [role, activeAdminTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });
  const handleLogout = () => { window.location.reload(); };

  const handleRegister = async () => {
    if (!registration.name || !registration.whatsapp || !registration.address || !registration.appliedPositionId) {
      showToast("Harap lengkapi semua data pendaftaran.", "error");
      return;
    }
    try {
      const response = await api.register(registration);
      const pos = jobPositions.find(p => p.id === registration.appliedPositionId);
      
      const newCand: Candidate = {
        id: response.id,
        ...registration,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos?.title || 'Unknown',
        package: pos?.testIds || ['tm_disc']
      };
      
      setCandidate(newCand);
      setRole(UserRole.CANDIDATE);
      startNextTest(newCand);
      showToast("Pendaftaran berhasil. Selamat mengerjakan tes.", "success");
    } catch (err) {
      showToast("Gagal melakukan registrasi.", "error");
    }
  };

  const startNextTest = (currentCand: Candidate) => {
    const nextTestId = currentCand.package[currentCand.currentTestIndex];
    if (nextTestId) {
      const module = testModules.find(m => m.id === nextTestId);
      if (module) setActiveTestModule(module);
    } else {
      setCandidate({ ...currentCand, status: 'COMPLETED' });
      setActiveTestModule(null);
    }
  };

  const onTestComplete = async (testResults: any) => {
    if (!candidate || !activeTestModule) return;
    
    const isLast = candidate.currentTestIndex === candidate.package.length - 1;
    
    try {
      await api.submitTest(candidate.id, activeTestModule.type, testResults, isLast);
      
      const updatedCand: Candidate = {
        ...candidate,
        currentTestIndex: candidate.currentTestIndex + 1,
        results: { ...candidate.results, [activeTestModule.type.toLowerCase()]: testResults }
      };
      
      setCandidate(updatedCand);
      startNextTest(updatedCand);
    } catch (err) {
      showToast("Koneksi gagal saat menyimpan hasil tes.", "error");
    }
  };

  const renderActiveTest = () => {
    if (!activeTestModule) return null;
    switch (activeTestModule.type) {
      case TestType.DISC: return renderDisc();
      case TestType.KRAEPELIN: return <KraepelinTest config={activeTestModule.config} onComplete={onTestComplete} />;
      case TestType.ISHIHARA: return <IshiharaTest questions={activeTestModule.questions || []} onComplete={(res) => {
        const correctKeys: Record<string, string> = {};
        activeTestModule.questions?.forEach(q => correctKeys[q.id] = q.correctOptionId || '');
        onTestComplete(calculateIshiharaScore(res.answers, correctKeys));
      }} />;
      default: return null;
    }
  };

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
                 <button onClick={() => handleSelect(idx, 'most')} className={`w-14 h-14 rounded-2xl font-black transition-all ${currentAns.most === idx ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-300 hover:text-emerald-600'}`}>P</button>
                 <button onClick={() => handleSelect(idx, 'least')} className={`w-14 h-14 rounded-2xl font-black transition-all ${currentAns.least === idx ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-300 hover:text-rose-500'}`}>K</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-8">
          <button onClick={() => setCurrentDiscIndex(p => Math.max(0, p-1))} disabled={currentDiscIndex === 0} className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 disabled:opacity-0">Sebelumnya</button>
          <button 
            onClick={() => currentDiscIndex < DISC_QUESTIONS.length - 1 ? setCurrentDiscIndex(p => p+1) : onTestComplete(calculateDiscScore(discAnswers))} 
            disabled={currentAns.most === -1 || currentAns.least === -1}
            className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all hover:scale-105"
          >
            {currentDiscIndex === DISC_QUESTIONS.length - 1 ? 'Selesai & Kirim' : 'Selanjutnya'}
          </button>
        </div>
      </div>
    );
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="bg-white w-full max-w-7xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[850px]">
          <div className="w-full lg:w-3/5 p-8 lg:p-20 flex flex-col justify-center bg-white relative">
            <BuanaLogo className="h-10 mb-10" />
            <h1 className="text-5xl font-black tracking-tight mb-4" style={{ color: DARK_EMERALD }}>{loginContext === 'ADMIN' ? 'Portal Administrasi' : 'Mulai Karir Profesional'}</h1>
            {loginContext === 'ADMIN' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <input type="text" placeholder="Admin ID" className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" />
                <input type="password" placeholder="••••••••" className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" />
                <button onClick={() => { setRole(UserRole.ADMIN); showToast("Selamat datang Admin.", "success"); }} className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest">MASUK PANEL KONTROL</button>
                <button onClick={() => setLoginContext('CANDIDATE')} className="w-full text-slate-300 font-black text-[10px] uppercase tracking-widest">Kembali ke Pendaftaran</button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <input type="text" value={registration.name} onChange={e => setRegistration({...registration, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" placeholder="Nama Lengkap" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="tel" value={registration.whatsapp} onChange={e => setRegistration({...registration, whatsapp: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg" placeholder="No. WhatsApp Aktif" />
                    <select value={registration.appliedPositionId} onChange={e => setRegistration({...registration, appliedPositionId: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg">
                      <option value="">Pilih Posisi Jabatan</option>
                      {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <textarea value={registration.address} onChange={e => setRegistration({...registration, address: e.target.value})} className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg resize-none" rows={3} placeholder="Alamat Lengkap Domisili"></textarea>
                </div>
                <button onClick={handleRegister} className="w-full py-7 bg-emerald-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest">Mulai Tes Seleksi ➔</button>
                <button onClick={() => setLoginContext('ADMIN')} className="w-full text-slate-200 hover:text-slate-400 font-bold text-[10px] uppercase tracking-widest transition-colors">Administrasi Portal</button>
              </div>
            )}
          </div>
          <div className="hidden lg:block w-2/5 relative bg-emerald-900 overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale"></div>
             <div className="absolute z-20 flex flex-col items-center justify-center h-full w-full text-center p-12">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] mb-8 flex items-center justify-center border border-white/20">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Paperless Recruitment</h2>
                <p className="text-emerald-100 font-medium leading-relaxed italic">"Membangun masa depan industri kertas yang berkelanjutan dengan talenta terbaik."</p>
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
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'candidates', label: 'Data Pelamar', icon: '👥' },
              { id: 'positions', label: 'Manajemen Posisi', icon: '💼' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveAdminTab(tab.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeAdminTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-6 py-4 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">Keluar Portal</button>
        </aside>
        <main className="flex-1 p-12 overflow-y-auto">
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-12">
               <div className="grid grid-cols-4 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] border-b-8 border-emerald-500 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pelamar</p>
                     <h3 className="text-4xl font-black text-slate-800">{adminStats.total}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border-b-8 border-blue-500 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selesai Tes</p>
                     <h3 className="text-4xl font-black text-slate-800">{adminStats.completed}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border-b-8 border-amber-500 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lowongan Aktif</p>
                     <h3 className="text-4xl font-black text-slate-800">{adminStats.activePositions}</h3>
                  </div>
               </div>
               <div className="bg-emerald-900 rounded-[3rem] p-12 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="relative z-10">
                     <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Selamat Datang, Admin HR.</h2>
                     <p className="text-emerald-100 max-w-lg opacity-80 leading-relaxed">Sistem seleksi digital PT. Buana Megah siap membantu Anda menemukan talenta yang tepat secara objektif dan efisien.</p>
                  </div>
                  <div className="w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl absolute -right-20 -bottom-20"></div>
               </div>
            </div>
          )}
          {activeAdminTab === 'candidates' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Database Pelamar Aktif</h3>
                  <div className="relative">
                    <input type="text" placeholder="Cari Nama / Jabatan..." value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 font-bold text-sm w-72 pl-12" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Nama Peserta</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">Jabatan</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-right">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {allCandidates.filter(c => c.name.toLowerCase().includes(candidateSearch.toLowerCase())).map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-8">
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400 italic">WA: {c.whatsapp}</p>
                          </td>
                          <td className="px-8 py-8 text-sm font-black text-emerald-600 uppercase tracking-tight">{c.appliedPosition}</td>
                          <td className="px-8 py-8 text-center">
                             <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                          </td>
                          <td className="px-8 py-8 text-right">
                             <div className="flex justify-end gap-3">
                                <button onClick={() => api.deleteParticipant(c.id).then(() => setAllCandidates(p => p.filter(x => x.id !== c.id)))} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition-all">🗑️</button>
                                <button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Lihat Detail ➔</button>
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
        </main>
        {candidate && role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] overflow-y-auto p-12 flex flex-col items-center">
            <button onClick={() => setCandidate(null)} className="self-end bg-white/10 text-white px-10 py-5 rounded-[2rem] hover:bg-rose-500 mb-12 font-black text-xs uppercase tracking-widest transition-all">Tutup Pratinjau ✖</button>
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
             <div className="flex flex-col items-end"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peserta Tes</p><p className="text-sm font-black text-slate-800">{candidate?.name}</p></div>
             <div className="h-10 w-[1px] bg-slate-100"></div>
             <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-0.5">Tes {candidate?.currentTestIndex! + 1} / {candidate?.package.length}</span>
                <span className="text-xs font-black text-emerald-900 uppercase">{activeTestModule?.title}</span>
             </div>
          </div>
       </nav>
       <main className="flex-1 p-12 flex items-center justify-center">
         {candidate?.status === 'COMPLETED' ? (
           <div className="text-center space-y-10 max-w-xl bg-white p-24 rounded-[4rem] shadow-2xl border border-slate-50 animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl mb-12"><svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Asesmen Selesai</h2>
              <p className="text-slate-500 font-medium italic text-lg leading-relaxed">Terima kasih atas partisipasi Anda. Seluruh hasil tes telah tersinkronisasi dengan database pusat PT. Buana Megah.</p>
              <button onClick={handleLogout} className="w-full text-white py-7 rounded-[2.5rem] font-black text-lg shadow-xl hover:scale-105 transition-all uppercase tracking-widest" style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>KELUAR & SELESAI</button>
           </div>
         ) : renderActiveTest()}
       </main>
    </div>
  );
};

export default App;
