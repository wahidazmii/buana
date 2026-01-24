
import React, { useState } from 'react';
import { TestModule, TestType, Question, TestConfiguration, DiscQuestion, PapiQuestion } from '../types';
import { api } from '../services/apiService';

interface TestManagementProps { 
  testModules: TestModule[]; 
  onUpdate: (modules: TestModule[]) => void; 
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void; 
}

const DISCEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<DiscQuestion[]>(module.questions || []);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateQ = (data: Partial<DiscQuestion>) => {
    const newQs = [...questions];
    newQs[activeIndex] = { ...newQs[activeIndex], ...data };
    setQuestions(newQs);
  };

  const handleSave = () => onSave({ ...module, questions, questionCount: questions.length });

  const currentQ = questions[activeIndex] || { id: activeIndex + 1, options: Array(4).fill({ text: '', most: 'D', least: 'D' }) };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full lg:w-64 bg-slate-50 p-6 rounded-3xl overflow-y-auto max-h-[650px] border border-slate-100 shadow-inner">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Navigator DISC</p>
        <div className="grid grid-cols-4 lg:grid-cols-2 gap-3">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)} className={`h-14 rounded-2xl font-black text-xs transition-all ${activeIndex === i ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200'}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setQuestions([...questions, { id: questions.length + 1, options: Array(4).fill({ text: '', most: 'D', least: 'D' }) }])} className="h-14 rounded-2xl border-4 border-dashed border-slate-200 text-slate-300 font-black text-xl hover:bg-white hover:text-emerald-400 hover:border-emerald-200 transition-all">+</button>
        </div>
      </div>
      <div className="flex-1 space-y-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Edit Kelompok No. {activeIndex + 1}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mapping Watak DISC Standard 24-Item</p>
          </div>
          <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">Simpan Modul</button>
        </div>
        <div className="space-y-4">
          {currentQ.options.map((opt, idx) => (
            <div key={idx} className="flex gap-4 items-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all group">
              <span className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-emerald-600 text-sm border border-slate-100 shadow-sm">{idx + 1}</span>
              <input 
                type="text" 
                value={opt.text} 
                onChange={e => {
                  const newOpts = [...currentQ.options];
                  newOpts[idx] = { ...opt, text: e.target.value };
                  updateQ({ options: newOpts });
                }}
                placeholder="Pernyataan Perilaku (Contoh: Percaya diri, teliti...)"
                className="flex-1 bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none shadow-sm" 
              />
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Dimension</label>
                <select 
                  value={opt.most} 
                  onChange={e => {
                    const newOpts = [...currentQ.options];
                    newOpts[idx] = { ...opt, most: e.target.value, least: e.target.value };
                    updateQ({ options: newOpts });
                  }}
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-emerald-700 text-xs shadow-sm outline-none focus:border-emerald-500"
                >
                  <option value="D">DOMINANCE (D)</option>
                  <option value="I">INFLUENCE (I)</option>
                  <option value="S">STEADINESS (S)</option>
                  <option value="C">COMPLIANCE (C)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PAPIEditor: React.FC<{ module: TestModule, onSave: (m: TestModule) => void }> = ({ module, onSave }) => {
  const [questions, setQuestions] = useState<PapiQuestion[]>(module.questions || []);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateQ = (data: Partial<PapiQuestion>) => {
    const newQs = [...questions];
    newQs[activeIndex] = { ...newQs[activeIndex], ...data };
    setQuestions(newQs);
  };

  const handleSave = () => onSave({ ...module, questions, questionCount: questions.length });

  const currentQ = questions[activeIndex] || { id: activeIndex + 1, pair: { a: { text: '', dimension: 'G' }, b: { text: '', dimension: 'P' } } };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="w-full lg:w-64 bg-slate-50 p-6 rounded-3xl overflow-y-auto max-h-[650px] border border-slate-100 shadow-inner">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Navigator PAPI (90 Soal)</p>
        <div className="grid grid-cols-4 lg:grid-cols-3 gap-2">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)} className={`h-10 rounded-xl font-black text-[10px] transition-all ${activeIndex === i ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">PAPI Kostick Item No. {activeIndex + 1}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Struktur Kepribadian & Perilaku Kerja</p>
          </div>
          <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">Simpan Modul</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-10 rounded-[3rem] border-2 border-emerald-50 bg-white space-y-6 shadow-sm hover:border-emerald-200 transition-all">
            <span className="bg-emerald-500 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">Pernyataan A</span>
            <textarea 
              value={currentQ.pair.a.text}
              onChange={e => updateQ({ pair: { ...currentQ.pair, a: { ...currentQ.pair.a, text: e.target.value } } })}
              rows={4}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] p-6 font-bold text-slate-700 outline-none resize-none text-lg leading-relaxed"
              placeholder="Saya suka bekerja keras..."
            />
            <div className="flex items-center justify-between pt-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arah Aspek (Arah Panah)</label>
               <input type="text" maxLength={2} value={currentQ.pair.a.dimension} onChange={e => updateQ({ pair: { ...currentQ.pair, a: { ...currentQ.pair.a, dimension: e.target.value.toUpperCase() } } })} className="w-20 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-center font-black text-emerald-700 text-lg outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="p-10 rounded-[3rem] border-2 border-blue-50 bg-white space-y-6 shadow-sm hover:border-blue-200 transition-all">
            <span className="bg-blue-500 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">Pernyataan B</span>
            <textarea 
              value={currentQ.pair.b.text}
              onChange={e => updateQ({ pair: { ...currentQ.pair, b: { ...currentQ.pair.b, text: e.target.value } } })}
              rows={4}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-[2rem] p-6 font-bold text-slate-700 outline-none resize-none text-lg leading-relaxed"
              placeholder="Saya suka memimpin kelompok..."
            />
            <div className="flex items-center justify-between pt-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arah Aspek (Arah Panah)</label>
               <input type="text" maxLength={2} value={currentQ.pair.b.dimension} onChange={e => updateQ({ pair: { ...currentQ.pair, b: { ...currentQ.pair.b, dimension: e.target.value.toUpperCase() } } })} className="w-20 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-center font-black text-blue-700 text-lg outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
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
          <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all">Update Gallery</button>
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

const CustomModulBuilder: React.FC<{ module?: TestModule, onSave: (m: TestModule) => void, onCancel: () => void }> = ({ module, onSave, onCancel }) => {
  const [data, setData] = useState<TestModule>(module || { 
    id: `tm_custom_${Date.now()}`, 
    title: '', 
    type: TestType.MCQ, 
    isActive: true, 
    questionCount: 0, 
    config: {}, 
    questions: [] 
  });

  const addQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
      correctOptionId: 'a'
    };
    setData({ ...data, questions: [...(data.questions || []), newQ], questionCount: (data.questions?.length || 0) + 1 });
  };

  const updateQ = (idx: number, patch: Partial<Question>) => {
    const newQs = [...(data.questions || [])];
    newQs[idx] = { ...newQs[idx], ...patch };
    setData({ ...data, questions: newQs });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-5xl mx-auto">
      <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">AI Module Builder</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Membangun Modul Rekrutmen Kustom</p>
          </div>
          <div className="flex gap-4">
             <button onClick={onCancel} className="text-slate-400 font-black text-[10px] uppercase px-8 py-4 rounded-2xl hover:bg-slate-50 transition-all">Batal & Tutup</button>
             <button onClick={() => onSave(data)} className="bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95">Publikasikan Modul</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-100 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Judul Modul Asesmen</label>
              <input type="text" value={data.title} onChange={e => setData({...data, title: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] px-8 py-5 font-bold text-xl text-slate-800 outline-none shadow-inner" placeholder="Contoh: Tes Pengetahuan Kertas..." />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Kategori Engine</label>
              <select value={data.type} onChange={e => setData({...data, type: e.target.value as any})} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] px-8 py-5 font-black text-lg text-slate-700 outline-none shadow-inner appearance-none">
                 <option value={TestType.MCQ}>Pilihan Ganda (MCQ)</option>
                 <option value={TestType.ESSAY}>Isian Bebas (Essay/Written)</option>
              </select>
           </div>
        </div>
      </div>

      <div className="space-y-8">
        {data.questions?.map((q: Question, idx: number) => (
          <div key={q.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-lg space-y-10 relative group hover:border-blue-100 transition-all">
            <button onClick={() => {
              const newQs = data.questions?.filter((_, i) => i !== idx);
              setData({ ...data, questions: newQs, questionCount: newQs?.length || 0 });
            }} className="absolute top-10 right-10 text-rose-300 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest p-4 rounded-xl hover:bg-rose-50 transition-all">Hapus Soal No. {idx + 1}</button>
            <div className="flex gap-10">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center font-black text-3xl flex-shrink-0 shadow-inner border-2 border-white">{idx + 1}</div>
               <div className="flex-1 space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Butir Pertanyaan</label>
                    <textarea 
                      value={q.text}
                      onChange={e => updateQ(idx, { text: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-[2.5rem] p-8 font-bold text-slate-800 outline-none resize-none text-xl leading-relaxed shadow-inner"
                      placeholder="Masukkan teks pertanyaan di sini..."
                    />
                  </div>
                  
                  {data.type === TestType.MCQ ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all group/opt ${q.correctOptionId === opt.id ? 'bg-emerald-50 border-emerald-500 shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                          <input 
                            type="radio" 
                            name={`correct-${q.id}`} 
                            checked={q.correctOptionId === opt.id}
                            onChange={() => updateQ(idx, { correctOptionId: opt.id })}
                            className="w-6 h-6 accent-emerald-500" 
                          />
                          <span className="font-black text-slate-400 text-sm">{String.fromCharCode(65 + oIdx)}</span>
                          <input 
                            type="text" 
                            value={opt.text}
                            onChange={e => {
                              const newOpts = [...q.options];
                              newOpts[oIdx] = { ...opt, text: e.target.value };
                              updateQ(idx, { options: newOpts });
                            }}
                            className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-3 text-base font-bold outline-none group-hover/opt:border-emerald-200" 
                            placeholder={`Masukkan Pilihan ${String.fromCharCode(65 + oIdx)}`} 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                       <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs italic">Modul Essay: Peserta akan diberikan kotak input teks kosong.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="w-full py-16 rounded-[4rem] border-8 border-dashed border-slate-100 text-slate-200 hover:border-emerald-200 hover:text-emerald-400 hover:bg-emerald-50/50 transition-all font-black text-2xl uppercase tracking-[0.3em] flex flex-col items-center gap-4">
          <span className="text-6xl">+</span>
          <span>Tambah Butir Soal Baru</span>
        </button>
      </div>
    </div>
  );
};

const TestManagement: React.FC<TestManagementProps> = ({ testModules, onUpdate, showToast }) => {
  const [activeCategory, setActiveCategory] = useState<TestType>(TestType.DISC);
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  const categories = [
    { id: TestType.DISC, label: 'Gaya Kerja (DISC)', icon: '🎭', color: 'emerald' },
    { id: TestType.PAPI, label: 'Kepribadian (PAPI)', icon: '🧠', color: 'blue' },
    { id: TestType.KRAEPELIN, label: 'Speed Engine (Koran)', icon: '⏱️', color: 'amber' },
    { id: TestType.ISHIHARA, label: 'Color Vision (Buta Warna)', icon: '👁️', color: 'rose' },
    { id: TestType.MCQ, label: 'Custom Builder', icon: '🛠️', color: 'slate' }
  ];

  const handleSaveModule = async (updatedModule: TestModule) => {
    try {
      await api.updateTestModule(updatedModule);
      const allModules = await api.getTestModules();
      onUpdate(allModules);
      setIsCreatingModule(false);
      showToast(`Berhasil sinkronisasi modul ${updatedModule.title}`, "success");
    } catch (err) {
      showToast("Gagal menyimpan bank soal.", "error");
    }
  };

  const renderEditor = () => {
    const currentModule = testModules.find(m => m.type === activeCategory);

    if (activeCategory === TestType.MCQ) {
      if (isCreatingModule) {
        return <CustomModulBuilder onSave={handleSaveModule} onCancel={() => setIsCreatingModule(false)} />;
      }
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Manajemen Modul Kustom</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Daftar Tes Pengetahuan & Kompetensi Internal</p>
            </div>
            <button onClick={() => setIsCreatingModule(true)} className="bg-emerald-600 text-white px-10 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">+ Buat Modul Baru</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testModules.filter(m => m.id.startsWith('tm_custom')).map(m => (
              <div key={m.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-300 transition-all hover:shadow-2xl">
                 <div className="flex gap-6 items-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-lg">📄</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-xl leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">{m.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{m.questionCount} Butir Soal • {m.type}</p>
                    </div>
                 </div>
                 <button onClick={() => { setActiveCategory(TestType.MCQ); setIsCreatingModule(true); }} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">✏️</button>
              </div>
            ))}
            {testModules.filter(m => m.id.startsWith('tm_custom')).length === 0 && (
              <div className="md:col-span-2 py-32 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-4">
                 <span className="text-8xl opacity-10">📂</span>
                 <p className="font-black uppercase tracking-[0.3em] text-xs">Belum ada modul kustom yang dibuat</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (!currentModule) return <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner flex flex-col gap-6 items-center"><span className="text-6xl">🚫</span>Modul {activeCategory} tidak ditemukan</div>;

    switch (activeCategory) {
      case TestType.DISC: return <DISCEditor module={currentModule} onSave={handleSaveModule} />;
      case TestType.PAPI: return <PAPIEditor module={currentModule} onSave={handleSaveModule} />;
      case TestType.KRAEPELIN: return <KraepelinConfigEditor module={currentModule} onSave={handleSaveModule} />;
      case TestType.ISHIHARA: return <IshiharaEditor module={currentModule} onSave={handleSaveModule} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
       <div className="bg-gradient-to-br from-slate-900 to-[#134e40] p-20 rounded-[4.5rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -mr-24 -mt-24 transition-transform group-hover:scale-110 duration-1000"></div>
         <div className="absolute left-1/2 bottom-0 w-[80%] h-1 bg-emerald-500/20 blur-xl transform -translate-x-1/2"></div>
         <div className="relative z-10 space-y-6">
           <div className="flex items-center gap-4 mb-2">
              <span className="px-5 py-2 rounded-full bg-emerald-500 text-emerald-950 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20">System Architect v2.0</span>
           </div>
           <h1 className="text-7xl font-black tracking-tighter leading-none mb-4 uppercase">Bank Soal &<br/><span className="text-emerald-400">Master Config</span></h1>
           <p className="max-w-2xl text-emerald-50/60 font-medium text-xl italic leading-relaxed">Pusat manajemen psikometri industri PT. Buana Megah. Konfigurasi setiap modul tes secara independen untuk hasil seleksi talenta yang akurat dan objektif.</p>
         </div>
       </div>

       <div className="flex flex-col xl:flex-row gap-10">
          <div className="w-full xl:w-96 flex flex-col gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6 mb-2">Pilih Kategori Editor</p>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => { setActiveCategory(cat.id); setIsCreatingModule(false); }}
                className={`flex items-center gap-6 px-10 py-7 rounded-[2.5rem] font-black text-sm transition-all text-left group ${activeCategory === cat.id ? 'bg-[#134e40] text-white shadow-2xl shadow-emerald-900/30' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200 hover:text-emerald-600'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all group-hover:scale-110 ${activeCategory === cat.id ? 'bg-emerald-500 text-white' : 'bg-slate-50'}`}>{cat.icon}</div>
                <div className="flex flex-col">
                  <span className="uppercase tracking-tighter leading-none text-lg">{cat.label.split('(')[0]}</span>
                  <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">Assessment Engine</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-[700px]">
             {renderEditor()}
          </div>
       </div>
    </div>
  );
};

export default TestManagement;
