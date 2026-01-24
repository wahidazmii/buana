import React, { useState } from 'react';
import { TestModule, TestType, Question, TestConfiguration, DiscQuestion, PapiQuestion } from '../types';
import { api } from '../services/apiService';

const DISCEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<DiscQuestion[]>(module.questions || []);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateQuestion = (qIndex: number, optIndex: number, field: 'text' | 'val', value: string) => {
    const newQuestions = [...questions];
    const targetQ = { ...newQuestions[qIndex] };
    targetQ.options = [...targetQ.options];
    targetQ.options[optIndex] = { ...targetQ.options[optIndex] };
    
    if (field === 'text') {
      targetQ.options[optIndex].text = value;
    } else {
      targetQ.options[optIndex].most = value;
      targetQ.options[optIndex].least = value;
    }
    
    newQuestions[qIndex] = targetQ;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newId = questions.length + 1;
    const newQs = [
      ...questions, 
      {
        id: newId,
        options: [
          { text: "Pernyataan Watak Dominance...", most: "D", least: "D" },
          { text: "Pernyataan Watak Influence...", most: "I", least: "I" },
          { text: "Pernyataan Watak Steadiness...", most: "S", least: "S" },
          { text: "Pernyataan Watak Compliance...", most: "C", least: "C" }
        ]
      }
    ];
    setQuestions(newQs);
    setActiveIndex(newQs.length - 1);
  };

  const handleDeleteQuestion = () => {
    const newQs = questions.filter((_, i) => i !== activeIndex);
    setQuestions(newQs);
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleSave = () => {
    onSave({ ...module, questions, questionCount: questions.length });
  };

  const currentQ = questions[activeIndex];
  const checkBalance = () => {
    if (!currentQ) return { balanced: true, missing: [] };
    const counts = { D: 0, I: 0, S: 0, C: 0 };
    currentQ.options.forEach(o => { 
      if(['D','I','S','C'].includes(o.most)) {
        counts[o.most as keyof typeof counts]++;
      }
    });
    const missing = Object.keys(counts).filter(k => counts[k as keyof typeof counts] === 0);
    return { balanced: missing.length === 0, missing };
  };

  const balanceStatus = checkBalance();
  const colors: Record<string, string> = { 
    D: 'bg-rose-100 text-rose-700 border-rose-200', 
    I: 'bg-amber-100 text-amber-700 border-amber-200', 
    S: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    C: 'bg-blue-100 text-blue-700 border-blue-200' 
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full xl:w-72 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[650px]">
        <div className="flex justify-between items-center mb-6 px-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigator Soal</p>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">{questions.length} Butir</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-4 gap-2 content-start">
          {questions.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setActiveIndex(i)} 
              className={`aspect-square rounded-xl font-black text-xs transition-all border-2 
              ${activeIndex === i 
                ? 'bg-slate-800 text-white border-slate-800 shadow-lg' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-400 hover:text-emerald-600'}`}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={handleAddQuestion} className="aspect-square rounded-xl border-2 border-dashed border-emerald-300 text-emerald-500 font-black text-xl hover:bg-emerald-50 transition-all">+</button>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20">
                Simpan Perubahan
             </button>
        </div>
      </div>
      <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative min-h-[650px]">
        {questions.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <p className="font-black uppercase tracking-widest mb-4">Belum ada soal</p>
              <button onClick={handleAddQuestion} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">+ Buat Soal Pertama</button>
           </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Edit Nomor {activeIndex + 1}</h3>
                <p className="text-xs font-bold text-slate-400 mt-2">Atur 4 pernyataan dan petakan ke watak (D/I/S/C).</p>
              </div>
              <div className="flex gap-3">
                 {!balanceStatus.balanced && (
                    <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold border border-rose-100 flex items-center gap-2 animate-pulse">
                       ⚠️ Missing Logic: {balanceStatus.missing.join(', ')}
                    </div>
                 )}
                 <button onClick={handleDeleteQuestion} className="px-4 py-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-[10px] font-black uppercase transition-all">
                    Hapus Soal Ini
                 </button>
              </div>
            </div>
            <div className="space-y-4">
              {currentQ.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-4 items-start group">
                   <div className="mt-4 text-[10px] font-black text-slate-300 w-6 text-center">{String.fromCharCode(65 + optIdx)}</div>
                   <div className="flex-1">
                      <input 
                        type="text" 
                        value={opt.text}
                        onChange={(e) => updateQuestion(activeIndex, optIdx, 'text', e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 focus:bg-white rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none transition-all shadow-inner"
                        placeholder="Masukkan pernyataan perilaku..."
                      />
                   </div>
                   <div className="w-40">
                      <div className="relative">
                         <select 
                            value={opt.most}
                            onChange={(e) => updateQuestion(activeIndex, optIdx, 'val', e.target.value)}
                            className={`w-full appearance-none px-4 py-4 rounded-2xl font-black text-center outline-none border-2 cursor-pointer transition-all ${colors[opt.most] || 'bg-slate-100 text-slate-400 border-slate-200'}`}
                         >
                            <option value="D">DOMINANCE (D)</option>
                            <option value="I">INFLUENCE (I)</option>
                            <option value="S">STEADINESS (S)</option>
                            <option value="C">COMPLIANCE (C)</option>
                         </select>
                         <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
            <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Preview Logika Scoring</p>
               <div className="flex justify-center gap-6">
                  {currentQ.options.map((o, i) => (
                     <div key={i} className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 mb-2 uppercase">Opsi {String.fromCharCode(65+i)}</span>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-sm shadow-sm border-2 ${colors[o.most]}`}>
                           {o.most}
                        </div>
                     </div>
                  ))}
               </div>
               <p className="text-[9px] text-slate-400 mt-6 italic">Setiap pilihan di atas harus mencakup 4 watak DISC yang unik (D, I, S, C) untuk menjaga validitas psikometri.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PAPI_DIMENSIONS = [
  { code: 'G', label: 'Peran Pekerja Keras (Hard Worker)' },
  { code: 'L', label: 'Peran Pemimpin (Leadership)' },
  { code: 'I', label: 'Peran Pembuat Keputusan (Integrator)' },
  { code: 'T', label: 'Peran Sibuk (Tempo)' },
  { code: 'V', label: 'Peran Semangat (Vigorous)' },
  { code: 'S', label: 'Peran Bermasyarakat (Socializer)' },
  { code: 'R', label: 'Peran Teoritis (Theoretical)' },
  { code: 'D', label: 'Peran Bekerja Dengan Hal Rinci (Detail)' },
  { code: 'C', label: 'Peran Mengatur (Organized)' },
  { code: 'E', label: 'Peran Pengendalian Emosi (Emotional)' },
  { code: 'N', label: 'Kebutuhan Menyelesaikan Tugas (Finish)' },
  { code: 'A', label: 'Kebutuhan Berprestasi (Achievement)' },
  { code: 'P', label: 'Kebutuhan Mengatur Orang Lain (Control)' },
  { code: 'X', label: 'Kebutuhan Untuk Diperhatikan (Notice)' },
  { code: 'B', label: 'Kebutuhan Diterima Kelompok (Belonging)' },
  { code: 'O', label: 'Kebutuhan Kedekatan & Kasih Sayang (Affection)' },
  { code: 'K', label: 'Kebutuhan Untuk Agresif (Aggressive)' },
  { code: 'Z', label: 'Kebutuhan Untuk Berubah (Change)' },
  { code: 'F', label: 'Kebutuhan Tunduk Pada Atasan (Authority)' },
  { code: 'W', label: 'Kebutuhan Aturan & Pengarahan (Rules)' }
];

const PAPIEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<PapiQuestion[]>(module.questions || []);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateQuestion = (side: 'a' | 'b', field: 'text' | 'dimension', value: string) => {
    const newQs = [...questions];
    const currentPair = { ...newQs[activeIndex].pair };
    
    currentPair[side] = { ...currentPair[side], [field]: value };
    
    newQs[activeIndex] = { ...newQs[activeIndex], pair: currentPair };
    setQuestions(newQs);
  };

  const handleAddQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        pair: {
          a: { text: "Pernyataan A (Contoh: Saya suka bekerja keras)", dimension: "G" },
          b: { text: "Pernyataan B (Contoh: Saya suka memimpin)", dimension: "L" }
        }
      }
    ]);
    setActiveIndex(questions.length);
  };

  const handleDeleteQuestion = () => {
    const newQs = questions.filter((_, i) => i !== activeIndex);
    const reindexed = newQs.map((q, idx) => ({ ...q, id: idx + 1 }));
    setQuestions(reindexed);
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleSave = () => {
    onSave({ ...module, questions, questionCount: questions.length });
  };

  const currentQ = questions[activeIndex];

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full xl:w-80 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[700px]">
        <div className="flex justify-between items-center mb-6 px-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peta Soal (90 Item)</p>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">{questions.length} / 90</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => (
                    <button 
                    key={i} 
                    onClick={() => setActiveIndex(i)} 
                    className={`aspect-square rounded-lg font-black text-[10px] transition-all border 
                    ${activeIndex === i 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-110' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-blue-400 hover:text-blue-600'}`}
                    >
                    {i + 1}
                    </button>
                ))}
                <button onClick={handleAddQuestion} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-400 font-black text-lg hover:bg-slate-50 hover:text-emerald-500 hover:border-emerald-300 transition-all">+</button>
            </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20">
                Simpan Bank Soal
             </button>
        </div>
      </div>
      <div className="flex-1 space-y-6">
        {questions.length === 0 ? (
           <div className="h-full bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
              <p className="font-black uppercase tracking-widest mb-4">Bank Soal PAPI Kosong</p>
              <button onClick={handleAddQuestion} className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs shadow-sm hover:bg-emerald-100 transition-all">+ Tambah Nomor 1</button>
           </div>
        ) : (
          <>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nomor {activeIndex + 1}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Forced Choice Format (A vs B)</p>
                </div>
                <button onClick={handleDeleteQuestion} className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all">
                    Hapus Item Ini
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-emerald-200 transition-all group">
                    <div className="flex justify-between items-center mb-6">
                        <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">A</span>
                        <div className="flex flex-col items-end">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Arah Skor (Dimension)</label>
                            <select 
                                value={currentQ.pair.a.dimension}
                                onChange={(e) => updateQuestion('a', 'dimension', e.target.value)}
                                className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer w-48 text-right"
                            >
                                {PAPI_DIMENSIONS.map(dim => (
                                    <option key={dim.code} value={dim.code}>[{dim.code}] {dim.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <textarea 
                        value={currentQ.pair.a.text}
                        onChange={(e) => updateQuestion('a', 'text', e.target.value)}
                        rows={4}
                        placeholder="Masukkan teks pernyataan A..."
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-400 rounded-2xl p-5 font-bold text-slate-700 text-lg outline-none resize-none transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-center mb-6">
                        <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">B</span>
                        <div className="flex flex-col items-end">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Arah Skor (Dimension)</label>
                            <select 
                                value={currentQ.pair.b.dimension}
                                onChange={(e) => updateQuestion('b', 'dimension', e.target.value)}
                                className="bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer w-48 text-right"
                            >
                                {PAPI_DIMENSIONS.map(dim => (
                                    <option key={dim.code} value={dim.code}>[{dim.code}] {dim.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <textarea 
                        value={currentQ.pair.b.text}
                        onChange={(e) => updateQuestion('b', 'text', e.target.value)}
                        rows={4}
                        placeholder="Masukkan teks pernyataan B..."
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-400 rounded-2xl p-5 font-bold text-slate-700 text-lg outline-none resize-none transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pratinjau Logika Penilaian</p>
               <div className="flex justify-center items-center gap-8 text-sm font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                     Jika pilih <span className="bg-white px-2 py-1 rounded border shadow-sm">A</span> ➔ Poin masuk ke <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded">{currentQ.pair.a.dimension}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                     Jika pilih <span className="bg-white px-2 py-1 rounded border shadow-sm">B</span> ➔ Poin masuk ke <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">{currentQ.pair.b.dimension}</span>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const K3Editor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<Question[]>(module.questions || []);
  const [config, setConfig] = useState<TestConfiguration>(module.config || { durationSeconds: 1200, passingScore: 70 });
  const [activeIndex, setActiveIndex] = useState(0);

  const updateQuestion = (idx: number, field: string, value: any) => {
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], [field]: value };
    setQuestions(newQs);
  };

  const updateOption = (qIdx: number, optIdx: number, text: string) => {
    const newQs = [...questions];
    if (newQs[qIdx].options) {
      const newOpts = [...newQs[qIdx].options!];
      newOpts[optIdx] = { ...newOpts[optIdx], text };
      newQs[qIdx].options = newOpts;
      setQuestions(newQs);
    }
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: '',
      options: [
        { id: 'a', text: '' }, { id: 'b', text: '' },
        { id: 'c', text: '' }, { id: 'd', text: '' }
      ],
      correctOptionId: 'a'
    };
    setQuestions([...questions, newQ]);
    setActiveIndex(questions.length);
  };

  const handleSave = () => {
    onSave({ ...module, questions, config, questionCount: questions.length });
  };

  const currentQ = questions[activeIndex];

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full xl:w-80 space-y-6">
        <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 shadow-sm">
           <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Pengaturan Tes</h4>
           <div className="space-y-4">
              <div>
                 <label className="text-[9px] font-bold text-slate-400 uppercase">Durasi Pengerjaan (Menit)</label>
                 <input 
                    type="number" 
                    value={Math.floor((config.durationSeconds || 0) / 60)}
                    onChange={(e) => setConfig({...config, durationSeconds: parseInt(e.target.value) * 60})}
                    className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:border-orange-500 transition-all"
                 />
              </div>
              <div>
                 <label className="text-[9px] font-bold text-slate-400 uppercase">Passing Grade (Skor Min)</label>
                 <input 
                    type="number" 
                    value={config.passingScore || 70}
                    onChange={(e) => setConfig({...config, passingScore: parseInt(e.target.value)})}
                    className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 font-black text-slate-700 outline-none focus:border-orange-500 transition-all"
                 />
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase">Daftar Soal</span>
              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">{questions.length} Butir</span>
           </div>
           <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-5 gap-2 content-start">
              {questions.map((_, i) => (
                 <button key={i} onClick={() => setActiveIndex(i)} className={`aspect-square rounded-lg font-black text-xs border ${activeIndex === i ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-orange-300'}`}>
                    {i + 1}
                 </button>
              ))}
              <button onClick={handleAddQuestion} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:bg-orange-50 hover:text-orange-500 hover:border-orange-300 transition-all">+</button>
           </div>
        </div>
        <button onClick={handleSave} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20">
            Simpan Modul
        </button>
      </div>
      <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
         {currentQ ? (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 uppercase">Edit Soal No. {activeIndex + 1}</h3>
                  <button onClick={() => {
                      const newQs = questions.filter((_, i) => i !== activeIndex);
                      setQuestions(newQs);
                      setActiveIndex(Math.max(0, activeIndex - 1));
                  }} className="text-rose-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all">Hapus Soal</button>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pertanyaan</label>
                  <textarea 
                     value={currentQ.text}
                     onChange={(e) => updateQuestion(activeIndex, 'text', e.target.value)}
                     rows={3}
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-400 rounded-[2rem] p-6 font-bold text-slate-700 text-lg outline-none resize-none transition-all"
                     placeholder="Tulis pertanyaan di sini..."
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilihan Jawaban (Klik Huruf untuk Kunci Jawaban)</label>
                  <div className="grid grid-cols-1 gap-4">
                     {currentQ.options?.map((opt, oIdx) => (
                        <div key={opt.id} className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${currentQ.correctOptionId === opt.id ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-slate-100 group'}`}>
                           <button 
                              onClick={() => updateQuestion(activeIndex, 'correctOptionId', opt.id)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${currentQ.correctOptionId === opt.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}
                           >
                              {String.fromCharCode(65 + oIdx)}
                           </button>
                           <input 
                              type="text" 
                              value={opt.text}
                              onChange={(e) => updateOption(activeIndex, oIdx, e.target.value)}
                              className="flex-1 bg-transparent outline-none font-bold text-slate-700"
                              placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                           />
                           {currentQ.correctOptionId === opt.id && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mr-2">Kunci Jawaban</span>}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <p className="font-black uppercase tracking-widest mb-4">Pilih atau Tambah Soal</p>
                <button onClick={handleAddQuestion} className="px-6 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs">+ Tambah Soal Pertama</button>
            </div>
         )}
      </div>
    </div>
  );
};

const KraepelinConfigEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [config, setConfig] = useState<TestConfiguration>(module.config || { timerPerLine: 15, totalLines: 45, digitsPerLine: 20, direction: 'UP_TO_DOWN' });

  const handleSave = () => onSave({ ...module, config });

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center mb-12">Konfigurasi Engine Kraepelin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Waktu Per Baris (Detik)</label>
            <input type="number" value={config.timerPerLine} onChange={e => setConfig({...config, timerPerLine: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-2xl text-emerald-600 focus:border-emerald-500 outline-none transition-all shadow-inner" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Total Tinggi Baris</label>
            <input type="number" value={config.totalLines} onChange={e => setConfig({...config, totalLines: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-2xl text-emerald-600 focus:border-emerald-500 outline-none transition-all shadow-inner" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Lebar Kolom Horizontal</label>
            <input type="number" value={config.digitsPerLine} onChange={e => setConfig({...config, digitsPerLine: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-2xl text-emerald-600 focus:border-emerald-500 outline-none transition-all shadow-inner" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Arah Penjumlahan</label>
            <select value={config.direction} onChange={e => setConfig({...config, direction: e.target.value as any})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-black text-lg text-slate-700 outline-none transition-all shadow-inner appearance-none">
              <option value="UP_TO_DOWN">Bawah ke Atas (Kraepelin Standard)</option>
              <option value="DOWN_TO_UP">Atas ke Bawah (Pauli Variation)</option>
            </select>
          </div>
        </div>
        <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col items-center">
           <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 flex items-center gap-8 text-emerald-700 w-full mb-8">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">⏱️</div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Estimasi Total Waktu Tes</p>
                <p className="text-3xl font-black tabular-nums">{Math.floor((config.timerPerLine! * config.totalLines!) / 60)} Menit { (config.timerPerLine! * config.totalLines!) % 60 } Detik</p>
              </div>
           </div>
           <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] transition-all">Simpan Konfigurasi Engine</button>
        </div>
      </div>
    </div>
  );
};

const IshiharaEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<any[]>(module.questions || []);

  const handleSave = () => onSave({ ...module, questions, questionCount: questions.length });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Gallery Pelat Ishihara</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Total {questions.length} Gambar Pelat Aktif</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all">+ Upload Pelat Baru</button>
          <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">Update Gallery</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all hover:border-emerald-200">
            <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">✖</button>
            <div className="w-full aspect-square bg-slate-50 rounded-[2rem] mb-6 overflow-hidden border-4 border-slate-50 flex items-center justify-center relative">
               <img src={q.imageUrl} className="w-full h-full object-cover" alt="plate" />
               <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-black text-[10px] uppercase tracking-widest bg-slate-900/80 px-4 py-2 rounded-full">Ganti Gambar</span>
               </div>
            </div>
            <div className="space-y-3">
               <p className="text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Angka Kunci Jawaban</p>
               <input 
                 type="text" 
                 value={q.correctOptionId} 
                 onChange={e => {
                    const newQs = [...questions];
                    newQs[idx] = { ...q, correctOptionId: e.target.value };
                    setQuestions(newQs);
                 }}
                 className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3 text-center font-black text-slate-700 outline-none text-xl shadow-inner" 
                 placeholder="?"
               />
            </div>
          </div>
        ))}
        <button onClick={() => setQuestions([...questions, { id: `pl-${Date.now()}`, imageUrl: 'https://placehold.co/400x400/F0FDF4/10B981?text=Plate', correctOptionId: '?' }])} className="aspect-square rounded-[2.5rem] border-4 border-dashed border-slate-200 text-slate-300 font-black text-6xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-400 transition-all">+</button>
      </div>
    </div>
  );
};

// --- MODULE BUILDER COMPONENT ---
const ModuleBuilder: React.FC<{ onPublish: (newModule: TestModule) => void; onCancel: () => void }> = ({ onPublish, onCancel }) => {
  const [title, setTitle] = useState('');
  const [engineType, setEngineType] = useState<TestType>(TestType.MCQ);

  const handlePublish = () => {
    if (!title.trim()) {
      alert("Mohon isi Judul Modul Asesmen.");
      return;
    }

    const newModule: TestModule = {
      id: `tm_custom_${Date.now()}`, 
      title: title,
      type: engineType,
      isActive: true,
      questionCount: 0,
      config: { durationSeconds: 1800, passingScore: 70 }, 
      questions: []
    };

    onPublish(newModule);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-2xl w-full relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

         <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
               <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">AI Module<br/>Builder</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membangun Modul Rekrutmen Kustom</p>
            </div>
            <div className="flex gap-4">
               <button onClick={onCancel} className="px-6 py-3 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest transition-colors">
                  Batal & Tutup
               </button>
               <button onClick={handlePublish} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">
                  Publikasikan Modul
               </button>
            </div>
         </div>

         <div className="space-y-8 relative z-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Modul Asesmen</label>
               <input 
                 type="text" 
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-[2rem] px-8 py-6 font-black text-xl text-slate-800 outline-none transition-all placeholder:text-slate-300"
                 placeholder="Contoh: Tes Pengetahuan Umum, Tes Coding PHP..."
               />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Engine</label>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setEngineType(TestType.MCQ)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all group ${engineType === TestType.MCQ ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}`}
                  >
                     <span className={`block text-2xl mb-2 ${engineType === TestType.MCQ ? 'grayscale-0' : 'grayscale'}`}>🛠️</span>
                     <span className={`block font-bold text-sm ${engineType === TestType.MCQ ? 'text-emerald-900' : 'text-slate-500'}`}>Pilihan Ganda (MCQ)</span>
                     <span className="text-[10px] text-slate-400">Jawaban A/B/C/D otomatis</span>
                  </button>

                  <button 
                    onClick={() => setEngineType(TestType.ESSAY)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all group ${engineType === TestType.ESSAY ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                  >
                     <span className={`block text-2xl mb-2 ${engineType === TestType.ESSAY ? 'grayscale-0' : 'grayscale'}`}>✍️</span>
                     <span className={`block font-bold text-sm ${engineType === TestType.ESSAY ? 'text-blue-900' : 'text-slate-500'}`}>Esai Singkat</span>
                     <span className="text-[10px] text-slate-400">Jawaban teks bebas</span>
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

interface TestManagementProps {
  testModules: TestModule[];
  onUpdate: (modules: TestModule[]) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const TestManagement: React.FC<TestManagementProps> = ({ testModules, onUpdate, showToast }) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    testModules.length > 0 ? testModules[0].id : null
  );
  const [isBuilderMode, setIsBuilderMode] = useState(false);

  const activeModule = testModules.find(m => m.id === activeModuleId);

  const handleSaveModule = async (updatedModule: TestModule) => {
    try {
      await api.updateTestModule(updatedModule);
      const allModules = await api.getTestModules();
      onUpdate(allModules);
      showToast(`Berhasil menyimpan modul ${updatedModule.title}`, "success");
    } catch (err) {
      const updated = testModules.map(m => m.id === updatedModule.id ? updatedModule : m);
      onUpdate(updated);
      showToast("Tersimpan (Offline Mode).", "success");
    }
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm("Yakin ingin menghapus modul ini secara permanen?")) {
      const newModules = testModules.filter(m => m.id !== id);
      onUpdate(newModules);
      if (activeModuleId === id) {
        setActiveModuleId(newModules.length > 0 ? newModules[0].id : null);
      }
      showToast("Modul berhasil dihapus.", "info");
    }
  };

  const handlePublishNewModule = (newModule: TestModule) => {
    onUpdate([...testModules, newModule]);
    setIsBuilderMode(false); 
    setActiveModuleId(newModule.id); 
    showToast(`Modul "${newModule.title}" berhasil dibuat!`, 'success');
  };

  const renderEditor = () => {
    if (isBuilderMode) {
      return (
        <ModuleBuilder 
          onPublish={handlePublishNewModule} 
          onCancel={() => setIsBuilderMode(false)} 
        />
      );
    }

    if (!activeModule) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
           <div className="text-6xl mb-4">📭</div>
           <p className="font-bold">Tidak ada modul yang dipilih.</p>
           <p className="text-xs mt-2">Pilih modul di menu kiri atau buat baru.</p>
        </div>
      );
    }

    switch (activeModule.type) {
      case TestType.DISC: return <DISCEditor module={activeModule} onSave={handleSaveModule} />;
      case TestType.PAPI: return <PAPIEditor module={activeModule} onSave={handleSaveModule} />;
      case TestType.KRAEPELIN: return <KraepelinConfigEditor module={activeModule} onSave={handleSaveModule} />;
      case TestType.ISHIHARA: return <IshiharaEditor module={activeModule} onSave={handleSaveModule} />;
      case TestType.K3: return <K3Editor module={activeModule} onSave={handleSaveModule} />;
      case TestType.MCQ: return <K3Editor module={activeModule} onSave={handleSaveModule} />;
      default: return <div className="p-10">Tipe Editor belum didukung.</div>;
    }
  };

  const getModuleStyle = (type: TestType) => {
     switch(type) {
        case TestType.DISC: return { icon: '🎭', color: 'bg-emerald-100 text-emerald-600', border: 'hover:border-emerald-300' };
        case TestType.PAPI: return { icon: '🧠', color: 'bg-blue-100 text-blue-600', border: 'hover:border-blue-300' };
        case TestType.KRAEPELIN: return { icon: '⏱️', color: 'bg-indigo-100 text-indigo-600', border: 'hover:border-indigo-300' };
        case TestType.ISHIHARA: return { icon: '👁️', color: 'bg-rose-100 text-rose-600', border: 'hover:border-rose-300' };
        case TestType.K3: return { icon: '⛑️', color: 'bg-orange-100 text-orange-600', border: 'hover:border-orange-300' };
        default: return { icon: '📝', color: 'bg-slate-100 text-slate-600', border: 'hover:border-slate-300' };
     }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
       <div className="bg-gradient-to-br from-slate-900 to-[#134e40] p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-24 -mt-24 transition-transform group-hover:scale-110 duration-1000"></div>
         <div className="relative z-10 space-y-4">
           <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Bank Soal & Master Config</h1>
           <p className="max-w-2xl text-emerald-50/60 font-medium text-lg italic leading-relaxed">Pusat manajemen psikometri industri PT. Buana Megah. Konfigurasi modul seleksi talenta secara independen.</p>
         </div>
       </div>

       <div className="flex flex-col xl:flex-row gap-8 min-h-[80vh]">
          <div className="w-full xl:w-80 flex flex-col gap-4 animate-in slide-in-from-left duration-500">
             <div className="flex justify-between items-end px-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Modul Aktif</p>
             </div>

             <button 
                onClick={() => setIsBuilderMode(true)}
                className={`p-5 rounded-[2rem] text-left transition-all border-2 group relative overflow-hidden
                ${isBuilderMode 
                   ? 'bg-slate-800 text-white border-slate-800 shadow-xl' 
                   : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'}`}
             >
                 <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${isBuilderMode ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                       +
                    </div>
                    <div>
                       <span className="block font-black text-sm uppercase tracking-tight">Custom Builder</span>
                       <span className="text-[10px] opacity-70">Buat Modul Baru</span>
                    </div>
                 </div>
             </button>

             <div className="h-[1px] bg-slate-100 my-2"></div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[600px] no-scrollbar">
                {testModules.map((mod) => {
                   const style = getModuleStyle(mod.type);
                   const isActive = activeModuleId === mod.id && !isBuilderMode;

                   return (
                      <div key={mod.id} className="relative group">
                         {!['tm_disc', 'tm_papi', 'tm_kraepelin', 'tm_ishihara', 'tm_k3'].includes(mod.id) && (
                            <button 
                               onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                               className="absolute top-2 right-2 z-20 w-6 h-6 bg-white text-rose-400 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] shadow-sm"
                               title="Hapus Modul"
                            >✕</button>
                         )}

                         <button 
                            onClick={() => { setActiveModuleId(mod.id); setIsBuilderMode(false); }}
                            className={`w-full p-4 rounded-[2rem] text-left transition-all border-2 relative
                            ${isActive 
                               ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10 z-10 scale-[1.02]' 
                               : `bg-white border-transparent ${style.border} hover:bg-slate-50`}`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${style.color}`}>
                                  {style.icon}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className={`font-black text-xs uppercase tracking-tight truncate ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                     {mod.title}
                                  </h4>
                                  <p className="text-[9px] font-bold text-slate-300 mt-1 truncate uppercase">
                                     {mod.type} • {mod.questionCount} SOAL
                                  </p>
                               </div>
                            </div>
                         </button>
                      </div>
                   );
                })}
             </div>
          </div>

          <div className="flex-1 min-w-0">
             {renderEditor()}
          </div>
       </div>
    </div>
  );
};

export default TestManagement;