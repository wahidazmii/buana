
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
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const currentPlate = questions[currentIndex];

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = questions.length;
    if (totalImages === 0) { setImagesLoaded(true); return; }

    questions.forEach(q => {
      if (q.imageUrl) {
        const img = new Image();
        img.src = q.imageUrl;
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) setImagesLoaded(true);
        };
        img.onerror = () => {
            loadedCount++;
            if (loadedCount === totalImages) setImagesLoaded(true);
        };
      }
    });
  }, [questions]);

  const handleInput = (n: number) => {
    if (currentInput.length < 2) {
      setCurrentInput(prev => prev + n);
    }
  };

  const handleClear = () => setCurrentInput('');

  const handleNext = (inputValue: string) => {
    if (!currentPlate) return;
    const newAnswers = { ...userAnswers, [currentPlate.id]: inputValue };
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
      <div className="max-w-xl mx-auto p-12 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-inner ring-4 ring-emerald-50/50">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Tes Buta Warna</h2>
          <p className="text-slate-500 font-medium leading-relaxed uppercase tracking-tight">Identifikasi angka tersembunyi dalam pola warna.</p>
        </div>
        <button 
          onClick={() => setIsStarted(true)}
          disabled={!imagesLoaded}
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest transition-all ${imagesLoaded ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-200 text-slate-400'}`}
        >
          {imagesLoaded ? 'Mulai Tes' : 'Memuat Aset...'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Soal</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{currentIndex + 1} <span className="text-slate-300 text-lg">/ {questions.length}</span></p>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="w-64 h-64 md:w-80 md:h-80 mb-8 rounded-full shadow-2xl border-[6px] border-white bg-white flex items-center justify-center overflow-hidden">
        {currentPlate && <img key={currentPlate.id} src={currentPlate.imageUrl} className="w-full h-full object-contain animate-in zoom-in-90 duration-300" alt="Ishihara" />}
      </div>

      <div className="mb-6 text-center w-full max-w-xs">
        <div className="bg-white border-2 border-slate-100 rounded-2xl h-20 flex items-center justify-center shadow-sm">
           <span className="text-5xl font-black text-slate-800 tracking-tighter">{currentInput || '?'}</span>
        </div>
      </div>

      <div className="w-full max-w-xs grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => handleInput(n)} className="h-14 bg-white border-b-4 border-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-emerald-50 active:border-b-0 active:translate-y-1 transition-all">{n}</button>
        ))}
        <button onClick={handleClear} className="h-14 bg-rose-50 border-b-4 border-rose-100 rounded-xl flex items-center justify-center text-lg font-bold text-rose-500">DEL</button>
        <button onClick={() => handleInput(0)} className="h-14 bg-white border-b-4 border-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-600">0</button>
        <button onClick={() => handleNext(currentInput || 'PASS')} className="h-14 bg-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg">{currentInput ? 'SUBMIT' : 'SKIP'}</button>
      </div>
    </div>
  );
};

export default IshiharaTest;
