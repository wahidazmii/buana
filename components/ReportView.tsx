
import React, { useState, useCallback, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Candidate, RecommendationLevel, AIReportSections } from '../types';
import { generatePsychologicalReport } from '../services/geminiService';

const BUANA_GREEN = '#10B981';
const BUANA_GREEN_DARK = '#059669';

interface ReportViewProps {
  candidate: Candidate;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ReportView: React.FC<ReportViewProps> = ({ candidate, showToast }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [aiReport, setAiReport] = useState<AIReportSections | null>(candidate.results?.aiReport || null);
  const [recommendation, setRecommendation] = useState<RecommendationLevel | undefined>(candidate.results?.recommendation);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGenerateReport = async () => {
    if (!candidate.results) {
      showToast("Data hasil tes belum lengkap.", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generatePsychologicalReport(candidate.results, candidate.name, candidate.appliedPosition);
      setAiReport(result.sections);
      setRecommendation(result.recommendation);
      showToast("Analisis AI PT. Buana Megah selesai.", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal melakukan analisis AI.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = useCallback(() => {
    if (!reportRef.current) return;
    
    setIsPrinting(true);
    showToast("Mempersiapkan PDF...", "info");

    const element = reportRef.current;
    const filename = `PSIKOGRAM_${candidate.name.replace(/\s+/g, '_').toUpperCase()}.pdf`;
    
    // @ts-ignore
    const html2pdf = window.html2pdf;

    if (!html2pdf) {
      showToast("PDF Library loading... Silakan coba 3 detik lagi.", "error");
      setIsPrinting(false);
      return;
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsPrinting(false);
      showToast("Dokumen PDF berhasil disimpan.", "success");
    }).catch((err: any) => {
      console.error("PDF Error:", err);
      setIsPrinting(false);
      showToast("Gagal generate PDF.", "error");
    });
  }, [candidate.name, showToast]);

  // DISC Mapping from Backend (using Graph 1/Public as default)
  const discData = candidate.results?.disc?.graph_1_mask
    ? Object.entries(candidate.results.disc.graph_1_mask)
        .filter(([key]) => key !== 'Star')
        .map(([key, val]) => ({ name: key, score: val }))
    : [];

  // PAPI Mapping
  const papiData = candidate.results?.papi 
    ? Object.entries(candidate.results.papi).map(([key, value]) => ({ 
        subject: key, 
        A: value,
        fullMark: 9
      })) 
    : [];

  const getRecommendationStyle = (rec?: RecommendationLevel) => {
    switch (rec) {
      case 'Highly Recommended': return 'bg-emerald-600 text-white shadow-emerald-500/30';
      case 'Recommended': return 'bg-emerald-400 text-white shadow-emerald-400/30';
      case 'Consider with Notes': return 'bg-amber-400 text-white shadow-amber-400/30';
      case 'Not Recommended': return 'bg-rose-500 text-white shadow-rose-500/30';
      default: return 'bg-slate-200 text-slate-500';
    }
  };

  return (
    <div className="flex flex-col items-center">
        
      <div className="w-full max-w-5xl mb-6 flex justify-end gap-4 no-print animate-in slide-in-from-top-4 duration-500">
         <button 
           onClick={handleGenerateReport} 
           disabled={isGenerating} 
           className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50">
           {isGenerating ? '⚙️ Menganalisis...' : '🤖 Generate AI Analysis'}
         </button>
         <button 
           onClick={handleDownloadPdf} 
           disabled={isPrinting}
           className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50">
           {isPrinting ? 'Memproses...' : '🖨️ Download PDF'}
         </button>
      </div>

      <div 
        id="report-content-area"
        ref={reportRef}
        className={`report-container w-full max-w-5xl bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in duration-700
            print:shadow-none print:m-0 print:border-none print:rounded-none print:p-8`}
      >
        
        <header className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: BUANA_GREEN }}>
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">PT. BUANA MEGAH</h1>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-[0.2em]">Recruitment & Assessment Center</p>
              <p className="text-[9px] font-medium text-slate-400 mt-1">Confidential Assessment Report</p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-slate-900 text-white px-4 py-2 rounded-xl inline-block mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest">RAHASIA / CONFIDENTIAL</p>
             </div>
             <p className="text-[10px] font-bold text-slate-500 mt-1">ID: {candidate.id.substring(0,8).toUpperCase()}</p>
          </div>
        </header>

        <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-12">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                 <div className="flex items-center gap-6 mb-6">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center font-black text-4xl text-emerald-600 border-4 border-emerald-50 shadow-sm">
                        {candidate.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{candidate.name}</h2>
                        <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mt-1">{candidate.appliedPosition}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                        <p className="font-bold text-slate-700">{candidate.whatsapp || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Tes</p>
                        <p className="font-bold text-emerald-600 uppercase">{candidate.status}</p>
                    </div>
                 </div>
              </div>

              <div className="w-full md:w-auto bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center min-w-[200px]">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Hasil Rekomendasi</p>
                 <div className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${getRecommendationStyle(recommendation || candidate.results?.recommendation)}`}>
                    {recommendation || candidate.results?.recommendation || 'PENDING ANALYSIS'}
                 </div>
                 {candidate.results?.kraepelin && (
                     <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                        <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Avg Speed</p>
                            <p className="text-lg font-black text-emerald-600">{candidate.results.kraepelin.avg_speed || 0}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Accuracy</p>
                            <p className="text-lg font-black text-emerald-600">{candidate.results.kraepelin.accuracy_deviation || 0}</p>
                        </div>
                     </div>
                 )}
              </div>
           </div>
        </section>

        <section className="mb-12">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">AI</div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Executive Summary</h3>
           </div>
           
           <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100 text-slate-700 leading-relaxed text-justify">
              {aiReport?.executiveSummary ? (
                  <p className="whitespace-pre-line">{aiReport.executiveSummary}</p>
              ) : (
                  <p className="text-slate-400 italic text-center py-4">
                     Klik tombol "Generate AI Analysis" untuk analisis mendalam.
                  </p>
              )}
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Public Behavior (DISC Mask)</h4>
              {discData.length > 0 ? (
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer>
                        <AreaChart data={discData}>
                           <defs>
                              <linearGradient id="colorMost" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor={BUANA_GREEN} stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor={BUANA_GREEN} stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 800}} axisLine={false} tickLine={false} />
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <Tooltip />
                           <Area type="monotone" dataKey="score" stroke={BUANA_GREEN} fillOpacity={1} fill="url(#colorMost)" strokeWidth={3} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
              ) : (
                 <div className="h-[200px] flex items-center justify-center text-slate-300 text-xs font-bold uppercase">No DISC Data</div>
              )}
           </div>

           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Ishihara Results</h4>
              {candidate.results?.ishihara ? (
                  <div className="h-[250px] flex flex-col items-center justify-center">
                      <div className={`text-5xl font-black mb-2 ${candidate.results.ishihara.status === 'NORMAL' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {candidate.results.ishihara.score} / {candidate.results.ishihara.total}
                      </div>
                      <p className="text-lg font-black uppercase tracking-widest text-slate-700">{candidate.results.ishihara.status.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400 mt-4 uppercase font-bold tracking-widest">Medical Color Vision Standard</p>
                  </div>
              ) : (
                 <div className="h-[200px] flex items-center justify-center text-slate-300 text-xs font-bold uppercase">No Ishihara Data</div>
              )}
           </div>
        </section>

        <footer className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
           <div className="flex items-center gap-2">
              <span className="font-bold text-[10px] uppercase tracking-widest">PT. BUANA MEGAH PAPER MILLS</span>
           </div>
           <div className="text-[9px] font-medium uppercase tracking-widest">
              Psychometric AI System • {new Date().getFullYear()}
           </div>
        </footer>

      </div>
    </div>
  );
};

export default ReportView;
