
import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface IshiharaTestProps {
  questions: Question[];
  onComplete: (results: { answers: Record<string, string> }) => void;
}

const IshiharaTest: React.FC<IshiharaTestProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const currentPlate = questions[currentIndex];

  useEffect(() => {
    // Preload images for smooth transition
    questions.forEach(q => {
      if (q.imageUrl) {
        const img = new Image();
        img.src = q.imageUrl;
      }
    });
  }, [questions]);

  const handleInput = (n: number) => {
    if (currentInput.length < 3) {
      setCurrentInput(prev => prev + n);
    }
  };

  const handleClear = () => setCurrentInput('');

  const handleNext = () => {
    if (!currentPlate) return;
    
    const newAnswers = { ...userAnswers, [currentPlate.id]: currentInput };
    setUserAnswers(newAnswers);
    setCurrentInput('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete({ answers: newAnswers });
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-10 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-inner">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">TES BUTA WARNA (ISHIHARA)</h2>
          <p className="text-slate-500 font-medium leading-relaxed italic">
            Lihatlah piringan warna yang muncul di layar. Identifikasi angka yang tersembunyi di dalamnya dan masukkan melalui tombol angka di layar.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instruksi Medis:</p>
            <ul className="text-xs font-bold text-slate-600 space-y-2">
              <li className="flex gap-2"><span>•</span> Berjarak sekitar 75cm dari layar.</li>
              <li className="flex gap-2"><span>•</span> Jangan menyentuh layar.</li>
              <li className="flex gap-2"><span>•</span> Waktu pengerjaan maksimal 5 detik per piringan.</li>
            </ul>
          </div>
        </div>
        <button 
          onClick={() => setIsStarted(true)}
          className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all uppercase tracking-widest"
        >
          SAYA MENGERTI & MULAI
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Progress Pelat</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{currentIndex + 1} <span className="text-slate-300 text-sm">/ {questions.length}</span></p>
          </div>
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">👁️</div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full shadow-2xl overflow-hidden border-8 border-white bg-white flex items-center justify-center">
        {currentPlate && <img src={currentPlate.imageUrl} className="w-full h-full object-contain animate-in zoom-in-50 duration-500" alt="Ishihara Plate" />}
      </div>

      <div className="mb-10 text-center space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Angka Terlihat</p>
        <div className="text-6xl font-black tracking-tighter text-slate-900 min-h-[72px] flex items-center justify-center">
          {currentInput || <span className="text-slate-100">?</span>}
        </div>
        <div className="w-16 h-1 mx-auto bg-emerald-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button 
            key={n} 
            onClick={() => handleInput(n)} 
            className="h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-xl font-black text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 active:scale-95 transition-all shadow-sm"
          >
            {n}
          </button>
        ))}
        <button onClick={handleClear} className="h-16 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center justify-center text-xl font-black text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95">❌</button>
        <button onClick={() => handleInput(0)} className="h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-xl font-black text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 active:scale-95 transition-all shadow-sm">0</button>
        <button onClick={handleNext} className="h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">OK</button>
      </div>
      
      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">Ketuk angka lalu tekan OK</p>
    </div>
  );
};

export default IshiharaTest;
