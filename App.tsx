
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Candidate, UserRole, TestType, JobPosition, TestModule, RecommendationLevel } from './types';
import { DISC_QUESTIONS } from './constants';
import { calculateDiscScore, calculateIshiharaScore } from './services/scoringService';
import ReportView from './components/ReportView';
import PositionManagement from './components/PositionManagement';
import TestManagement from './components/TestManagement';
import KraepelinTest from './components/KraepelinTest';
import IshiharaTest from './components/IshiharaTest';
import { authService } from './services/authService';
const BUANA_GREEN = '#10B981';
const API_BASE = '/api';
const DARK_EMERALD = '#064e3b';
const SOFT_BG = '#F3F4F6';
const INPUT_FILL = '#F9FAFB';

const CHART_COLORS = [BUANA_GREEN, '#34D399', '#D1FAE5', '#F59E0B', '#EF4444'];

const BuanaLogo: React.FC<{ className?: string; color?: string; inverse?: boolean }> = ({ className = "h-8", color = BUANA_GREEN, inverse = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <img src="./images/logo.png" alt="Logo" className="w-full h-full object-contain" />
  </div>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-600 border-emerald-400',
    error: 'bg-rose-600 border-rose-400',
    info: 'bg-blue-500 border-blue-300',
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl border-2 animate-in slide-in-from-right duration-300 ${styles[type]}`}>
      <span className="font-black text-xs uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="hover:opacity-50 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [activeTestModule, setActiveTestModule] = useState<TestModule | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'positions' | 'test_management' | 'candidates' | 'settings'>('dashboard');
  const [loginContext, setLoginContext] = useState<'CANDIDATE' | 'ADMIN'>('CANDIDATE');
  const [candidateSearch, setCandidateSearch] = useState('');

  const [discAnswers, setDiscAnswers] = useState<{ id: number; most: number; least: number }[]>([]);
  const [currentDiscIndex, setCurrentDiscIndex] = useState(0);

  const [testModules, setTestModules] = useState<TestModule[]>([]);

  useEffect(() => {
    fetchTestModules();
    // ... existing authenticaton logic ...
  }, []);

  const fetchTestModules = async () => {
    try {
      const response = await fetch(`${API_BASE}/modules.php`);
      if (response.ok) {
        const data = await response.json();
        setTestModules(data);
      }
    } catch (error) {
      console.error("Failed to fetch modules", error);
    }
  };

  const handleUpdateTestModules = async (updatedModules: TestModule[]) => {
    // Find which module changed and save it
    const changedModule = updatedModules.find((mod, idx) => {
      const original = testModules[idx];
      return !original || JSON.stringify(mod) !== JSON.stringify(original);
    }) || updatedModules.find(m => !testModules.some(tm => tm.id === m.id));

    setTestModules(updatedModules);

    if (changedModule) {
      await saveTestModule(changedModule);
    }
  };

  const saveTestModule = async (module: TestModule) => {
    try {
      await fetch(`${API_BASE}/modules.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAdminToken()}`
        },
        body: JSON.stringify(module)
      });
      fetchTestModules(); // Refresh to ensure sync
      showToast("Modul berhasil disimpan", "success");
    } catch (error) {
      showToast("Gagal menyimpan modul", "error");
    }
  };

  const [jobPositions, setJobPositions] = useState<JobPosition[]>([
    { id: 'pos1', title: 'Machine Operator', department: 'Production', isActive: true, applicantCount: 15, testIds: ['tm_ishihara', 'tm_disc', 'tm_kraepelin'] },
    { id: 'pos2', title: 'HR Generalist', department: 'HR & GA', isActive: true, applicantCount: 42, testIds: ['tm_disc', 'tm_k3'] },
    { id: 'pos3', title: 'QA Analyst', department: 'Quality Control', isActive: false, applicantCount: 3, testIds: ['tm_ishihara', 'tm_disc', 'tm_k3', 'tm_kraepelin'] },
  ]);

  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({ gemini_api_key: '' });

  useEffect(() => {
    // Initial data fetch
    fetchJobPositions();

    // Check for existing sessions
    const { id, token } = authService.getParticipantSession();
    if (id && token) {
      // Potentially resume session
      // For now, we'll keep it simple
    }

    const checkAdminAuth = async () => {
      if (authService.isAdminAuthenticated()) {
        try {
          const response = await fetch(`${API_BASE}/check-auth.php`, {
            headers: { 'Authorization': `Bearer ${authService.getAdminToken()}` }
          });
          if (response.ok) {
            setRole(UserRole.ADMIN);
            fetchCandidates();
            fetchSettings();
          } else {
            handleLogout();
          }
        } catch (error) {
          handleLogout();
        }
      }
    };

    checkAdminAuth();
  }, []);

  const fetchJobPositions = async () => {
    try {
      const response = await fetch(`${API_BASE}/positions.php`);
      const data = await response.json();
      setJobPositions(data);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin.php`, {
        headers: {
          'Authorization': `Bearer ${authService.getAdminToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllCandidates(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };
  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings.php`, {
        headers: { 'Authorization': `Bearer ${authService.getAdminToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSaveSettings = async (newSettings: Record<string, string>) => {
    try {
      const response = await fetch(`${API_BASE}/settings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAdminToken()}`
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        showToast("Pengaturan berhasil disimpan.", "success");
      }
    } catch (error) {
      showToast("Gagal menyimpan pengaturan", "error");
    }
  };

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    activePositions: 0,
    avgScore: 0
  });

  const [monthlyTrends, setMonthlyTrends] = useState<{ name: string; count: number }[]>([]);
  const [qualityDistribution, setQualityDistribution] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (role === UserRole.ADMIN) {
      fetchDashboardStats();
    }
  }, [role]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin.php?action=stats`, {
        headers: { 'Authorization': `Bearer ${authService.getAdminToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total,
          completed: data.completed,
          activePositions: data.activePositions,
          avgScore: data.avgScore
        });
        setMonthlyTrends(data.monthlyTrends || []);
        setQualityDistribution(data.qualityDistribution || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
  };

  const [registration, setRegistration] = useState({
    name: '', whatsapp: '', dob: '', education: '', address: '', appliedPositionId: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    authService.logout();
    authService.clearParticipantSession();
    setRole(null);
    setCandidate(null);
    setActiveTestModule(null);
    setDiscAnswers([]);
    setCurrentDiscIndex(0);
    setLoginContext('CANDIDATE');
    showToast('Logout berhasil', 'info');
  };

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      showToast('Harap isi username dan password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(adminUsername, adminPassword);
      setRole(UserRole.ADMIN);
      fetchCandidates();
      showToast('Selamat Datang di Portal HRD Buana Megah.', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startNextTest = (currentCandidate: Candidate) => {
    const nextIndex = currentCandidate.currentTestIndex;
    const nextModuleId = currentCandidate.package[nextIndex];

    if (nextModuleId) {
      const module = testModules.find(m => m.id === nextModuleId);
      if (module) {
        setActiveTestModule(module);
        return;
      }
    }

    const finalCandidate: Candidate = { ...currentCandidate, status: 'COMPLETED' };
    setCandidate(finalCandidate);
    setAllCandidates(prev => prev.map(c => c.id === finalCandidate.id ? finalCandidate : c));
    setActiveTestModule(null);
    showToast("Semua rangkaian tes telah selesai. Terima kasih.", "success");
  };

  const handleRegisterAndStart = async () => {
    const selectedPosition = jobPositions.find(p => p.id === registration.appliedPositionId);

    if (!registration.name || !registration.whatsapp || !registration.address || !selectedPosition || !registration.dob) {
      showToast("Harap lengkapi seluruh data pendaftaran.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
      });

      if (!response.ok) throw new Error('Registrasi gagal');

      const data = await response.json();

      const birthYear = new Date(registration.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;

      const newCandidate: Candidate = {
        id: data.id,
        ...registration,
        age: calculatedAge,
        appliedPosition: selectedPosition.title,
        status: 'IN_PROGRESS',
        package: selectedPosition.testIds,
        currentTestIndex: 0
      };

      authService.setParticipantSession(data.id, data.token);
      setCandidate(newCandidate);
      setRole(UserRole.CANDIDATE);
      startNextTest(newCandidate);

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const finishCurrentTest = async (testData: any) => {
    if (!candidate) return;

    const { token } = authService.getParticipantSession();
    const isLast = candidate.currentTestIndex === candidate.package.length - 1;
    const testType = activeTestModule?.type;

    try {
      const response = await fetch(`${API_BASE}/submit_test.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: candidate.id,
          token: token,
          testType: testType,
          results: testData,
          isLast: isLast
        })
      });

      if (!response.ok) throw new Error('Gagal menyimpan hasil tes');

      const updatedCandidate: Candidate = {
        ...candidate,
        currentTestIndex: candidate.currentTestIndex + 1,
        results: { ...candidate.results, ...testData }
      };

      if (isLast) updatedCandidate.status = 'COMPLETED';

      setCandidate(updatedCandidate);
      setAllCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      startNextTest(updatedCandidate);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    const isSure = window.confirm(`⚠️ PERINGATAN KERAS!\n\nAnda akan menghapus data peserta: "${name}".\nSeluruh hasil tes (DISC, K3, dll) akan HILANG PERMANEN.\n\nApakah Anda yakin?`);

    if (isSure) {
      try {
        const response = await fetch(`${API_BASE}/admin.php?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authService.getAdminToken()}` }
        });
        if (response.ok) {
          setAllCandidates(prev => prev.filter(c => c.id !== id));
          showToast(`Data "${name}" berhasil dihapus secara permanen.`, "success");
        } else {
          showToast("Gagal menghapus data", "error");
        }
      } catch (error) {
        showToast("Error koneksi server", "error");
      }
    }
  };

  const handleUpdatePositions = async (updated: JobPosition[]) => {
    // This is tricky because the component passed the whole array.
    // In a real app, we'd handle individual create/update/delete.
    // For simplicity, we've implemented positions.php to handle individual saves.
    // Let's refactor PositionManagement to handle its own saves or pass a save function.

    // For now, let's just refresh the list after any external update, 
    // but the component itself should ideally handle the Save API.
    fetchJobPositions();
  };

  const handleSavePosition = async (posData: any) => {
    try {
      const response = await fetch(`${API_BASE}/positions.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAdminToken()}`
        },
        body: JSON.stringify(posData)
      });
      if (response.ok) {
        fetchJobPositions();
        return true;
      }
    } catch (error) {
      showToast("Gagal menyimpan posisi", "error");
    }
    return false;
  };

  const handleDeletePosition = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/positions.php?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getAdminToken()}` }
      });
      if (response.ok) {
        fetchJobPositions();
        showToast("Posisi berhasil dihapus.", "success");
      }
    } catch (error) {
      showToast("Gagal menghapus posisi", "error");
    }
  };

  const renderActiveTest = () => {
    if (!activeTestModule) return null;

    switch (activeTestModule.type) {
      case TestType.DISC:
        return renderDisc();
      case TestType.KRAEPELIN:
        return <KraepelinTest config={activeTestModule.config} onComplete={(data) => finishCurrentTest({ kraepelin: data })} />;
      case TestType.ISHIHARA:
        return (
          <IshiharaTest
            questions={activeTestModule.questions || []}
            onComplete={(data) => {
              const correctKeys: Record<string, string> = {};
              activeTestModule.questions?.forEach(q => correctKeys[q.id] = q.correctOptionId || '');
              const score = calculateIshiharaScore(data.answers, correctKeys);
              finishCurrentTest({ ishihara: score });
            }}
          />
        );
      case TestType.MCQ:
        return (
          <div className="max-w-2xl mx-auto p-12 bg-white rounded-[3rem] text-center space-y-8 shadow-2xl border border-slate-50">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">📝</div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{activeTestModule.title}</h2>
            <p className="text-slate-500 font-medium leading-relaxed italic">Modul tes pilihan ganda sedang dikerjakan. Pastikan Anda membaca setiap butir soal dengan teliti sebelum menjawab.</p>
            <button onClick={() => finishCurrentTest({ mcqScores: { [activeTestModule.id]: 80 } })} className="w-full text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all" style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>SIMULASI: SELESAIKAN MODUL</button>
          </div>
        );
      default:
        return <div>Test Module Error</div>;
    }
  };

  const renderDisc = () => {
    const currentQuestion = DISC_QUESTIONS[currentDiscIndex];
    if (!currentQuestion) return null;
    const currentSelection = discAnswers.find(a => a.id === currentQuestion.id) || { id: currentQuestion.id, most: -1, least: -1 };

    const handleSelect = (idx: number, type: 'most' | 'least') => {
      setDiscAnswers(prev => {
        const existing = prev.find(a => a.id === currentQuestion.id);
        let newEntry;
        if (existing) {
          newEntry = { ...existing, [type]: idx };
          if (type === 'most' && existing.least === idx) newEntry.least = -1;
          if (type === 'least' && existing.most === idx) newEntry.most = -1;
        } else {
          newEntry = { id: currentQuestion.id, most: type === 'most' ? idx : -1, least: type === 'least' ? idx : -1 };
        }
        return [...prev.filter(a => a.id !== currentQuestion.id), newEntry];
      });
    };

    return (
      <div className="space-y-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center border-b border-slate-50 pb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">TES GAYA KERJA (DISC)</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih satu yang paling (P) dan kurang (K) menggambarkan diri Anda.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-600">{currentDiscIndex + 1} <span className="text-slate-300 text-sm">/ {DISC_QUESTIONS.length}</span></p>
          </div>
        </div>
        <div className="space-y-4">
          {currentQuestion.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-emerald-100 transition-all group">
              <div className="flex-1 font-bold text-slate-700 text-lg">{opt.text}</div>
              <div className="flex gap-4">
                <button onClick={() => handleSelect(idx, 'most')} className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${currentSelection.most === idx ? 'bg-emerald-600 text-white' : 'bg-white text-slate-300 hover:text-emerald-600'}`}>P</button>
                <button onClick={() => handleSelect(idx, 'least')} className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${currentSelection.least === idx ? 'bg-rose-500 text-white' : 'bg-white text-slate-300 hover:text-rose-500'}`}>K</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-8">
          <button onClick={() => setCurrentDiscIndex(Math.max(0, currentDiscIndex - 1))} disabled={currentDiscIndex === 0} className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 disabled:opacity-0 transition-all">Sebelumnya</button>
          <button onClick={() => {
            if (currentDiscIndex < DISC_QUESTIONS.length - 1) {
              setCurrentDiscIndex(currentDiscIndex + 1);
            } else {
              const discResult = calculateDiscScore(discAnswers);
              finishCurrentTest({ disc: discResult });
            }
          }}
            disabled={currentSelection.most === -1 || currentSelection.least === -1}
            className="text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-20"
            style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>
            {currentDiscIndex === DISC_QUESTIONS.length - 1 ? 'Selesaikan Tes DISC' : 'Selanjutnya'}
          </button>
        </div>
      </div>
    );
  };

  const filteredCandidates = useMemo(() => {
    if (!candidateSearch) return allCandidates;
    const s = candidateSearch.toLowerCase();
    return allCandidates.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.appliedPosition || '').toLowerCase().includes(s) ||
      (c.education || '').toLowerCase().includes(s)
    );
  }, [allCandidates, candidateSearch]);

  if (!role) {
    const noOpenPositions = jobPositions.every(p => !p.isActive);
    if (loginContext === 'CANDIDATE' && noOpenPositions) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
          <BuanaLogo className="h-12 mb-12" />
          <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-8 border border-slate-100">
            <div className="w-24 h-24 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-4xl">🚫</div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">PENDAFTARAN DITUTUP</h2>
              <p className="text-slate-500 font-medium">Maaf, saat ini tidak ada lowongan yang dibuka. Silakan cek kembali di lain waktu.</p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={() => window.location.href = 'https://buanamegah.com'} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Kunjungi Website Utama</button>
              <button onClick={() => setLoginContext('ADMIN')} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest py-3">Login Administrator</button>
            </div>
          </div>
        </div>
      );
    }

    // THE PAPER FLOW - Candidate Registration UI
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans antialiased">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* Main Floating Card */}
        <div className="bg-white w-full max-w-7xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[850px] relative">

          {/* Left Side: Registration Form (3/5) */}
          <div className="w-full lg:w-3/5 p-8 lg:p-20 flex flex-col justify-center relative z-20">

            <div className="mb-12">
              <BuanaLogo className="h-20 mb-10" />
              <h1 className="text-5xl font-black tracking-tight mb-4" style={{ color: DARK_EMERALD }}>Mulai Karir Profesionalmu</h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Bergabunglah membangun masa depan industri kertas berkelanjutan bersama tim profesional PT. Buana Megah.
              </p>
            </div>

            <div className="space-y-8">
              {loginContext === 'ADMIN' ? (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Admin Identity</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <button
                    onClick={handleAdminLogin}
                    disabled={isLoading}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-[2rem] shadow-xl shadow-emerald-500/20 transform transition hover:-translate-y-1 mt-6 uppercase tracking-[0.2em] disabled:opacity-50"
                  >
                    {isLoading ? 'MENGHUBUNGI SERVER...' : 'MASUK PORTAL ADMIN'}
                  </button>
                  <button onClick={() => setLoginContext('CANDIDATE')} className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest py-2">Kembali ke Pendaftaran</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>Nama Lengkap (Sesuai KTP)</label>
                    <input
                      type="text"
                      value={registration.name}
                      onChange={e => setRegistration({ ...registration, name: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-bold text-lg"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>WhatsApp Aktif</label>
                      <input
                        type="tel"
                        value={registration.whatsapp}
                        onChange={e => setRegistration({ ...registration, whatsapp: e.target.value })}
                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg"
                        placeholder="0812..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>Posisi Dilamar</label>
                      <select
                        value={registration.appliedPositionId}
                        onChange={e => setRegistration({ ...registration, appliedPositionId: e.target.value })}
                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg text-slate-700 cursor-pointer appearance-none"
                      >
                        <option value="" disabled>-- Pilih Posisi --</option>
                        {jobPositions.filter(p => p.isActive).map(pos => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>Tanggal Lahir</label>
                      <input
                        type="date"
                        value={registration.dob}
                        onChange={e => setRegistration({ ...registration, dob: e.target.value })}
                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>Pendidikan Terakhir</label>
                      <select
                        value={registration.education}
                        onChange={e => setRegistration({ ...registration, education: e.target.value })}
                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg text-slate-700 cursor-pointer appearance-none"
                      >
                        <option value="">Pilih Pendidikan</option>
                        <option value="SMA/SMK">SMA / SMK Sederajat</option>
                        <option value="D3">Diploma (D3)</option>
                        <option value="S1/D4">Sarjana (S1) / D4</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: DARK_EMERALD }}>Alamat Domisili Lengkap</label>
                    <textarea
                      value={registration.address}
                      onChange={e => setRegistration({ ...registration, address: e.target.value })}
                      rows={2}
                      className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg resize-none"
                      placeholder="Jalan, RT/RW, Kecamatan, Kota..."
                    ></textarea>
                  </div>

                  <button
                    onClick={handleRegisterAndStart}
                    className="w-full py-7 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-emerald-500/30 transform transition hover:-translate-y-1 mt-6 uppercase tracking-[0.2em]"
                  >
                    Lanjut ke Tes Seleksi ➔
                  </button>

                  <button onClick={() => setLoginContext('ADMIN')} className="w-full text-slate-300 hover:text-slate-400 font-bold text-[10px] uppercase tracking-widest pt-4 transition-colors">
                    Administrasi Login
                  </button>
                </div>
              )}
            </div>

            <p className="mt-16 text-center text-xs text-slate-300 font-bold uppercase tracking-[0.3em]">
              © 2026 PT. BUANA MEGAH PAPER MILLS. RECRUITMENT PORTAL.
            </p>
          </div>

          {/* Right Side: Imagery & Testimonials (2/5) */}
          <div className="hidden lg:block w-2/5 relative bg-emerald-50 overflow-hidden">

            {/* Background Image */}
            <img
              src="./images/thumbnail.jpeg"
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
              alt="Factory Background"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-emerald-800/20"></div>

            {/* The Paper Flow: Custom SVG Curve Separator */}
            <div className="absolute top-0 bottom-0 left-0 w-24 z-10">
              <svg className="h-full w-full text-white fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0 C 70 0 30 50 30 50 C 30 50 70 100 0 100 L 0 100 Z" />
              </svg>
            </div>

            {/* The Glowing Sprout Visual Element - ADDED AS PER LEAD INSTRUCTIONS */}
            <div className="absolute z-20" style={{ top: '320px', left: '100px' }}>
              {/* Particle Container */}
              <div className="particle-container absolute inset-0 flex justify-center items-end pointer-events-none">
                <div className="particle p1"></div>
                <div className="particle p2"></div>
                <div className="particle p3"></div>
                <div className="particle p4"></div>
              </div>

              {/* Sprout SVG with Neon Glow */}
              <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(22,198,12,0.7)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 7C9 7 7 10 7 13C7 15 8 16 8 16C8 16 9 15 9 13C9 11 9 7 9 7Z" fill="#16C60C" />
                <path d="M15 7C15 7 17 10 17 13C17 15 16 16 16 16C16 16 15 15 15 13C15 11 15 7 15 7Z" fill="#16C60C" />
                <path d="M12 3C12 3 10 7 10 10C10 13 11 14 12 14C13 14 14 13 14 10C14 7 12 3 12 3Z" fill="#1BE40F" />
                <path d="M12 14C12 14 10.5 16 10.5 18C10.5 20 11 22 12 22C13 22 13.5 20 13.5 18C13.5 16 12 14 12 14Z" fill="#16C60C" />
                <path d="M8 21C8 21 10 23 16 23" stroke="#16C60C" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>

            {/* Testimonial / Brand Card */}
            <div className="absolute bottom-20 left-16 right-16 bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10 duration-1000 delay-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <span className="font-black text-white text-lg block uppercase tracking-tight leading-none">Culture & Growth</span>
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Employee Spotlight</span>
                </div>
              </div>
              <p className="text-white/90 font-medium leading-relaxed italic text-lg mb-6">
                "Lingkungan kerja yang mendukung inovasi dan keberlanjutan karir Anda melalui sistem asesmen berbasis kompetensi yang objektif."
              </p>
              <div className="h-1 w-20 bg-emerald-500/50 rounded-full"></div>
            </div>

            {/* Decorative Element: Floating Badge */}
            <div className="absolute top-12 right-12 bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">15 Posisi Baru Terbuka</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex font-[Inter]">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <aside className="w-72 bg-white flex flex-col sticky top-0 h-screen no-print shadow-sm border-r border-slate-100">
          <div className="p-8">
            <BuanaLogo className="h-8 mb-12 justify-center" />
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Ringkasan Eksekutif', icon: 'M4 6h16M4 12h16M4 18h16' },
                { id: 'positions', label: 'Manajemen Posisi', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1' },
                { id: 'test_management', label: 'Bank Soal & Config', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { id: 'candidates', label: 'Daftar Peserta', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'settings', label: 'Pengaturan Sistem', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveAdminTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all relative ${activeAdminTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {activeAdminTab === item.id && <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full" style={{ backgroundColor: BUANA_GREEN }}></div>}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-8 border-t border-slate-50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 text-rose-400 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">Keluar Portal</button>
          </div>
        </aside>

        <main className="flex-1 p-12 overflow-y-auto">
          <header className="mb-12 flex justify-between items-end no-print">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">ADMIN PORTAL</h2>
              <p className="text-slate-400 text-sm mt-1">Sistem Rekrutmen <span className="font-bold text-emerald-600">PT. Buana Megah</span>.</p>
            </div>
            <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Sistem Restorasi Aktif
            </div>
          </header>

          {activeAdminTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-emerald-500">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pelamar</p>
                    <span className="text-emerald-500 text-[9px] font-bold">▲ 12.5%</span>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800">{stats.total}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-blue-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selesai Tes</p>
                  <h3 className="text-4xl font-black text-slate-800">{stats.completed}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-amber-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Lowongan Open</p>
                  <h3 className="text-4xl font-black text-slate-800">{stats.activePositions}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 border-b-8 border-b-slate-400">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Indeks Performa</p>
                  <h3 className="text-4xl font-black text-slate-800">{stats.avgScore}%</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Tren Pelamar Bulanan</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={BUANA_GREEN} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={BUANA_GREEN} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="count" stroke={BUANA_GREEN} strokeWidth={6} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Kualitas Kandidat</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={qualityDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {qualityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    {qualityDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }}></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'candidates' && (
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 animate-in fade-in duration-700">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Database Pelamar</h3>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Cari Nama / Posisi / Pendidikan..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="bg-slate-50 px-12 py-4 rounded-2xl border-2 border-slate-50 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all w-96 shadow-sm"
                  />
                  <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Posisi</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">AI Scoring</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-10">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center font-black text-emerald-700 text-xl shadow-inner uppercase">{c.name.charAt(0)}</div>
                            <div className="relative group cursor-help">
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{c.name}</p>
                                <a href={`https://wa.me/${c.whatsapp}`} target="_blank" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-2.26 0-4.093 1.833-4.093 4.093 0 .713.181 1.385.498 1.972l-.53 1.942 1.983-.52c.567.31 1.21.488 1.892.488 2.26 0 4.093-1.833 4.093-4.093s-1.833-4.093-4.093-4.093zm3.172 5.86c-.134.22-.68.347-.935.372-.255.025-.506.01-.734-.047-.227-.057-.458-.168-.69-.333-.4-.286-.713-.672-.94-1.15-.094-.19-.138-.352-.138-.485 0-.134.045-.255.132-.363.088-.108.216-.182.35-.224.133-.042.276-.048.428-.018.15.03.31.11.478.238.168.128.29.24.364.335.074.094.113.182.113.264 0 .083-.039.172-.115.266-.077.094-.16.196-.25.305-.09.11-.184.22-.284.33z" /></svg>
                                </a>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.education} • {c.age || '20+'} Tahun</p>
                              <div className="absolute left-0 bottom-full mb-4 w-64 p-5 bg-slate-900 text-white rounded-3xl text-[10px] leading-relaxed opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl">
                                <p className="font-black text-emerald-400 uppercase tracking-widest mb-1">Domisili Peserta:</p>
                                {c.address || "Data alamat tidak tersedia"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{c.appliedPosition || 'UMUM'}</span>
                        </td>
                        <td className="px-8 py-10 text-center">
                          <span className={`inline-flex px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-8 py-10 text-center">
                          {c.results?.recommendation ? (
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.results.recommendation === 'Highly Recommended' ? 'bg-emerald-600 text-white' :
                              c.results.recommendation === 'Recommended' ? 'bg-emerald-400 text-white' :
                                'bg-amber-400 text-white'
                              }`}>
                              {c.results.recommendation}
                            </span>
                          ) : <span className="text-[10px] text-slate-200 font-black uppercase tracking-widest">Pending</span>}
                        </td>
                        <td className="px-8 py-10 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={() => handleDeleteCandidate(c.id, c.name)}
                              className="p-3 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Hapus Peserta Permanen"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button onClick={() => setCandidate(c)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 transition-all">Lihat Laporan ➔</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeAdminTab === 'positions' && (
            <PositionManagement
              positions={jobPositions}
              onSave={handleSavePosition}
              onDelete={handleDeletePosition}
              showToast={showToast}
            />
          )}
          {activeAdminTab === 'test_management' && <TestManagement testModules={testModules} onUpdate={handleUpdateTestModules} showToast={showToast} />}

          {activeAdminTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in rotate-in-1 duration-700">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                </div>
                <div className="relative z-10 space-y-4">
                  <h1 className="text-5xl font-black tracking-tighter">Sistem Konfigurasi</h1>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed italic">Atur integrasi AI dan parameter global sistem Buana Recruitment.</p>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Integrasi Google Gemini AI</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digunakan untuk analisis laporan otomatis</p>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gemini Pro API Key</label>
                    <input
                      type="password"
                      value={settings.gemini_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                      className="w-full px-8 py-5 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                      placeholder="Masukkan API Key dari Google AI Studio..."
                    />
                    <p className="text-[10px] text-slate-400 italic">Dapatkan key gratis di <a href="https://aistudio.google.com/" target="_blank" className="text-emerald-600 font-black underline">Google AI Studio</a></p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => handleSaveSettings(settings)}
                    className="bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-600/20 hover:scale-105 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {candidate && role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[150] overflow-y-auto p-12 flex flex-col items-center">
            <button onClick={() => setCandidate(null)} className="self-end bg-white/10 text-white px-10 py-5 rounded-[2rem] hover:bg-rose-500 mb-12 font-black text-xs uppercase tracking-widest transition-all">Tutup Pratinjau</button>
            <ReportView candidate={candidate} geminiApiKey={settings.gemini_api_key} showToast={showToast} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: SOFT_BG }}>
      <nav className="bg-white border-b-4 border-emerald-500/10 px-6 lg:px-12 py-5 flex justify-between items-center sticky top-0 z-[120] shadow-sm backdrop-blur-lg">
        <BuanaLogo className="h-6 lg:h-8" />
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat Aktif</p>
            <p className="text-sm font-black text-slate-800">{candidate?.name}</p>
          </div>
          <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>
          <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Tes ke {candidate ? candidate.currentTestIndex + 1 : 0} dari {candidate?.package.length}</span>
              <span className="text-xs font-black text-emerald-900 uppercase tracking-tight">{activeTestModule?.title || 'Asesmen Mandiri'}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-slate-100 sticky top-[76px] z-[110]">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
          style={{ width: `${candidate ? ((candidate.currentTestIndex) / candidate.package.length) * 100 : 0}%` }}
        ></div>
      </div>

      <main className="flex-1 p-6 lg:p-12 flex items-center justify-center">
        {candidate?.status === 'COMPLETED' ? (
          <div className="text-center space-y-10 max-w-xl bg-white p-12 lg:p-24 rounded-[4rem] shadow-2xl border border-slate-50 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-12">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight uppercase">ASESMEN SELESAI</h2>
            <p className="text-slate-500 font-medium italic text-lg leading-relaxed">Seluruh rangkaian tes Anda telah tersimpan dengan aman. Data pendaftaran Anda akan segera diproses oleh tim HRD PT. Buana Megah.</p>
            <button onClick={handleLogout} className="w-full text-white py-7 rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all" style={{ background: `linear-gradient(135deg, ${BUANA_GREEN} 0%, #059669 100%)` }}>KELUAR & TUTUP HALAMAN</button>
          </div>
        ) : renderActiveTest()}
      </main>
    </div>
  );
};

export default App;
