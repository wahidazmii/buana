
import React, { useState } from 'react';
import { TestModule, TestType, Question, TestConfiguration } from '../types';

interface TestManagementProps { testModules: TestModule[]; onUpdate: (modules: TestModule[]) => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; }

interface EditorProps {
  editingModule: TestModule;
  handleUpdateConfig: (config: Partial<TestConfiguration>) => void;
  handleUpdateQuestions: (questions: Question[]) => void;
  activeQuestionIndex: number;
  setActiveQuestionIndex: (idx: number) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const DISCEditor: React.FC<EditorProps> = ({ editingModule, handleUpdateQuestions, activeQuestionIndex, setActiveQuestionIndex, showToast }) => {
  const questions = editingModule.questions || [];
  const currentQ = questions[activeQuestionIndex] || { id: 'temp-disc', text: 'Kelompok DISC', options: [{ id: '1', text: '', dimension: 'D' }, { id: '2', text: '', dimension: 'I' }, { id: '3', text: '', dimension: 'S' }, { id: '4', text: '', dimension: 'C' }] };

  const updateQuestion = (data: Partial<Question>) => {
    const newQs = [...questions];
    if (activeQuestionIndex >= newQs.length) newQs.push({ ...currentQ, ...data });
    else newQs[activeQuestionIndex] = { ...newQs[activeQuestionIndex], ...data };
    handleUpdateQuestions(newQs);
  };

  const handleAddQuestion = () => {
    const newQ: Question = { id: Math.random().toString(36).substr(2, 9), text: 'Kelompok DISC', options: [{ id: '1', text: '', dimension: 'D' }, { id: '2', text: '', dimension: 'I' }, { id: '3', text: '', dimension: 'S' }, { id: '4', text: '', dimension: 'C' }] };
    handleUpdateQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[700px]">
      <div className="w-1/4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Navigator Soal</h3></div>
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
        <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Edit Kelompok Soal No. {activeQuestionIndex + 1}</h2><button onClick={() => { handleUpdateQuestions(questions.filter((_, i) => i !== activeQuestionIndex)); setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1)); }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">🗑️ Hapus Nomor</button></div>
        <div className="bg-blue-50/50 text-blue-800 p-6 rounded-3xl mb-10 text-xs font-medium border border-blue-100"><strong>Instruksi Admin:</strong> Masukkan 4 pernyataan perilaku dan tentukan tipe watak (D/I/S/C) masing-masing.</div>
        <div className="space-y-6">
          {currentQ.options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-6 p-6 border-2 border-slate-100 rounded-[2rem] bg-white hover:border-emerald-100 transition-all">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-100">{idx + 1}</div>
              <input type="text" value={opt.text} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[idx] = { ...opt, text: e.target.value }; updateQuestion({ options: newOpts }); }} className="flex-1 p-5 rounded-2xl border-2 border-slate-50 focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none text-slate-900 bg-white" placeholder="Pernyataan perilaku..." />
              <select value={opt.dimension} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[idx] = { ...opt, dimension: e.target.value }; updateQuestion({ options: newOpts }); }} className="p-5 rounded-2xl border-2 border-slate-100 bg-white font-black text-slate-700 w-40 outline-none text-xs uppercase">
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
  const [view, setView] = useState<'LIST' | 'QUESTIONS'>('LIST');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const handleUpdateQuestions = (questions: Question[]) => {
    if (!editingModule) return;
    const updated = testModules.map(m => m.id === editingModule.id ? { ...m, questions, questionCount: questions.length } : m);
    onUpdate(updated);
    setEditingModule({ ...editingModule, questions, questionCount: questions.length });
  };

  if (view === 'QUESTIONS' && editingModule) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <header className="flex items-center gap-8"><button onClick={() => setView('LIST')} className="p-5 bg-white rounded-2xl border border-slate-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button><div><h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{editingModule.title}</h2><p className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Editor Intuitif Modul {editingModule.type}</p></div></header>
        <div className="bg-white p-2 rounded-[3.5rem] shadow-sm border border-slate-100">{editingModule.type === TestType.DISC && <DISCEditor editingModule={editingModule} handleUpdateConfig={()=>{}} handleUpdateQuestions={handleUpdateQuestions} activeQuestionIndex={activeQuestionIndex} setActiveQuestionIndex={setActiveQuestionIndex} showToast={showToast} />}</div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
       <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group"><div className="relative z-10 space-y-8"><h1 className="text-6xl font-black tracking-tighter leading-tight">Bank Soal &<br/>Konfigurasi Tes</h1><p className="max-w-xl text-emerald-50/80 font-medium text-lg italic">Kelola parameter asesmen dan algoritma interpretasi psikologi secara real-time.</p></div></div>
       <div className="grid grid-cols-3 gap-10">
          {testModules.map(module => (
            <div key={module.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group">
               <div className="mb-12"><span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700">{module.type}</span><h3 className="text-3xl font-black text-slate-900 tracking-tighter mt-6 leading-none group-hover:text-emerald-600 transition-colors">{module.title}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{module.questionCount} Butir</p></div>
               <button onClick={() => { setEditingModule(module); setView('QUESTIONS'); }} className="w-full px-4 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex justify-center items-center gap-2">✏️ Edit Modul</button>
            </div>
          ))}
       </div>
    </div>
  );
};

export default TestManagement;
