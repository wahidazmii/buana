
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestConfiguration } from '../types';

interface KraepelinTestProps {
  config?: TestConfiguration;
  onComplete: (data: { columns: number[][], answers: number[][] }) => void;
}

const KraepelinTest: React.FC<KraepelinTestProps> = ({ config, onComplete }) => {
  const timerPerLine = config?.timerPerLine || 15;
  const totalCols = config?.totalLines || 40;
  const digitsPerLine = config?.digitsPerLine || 45;

  const [activeCol, setActiveCol] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerPerLine);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  // High-performance grid state
  const [grid] = useState(() => 
    Array.from({ length: totalCols }, () => 
      Array.from({ length: digitsPerLine }, () => Math.floor(Math.random() * 9) + 1)
    )
  );
  
  const [answers, setAnswers] = useState<number[][]>(() => 
    Array.from({ length: totalCols }, () => [])
  );

  // Refs for high-precision timing
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);
  const activeColRef = useRef(activeCol);

  // Sync ref with state
  useEffect(() => {
    activeColRef.current = activeCol;
  }, [activeCol]);

  const handleNextColumn = useCallback(() => {
    if (activeColRef.current < totalCols - 1) {
      setActiveCol(prev => prev + 1);
      startTimeRef.current = Date.now();
      setTimeLeft(timerPerLine);
    } else {
      setIsFinished(true);
      onComplete({ columns: grid, answers });
    }
  }, [grid, answers, onComplete, totalCols, timerPerLine]);

  // Robust Timer Engine using requestAnimationFrame (Delta Time)
  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const remaining = Math.max(0, Math.ceil((timerPerLine * 1000 - elapsed) / 1000));
    
    setTimeLeft(remaining);

    if (elapsed >= timerPerLine * 1000) {
      handleNextColumn();
    }

    if (!isFinished) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [timerPerLine, isFinished, handleNextColumn]);

  useEffect(() => {
    if (isStarted && !isFinished) {
      startTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStarted, isFinished, animate]);

  const handleInput = (num: number) => {
    if (isFinished) return;
    setAnswers(prev => {
      const newAnswers = [...prev];
      const currentColAnswers = [...newAnswers[activeCol]];
      // Limit answers to the number of possible sums (digitsPerLine - 1)
      if (currentColAnswers.length < digitsPerLine - 1) {
        currentColAnswers.push(num);
        newAnswers[activeCol] = currentColAnswers;
      }
      return newAnswers;
    });
  };

  // Keyboard support for physical numpads
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isFinished) return;
      if (e.key >= '0' && e.key <= '9') {
        handleInput(parseInt(e.key));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished]);

  if (!isStarted) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-inner">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">INSTRUKSI KRAEPELIN</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Jumlahkan dua angka yang berdekatan dari <span className="text-emerald-600 font-bold uppercase">Bawah ke Atas</span>. 
            Ambil angka terakhir dari hasil penjumlahan tersebut.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Baris</p>
              <p className="text-lg font-black text-slate-800">{timerPerLine} Detik</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kolom</p>
              <p className="text-lg font-black text-slate-800">{totalCols} Kolom</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsStarted(true)}
          className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all uppercase tracking-widest"
        >
          MULAI ASESMEN SEKARANG
        </button>
      </div>
    );
  }

  // Virtual Rendering: Only show the current active column and the previous one
  const visibleCols = grid.map((col, idx) => ({ col, idx })).filter(({ idx }) => idx === activeCol || idx === activeCol - 1);

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col no-select overflow-hidden font-[Inter]">
      {/* Header Info */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-900/10 uppercase">⚡</div>
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">KRAEPELIN SPEED ENGINE</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PT. BUANA MEGAH ASSESSMENT CENTER</p>
           </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Status Progres</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{activeCol + 1} <span className="text-slate-300 text-sm font-medium">/ {totalCols}</span></p>
           </div>
           <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-colors border-2 ${timeLeft <= 3 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest mb-1">Time</span>
              <span className="text-3xl font-black tabular-nums leading-none">{timeLeft}</span>
           </div>
        </div>
      </div>

      {/* Main Testing Canvas - Sequential Virtual Rendering */}
      <div className="flex-1 flex items-center justify-center gap-12 p-10 overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        {visibleCols.map(({ col, idx }) => (
          <div key={idx} 
               className={`flex flex-col gap-4 transition-all duration-700 transform ${idx === activeCol ? 'scale-110 opacity-100' : 'scale-90 opacity-20 blur-[2px] pointer-events-none'}`}>
            <div className="flex flex-col-reverse gap-3 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-200 min-w-[120px] relative">
              {/* Active Column Indicator */}
              {idx === activeCol && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                   <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kolom Aktif</div>
                   <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50"></div>
                </div>
              )}
              
              {col.map((num, rowIdx) => (
                <React.Fragment key={rowIdx}>
                  <div className={`w-16 h-16 flex items-center justify-center text-3xl font-black rounded-2xl transition-all shadow-sm
                    ${idx === activeCol ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-slate-100 text-slate-400'}`}>
                    {num}
                  </div>
                  {rowIdx < col.length - 1 && (
                    <div className="relative h-14 w-16 flex items-center justify-center">
                       <div className={`w-14 h-12 flex items-center justify-center rounded-xl border-4 font-black text-2xl transition-all
                          ${idx === activeCol && answers[idx].length === rowIdx ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 
                            answers[idx][rowIdx] !== undefined ? 'border-slate-100 bg-slate-50 text-slate-600' : 'border-slate-50 bg-slate-50/50'}`}>
                         {answers[idx][rowIdx] !== undefined ? answers[idx][rowIdx] : ''}
                       </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom On-Screen Numpad for Mobile & Focus */}
      <div className="bg-white border-t border-slate-200 p-8 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
         <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
               {[1,2,3,4,5,6,7,8,9,0].map(n => (
                 <button 
                  key={n}
                  onClick={() => handleInput(n)}
                  className="h-16 md:h-20 bg-slate-50 hover:bg-emerald-600 hover:text-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black transition-all active:scale-95 shadow-sm"
                 >
                   {n}
                 </button>
               ))}
            </div>
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Input angka terakhir dari hasil penjumlahan</p>
         </div>
      </div>
    </div>
  );
};

export default KraepelinTest;
