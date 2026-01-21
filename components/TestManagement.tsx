
import React, { useState } from 'react';
import { TestModule, TestType, Question, TestConfiguration, QuestionOption } from '../types';

interface TestManagementProps {
  testModules: TestModule[];
  onUpdate: (modules: TestModule[]) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * REFACTOR: All sub-editor components moved outside the main component 
 * to prevent redefining them on every render, which caused focus loss.
 */

interface EditorProps {
  editingModule: TestModule;
  handleUpdateConfig: (config: Partial<TestConfiguration>) => void;
  handleUpdateQuestions: (questions: Question[]) => void;
  activeQuestionIndex: number;
  setActiveQuestionIndex: (idx: number) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const KraepelinConfigEditor: React.FC<EditorProps> = ({ editingModule, handleUpdateConfig }) => {
  const config = editingModule.config;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
          <span className="text-xl">⏱️</span> Durasi & Ritme (Speed)
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kecepatan Pindah Baris (Detik)</label>
            <input
              type="number"
              value={config.timerPerLine}
              onChange={(e) => handleUpdateConfig({ timerPerLine: parseInt(e.target.value) || 0 })}
              className="w-full p-4 bg-white text-slate-900 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 transition-all font-bold outline-none"
            />
            <p className="text-[10px] text-slate-400 font-medium mt-2">Default standar psikometri industri: 15 detik.</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimasi Total Waktu</label>
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-sm">
              {(config.totalLines! * config.timerPerLine! / 60).toFixed(1)} Menit
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
          <span className="text-xl">📐</span> Matriks Angka
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jumlah Kolom (Total Baris Pindah)</label>
            <input
              type="number"
              value={config.totalLines}
              onChange={(e) => handleUpdateConfig({ totalLines: parseInt(e.target.value) || 0 })}
              className="w-full p-4 bg-white text-slate-900 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 transition-all font-bold outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Arah Penjumlahan</label>
            <select
              value={config.direction}
              onChange={(e) => handleUpdateConfig({ direction: e.target.value as any })}
              className="w-full p-4 bg-white text-slate-900 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 transition-all font-bold outline-none"
            >
              <option value="DOWN_TO_UP">Bawah ke Atas (Standard Kraepelin)</option>
              <option value="UP_TO_DOWN">Atas ke Bawah (Pauli Variation)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const IshiharaEditor: React.FC<EditorProps> = ({ editingModule, handleUpdateQuestions }) => {
  const questions = editingModule.questions || [];
  const handleAddPlate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re: any) => {
          const newQ: Question = {
            id: Math.random().toString(36).substr(2, 9),
            text: re.target.result,
            options: [],
            correctOptionId: '0'
          };
          handleUpdateQuestions([...questions, newQ]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  const updatePlateKey = (id: string, key: string) => {
    handleUpdateQuestions(questions.map(q => q.id === id ? { ...q, correctOptionId: key } : q));
  };
  const removePlate = (id: string) => {
    handleUpdateQuestions(questions.filter(q => q.id !== id));
  };
  return (
    <div className="p-10 space-y-10 h-[700px] overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Gallery Pelat Ishihara</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Upload piringan warna standar</p>
        </div>
        <button onClick={handleAddPlate} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.03] transition-all">📸 Upload Pelat Baru</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 relative group hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-50"><img src={q.text} className="w-full h-full object-cover" alt="Plate" /></div>
            <div className="text-center">
              <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Kunci Angka</label>
              <input type="number" value={q.correctOptionId} onChange={(e) => updatePlateKey(q.id, e.target.value)} className="w-full text-center font-black text-xl text-slate-800 border-b-2 border-emerald-500 bg-transparent focus:outline-none py-1" />
            </div>
            <button onClick={() => removePlate(q.id)} className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px] shadow-lg">{idx + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MCQEditor: React.FC<EditorProps> = ({ editingModule, handleUpdateQuestions, activeQuestionIndex, setActiveQuestionIndex }) => {
  const questions = editingModule.questions || [];
  const currentQ = questions[activeQuestionIndex] || { id: 'temp', text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }], correctOptionId: 'a' };

  const updateQuestion = (data: Partial<Question>) => {
    const newQuestions = [...questions];
    if (activeQuestionIndex >= newQuestions.length) {
      newQuestions.push({ ...currentQ, ...data });
    } else {
      newQuestions[activeQuestionIndex] = { ...newQuestions[activeQuestionIndex], ...data };
    }
    handleUpdateQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQ: Question = { id: Math.random().toString(36).substr(2, 9), text: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }], correctOptionId: 'a' };
    handleUpdateQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[700px]">
      <div className="w-full lg:w-1/4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Navigator Soal</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, idx) => (
              <button key={q.id} onClick={() => setActiveQuestionIndex(idx)} className={`h-12 w-12 rounded-2xl font-black text-xs transition-all flex items-center justify-center ${activeQuestionIndex === idx ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'}`}>{idx + 1}</button>
            ))}
            <button onClick={handleAddQuestion} className="h-12 w-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 font-black text-xl hover:border-emerald-500 hover:text-emerald-500">+</button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 overflow-y-auto relative">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">EDIT SOAL NO. {activeQuestionIndex + 1}</h2>
          <button onClick={() => { handleUpdateQuestions(questions.filter((_, i) => i !== activeQuestionIndex)); setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1)); }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">🗑️ Hapus Soal</button>
        </div>
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Narasi Pertanyaan</label>
            <textarea value={currentQ.text} onChange={(e) => updateQuestion({ text: e.target.value })} className="w-full h-40 p-6 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-500 transition-all font-bold outline-none resize-none" placeholder="Tulis pertanyaan..." />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pilihan & Kunci</label>
            {currentQ.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-4">
                <button onClick={() => updateQuestion({ correctOptionId: opt.id })} className={`h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all ${currentQ.correctOptionId === opt.id ? 'bg-emerald-500 border-emerald-200 text-white' : 'bg-white border-slate-100'}`}>
                  {currentQ.correctOptionId === opt.id ? '✓' : ''}
                </button>
                <input type="text" value={opt.text} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[idx] = { ...opt, text: e.target.value }; updateQuestion({ options: newOpts }); }} className="flex-1 px-6 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold" placeholder={`Opsi ${['A', 'B', 'C', 'D'][idx]}...`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DISCEditor: React.FC<EditorProps> = ({ editingModule, handleUpdateQuestions, activeQuestionIndex, setActiveQuestionIndex }) => {
  const questions = editingModule.questions || [];
  const currentQ = questions[activeQuestionIndex] || { id: 'temp-disc', text: 'Kelompok DISC', options: [{ id: '1', text: '', dimension: 'D' }, { id: '2', text: '', dimension: 'I' }, { id: '3', text: '', dimension: 'S' }, { id: '4', text: '', dimension: 'C' }] };

  const updateQuestion = (data: Partial<Question>) => {
    const newQuestions = [...questions];
    if (activeQuestionIndex >= newQuestions.length) {
      newQuestions.push({ ...currentQ, ...data });
    } else {
      newQuestions[activeQuestionIndex] = { ...newQuestions[activeQuestionIndex], ...data };
    }
    handleUpdateQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQ: Question = { id: Math.random().toString(36).substr(2, 9), text: 'Kelompok DISC', options: [{ id: '1', text: '', dimension: 'D' }, { id: '2', text: '', dimension: 'I' }, { id: '3', text: '', dimension: 'S' }, { id: '4', text: '', dimension: 'C' }] };
    handleUpdateQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[700px]">
      <div className="w-full lg:w-1/4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Kelompok DISC</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, idx) => (
              <button key={q.id} onClick={() => setActiveQuestionIndex(idx)} className={`h-12 w-12 rounded-2xl font-black text-xs transition-all flex items-center justify-center ${activeQuestionIndex === idx ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>{idx + 1}</button>
            ))}
            <button onClick={handleAddQuestion} className="h-12 w-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 font-black text-xl hover:border-emerald-500">+</button>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Edit Kelompok Soal No. {activeQuestionIndex + 1}</h2>
          <button onClick={() => { handleUpdateQuestions(questions.filter((_, i) => i !== activeQuestionIndex)); setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1)); }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">🗑️ Hapus Nomor Ini</button>
        </div>
        <div className="bg-blue-50/50 text-blue-800 p-6 rounded-3xl mb-10 text-xs font-medium border border-blue-100 leading-relaxed">
          <strong className="font-black uppercase tracking-widest block mb-1">Instruksi Admin:</strong>
          Masukkan 4 pernyataan perilaku. Tentukan tipe watak (D/I/S/C) untuk setiap pernyataan.
        </div>
        <div className="space-y-6">
          {currentQ.options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-6 p-6 border-2 border-slate-100 rounded-[2rem] bg-white group hover:border-emerald-100 transition-all">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-100">{idx + 1}</div>
              <input type="text" value={opt.text} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[idx] = { ...opt, text: e.target.value }; updateQuestion({ options: newOpts }); }} className="flex-1 p-5 rounded-2xl border-2 border-slate-50 focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none text-slate-900 bg-white" placeholder="Pernyataan..." />
              <select value={opt.dimension} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[idx] = { ...opt, dimension: e.target.value }; updateQuestion({ options: newOpts }); }} className="p-5 rounded-2xl border-2 border-slate-100 bg-white font-black text-slate-700 w-40 outline-none focus:border-emerald-500 transition-all text-xs uppercase tracking-widest">
                <option value="D">Tipe D</option><option value="I">Tipe I</option><option value="S">Tipe S</option><option value="C">Tipe C</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TestManagement: React.FC<TestManagementProps> = ({ testModules, onUpdate, showToast }) => {
  const [editingModule, setEditingModule] = useState<TestModule | null>(null);
  const [view, setView] = useState<'LIST' | 'CONFIG' | 'QUESTIONS'>('LIST');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [newModuleForm, setNewModuleForm] = useState({ title: '', type: TestType.MCQ, durationMinutes: 60, passingScore: 70 });

  const handleUpdateConfig = (config: Partial<TestConfiguration>) => {
    if (!editingModule) return;
    const updatedModule = { ...editingModule, config: { ...editingModule.config, ...config } };
    const updatedList = testModules.map(m => m.id === editingModule.id ? updatedModule : m);

    // Optimistically update local state for smoothness
    setEditingModule(updatedModule);

    // Trigger parent save (App.tsx > saveTestModule via onUpdate)
    // Note: We need to change the contract slightly or handle it in App.
    // In App.tsx we set it to just setTestModules. We need to actually CALL save.
    // See step below for App.tsx fix.
    onUpdate(updatedList);
  };

  const handleUpdateQuestions = (questions: Question[]) => {
    if (!editingModule) return;
    const updatedModule = { ...editingModule, questions, questionCount: questions.length };
    const updatedList = testModules.map(m => m.id === editingModule.id ? updatedModule : m);

    setEditingModule(updatedModule);
    onUpdate(updatedList);
  };

  const handleCreateModule = () => {
    if (!newModuleForm.title.trim()) {
      showToast("Lengkapi Nama Modul.", "error");
      return;
    }
    const newModule: TestModule = {
      id: `tm-${Math.random().toString(36).substr(2, 9)}`,
      title: newModuleForm.title,
      type: newModuleForm.type,
      isActive: true,
      questionCount: 0,
      questions: [],
      config: {
        durationSeconds: newModuleForm.durationMinutes * 60,
        passingScore: newModuleForm.passingScore,
        timerPerLine: 15,
        totalLines: 40,
        digitsPerLine: 45,
        direction: 'DOWN_TO_UP'
      }
    };
    onUpdate([...testModules, newModule]);
    setIsCreateModalOpen(false);
    setEditingModule(newModule);
    setView(newModule.type === TestType.KRAEPELIN ? 'CONFIG' : 'QUESTIONS');
    showToast(`${newModule.title} berhasil dibuat.`, "success");
  };

  const editorProps: EditorProps = {
    editingModule: editingModule!,
    handleUpdateConfig,
    handleUpdateQuestions,
    activeQuestionIndex,
    setActiveQuestionIndex,
    showToast
  };

  if (view !== 'LIST' && editingModule) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <header className="flex items-center gap-8">
          <button onClick={() => setView('LIST')} className="p-5 bg-white rounded-[1.5rem] border border-slate-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editingModule.title}</h2>
            <p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Editor Intuitif Modul {editingModule.type}</p>
          </div>
        </header>

        <div className="bg-white p-2 rounded-[3.5rem] shadow-sm border border-slate-100">
          {editingModule.type === TestType.KRAEPELIN ? <KraepelinConfigEditor {...editorProps} /> :
            editingModule.type === TestType.ISHIHARA ? <IshiharaEditor {...editorProps} /> :
              editingModule.type === TestType.DISC ? <DISCEditor {...editorProps} /> : <MCQEditor {...editorProps} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-20 opacity-10 transform group-hover:scale-110 transition-transform duration-1000">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex px-6 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">Database Psikometri Terpadu</div>
          <h1 className="text-6xl font-black tracking-tighter leading-tight">Bank Soal &<br />Konfigurasi Tes</h1>
          <p className="max-w-xl text-emerald-50/80 font-medium text-lg leading-relaxed italic">Kelola seluruh parameter asesmen, bank soal K3, dan algoritma Kraepelin secara real-time dengan kendali penuh.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-white text-emerald-800 px-14 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:scale-105 transition-all flex items-center gap-3">
            <span className="text-xl">+</span> BUAT MODUL BARU
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {testModules.map(module => (
          <div key={module.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col justify-between group">
            <div className="mb-12">
              <div className="flex justify-between items-start mb-8">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${module.type === TestType.KRAEPELIN ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {module.type}
                </span>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 leading-none group-hover:text-emerald-600 transition-colors">{module.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{module.questionCount} Butir Pertanyaan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setEditingModule(module); setView('CONFIG'); }} className="flex-1 px-4 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex justify-center items-center gap-2 shadow-sm">
                ⚙️ Config
              </button>
              <button
                onClick={() => { setEditingModule(module); setView('QUESTIONS'); }}
                disabled={module.type === TestType.KRAEPELIN}
                className="flex-1 px-4 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex justify-center items-center gap-2 disabled:opacity-20 shadow-sm"
              >
                ✏️ Edit Soal
              </button>
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-16 animate-in zoom-in-95 duration-300">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">SETUP MODUL</h3>
            <p className="text-slate-400 text-sm font-medium mb-12 italic">Membangun pilar penilaian yang objektif & berkualitas.</p>
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Modul Tes</label>
                <input
                  type="text"
                  placeholder="Contoh: Tes Kompetensi K3"
                  value={newModuleForm.title}
                  onChange={(e) => setNewModuleForm({ ...newModuleForm, title: e.target.value })}
                  className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] font-bold transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Core Engine</label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { id: TestType.MCQ, label: 'MCQ', icon: '📝' },
                    { id: TestType.DISC, label: 'DISC', icon: '👤' },
                    { id: TestType.KRAEPELIN, label: 'KRAEPELIN', icon: '⚡' },
                    { id: TestType.ISHIHARA, label: 'ISHIHARA', icon: '👁️' }
                  ].map((engine) => (
                    <button key={engine.id} onClick={() => setNewModuleForm({ ...newModuleForm, type: engine.id as TestType })} className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 ${newModuleForm.type === engine.id ? 'bg-emerald-500 border-emerald-200 text-white shadow-2xl shadow-emerald-500/40' : 'bg-slate-50 border-transparent text-slate-500 hover:border-emerald-100'}`}>
                      <span className="text-3xl">{engine.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{engine.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-20">
              <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleCreateModule} className="flex-[2] bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-600/30">BUAT & LANJUT KE EDITOR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
