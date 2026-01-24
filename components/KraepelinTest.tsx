
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestConfiguration } from '../types';

interface KraepelinTestProps {
  config?: TestConfiguration;
  onComplete: (results: { 
      raw_grid: number[][]; 
      user_answers: number[][]; 
      correct_counts: number[] 
  }) => void;
}

const KraepelinTest: React.FC<KraepelinTestProps> = ({ config, onComplete }) => {
  const timerPerLine = config?.timerPerLine || 15;
  const totalCols = config?.totalLines || 40;
  const digitsPerLine = config?.digitsPerLine || 45;

  const [activeCol, setActiveCol] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerPerLine);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Grid Generator
  const [grid] = useState(() => 
    Array.from({ length: totalCols }, () => 
      Array.from({ length: digitsPerLine }, () => Math.floor(Math.random() * 9) + 1)
    )
  );
  
  const [answers, setAnswers] = useState<number[][]>(() => 
    Array.from({ length: totalCols }, () => [])
  );

  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);
  const activeColRef = useRef(activeCol);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { activeColRef.current = activeCol; }, [activeCol]);

  const handleNextColumn = useCallback(() => {
    if (activeColRef.current < totalCols - 1) {
      setActiveCol(prev => {
        const next = prev + 1;
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        return next;
      });
      startTimeRef.current = Date.now();
      setTimeLeft(timerPerLine);
    } else {
      finishTest();
    }
  }, [totalCols, timerPerLine]);

  const finishTest = useCallback(() => {
    setIsFinished(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    const correctCounts = grid.map((col, colIdx) => {
        const colAnswers = answers[colIdx] || [];
        let correct = 0;
        colAnswers.forEach((ans, rowIdx) => {
            if (rowIdx < col.length - 1) {
                const sum = (col[rowIdx] + col[rowIdx + 1]) % 10;
                if (ans === sum) correct++;
            }
        });
        return correct;
    });

    onComplete({ 
        raw_grid: grid, 
        user_answers: answers, 
        correct_counts: correctCounts 
    });
  }, [grid, answers, onComplete]);

  const animate = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const remaining = Math.max(0, Math.ceil(timerPerLine - (elapsed / 1000)));
    
    setTimeLeft(prev => (prev !== remaining ? remaining : prev));

    if (elapsed >= timerPerLine * 1000) {
      handleNextColumn();
    } else if (!isFinished) {
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

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && isStarted && !isFinished) {
            alert("PERINGATAN: Dilarang berpindah tab selama tes berlangsung!");
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isStarted, isFinished]);

  const handleInput = (num: number) => {
    if (isFinished) return;
    setAnswers(prev => {
      const newAnswers = [...prev];
      const currentColAnswers = [...newAnswers[activeCol]];
      if (currentColAnswers.length < digitsPerLine - 1) {
        currentColAnswers.push(num);
        newAnswers[activeCol] = currentColAnswers;
      }
      return newAnswers;
    });
  };

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
            Ambil <span className="underline decoration-emerald-500 decoration-4">angka terakhir</span> dari hasil penjumlahan.
          </p>
        </div>
        <button 
          onClick={() => setIsStarted(true)}
          className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all uppercase tracking-widest"
        >
          MULAI ASESMEN
        </button>
      </div>
    );
  }

  const visibleCols = grid.map((col, idx) => ({ col, idx })).filter(({ idx }) => idx === activeCol || idx === activeCol - 1);

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col no-select overflow-hidden font-[Inter]">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg uppercase">⚡</div>
           <h2 className="text-xl font-black text-slate-900 tracking-tighter hidden md:block uppercase">Kraepelin Speed Engine</h2>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Kolom</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{activeCol + 1} <span className="text-slate-300 text-sm">/ {totalCols}</span></p>
           </div>
           <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center transition-colors border-2 ${timeLeft <= 3 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest mb-1">Detik</span>
              <span className="text-3xl font-black tabular-nums leading-none">{timeLeft}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-center gap-8 md:gap-12 p-4 md:p-10 overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        {visibleCols.map(({ col, idx }) => (
          <div key={idx} className={`flex flex-col gap-4 transition-all duration-500 transform ${idx === activeCol ? 'scale-100 opacity-100' : 'scale-90 opacity-40 blur-[1px] pointer-events-none'}`}>
            <div className="flex flex-col-reverse gap-2 bg-white p-4 md:p-6 rounded-[2rem] shadow-2xl border border-slate-200 min-w-[100px] md:min-w-[120px] relative max-h-[60vh] overflow-y-auto no-scrollbar scroll-smooth" ref={idx === activeCol ? scrollRef : null}>
              {col.map((num, rowIdx) => (
                <React.Fragment key={rowIdx}>
                  <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-black rounded-2xl transition-all shadow-sm ${idx === activeCol ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{num}</div>
                  {rowIdx < col.length - 1 && (
                    <div className="relative h-12 w-14 md:h-14 md:w-16 flex items-center justify-center z-10 -my-2">
                       <div className={`w-12 h-10 md:w-14 md:h-12 flex items-center justify-center rounded-xl border-4 font-black text-xl transition-all ${idx === activeCol && answers[idx].length === rowIdx ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg' : answers[idx][rowIdx] !== undefined ? 'border-slate-100 bg-slate-50 text-slate-800' : 'border-slate-50 bg-slate-50/50 opacity-30'}`}>{answers[idx][rowIdx] !== undefined ? answers[idx][rowIdx] : ''}</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border-t border-slate-200 p-4 md:p-8 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
               {[1,2,3,4,5,6,7,8,9,0].map(n => (
                 <button key={n} onClick={() => handleInput(n)} className="h-14 md:h-20 bg-slate-50 hover:bg-emerald-600 hover:text-white border-b-4 border-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black transition-all active:translate-y-1 active:border-b-0">{n}</button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default KraepelinTest;
