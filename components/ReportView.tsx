
import React, { useState, useCallback, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
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
    const filename = `Laporan_Asesmen_${candidate.name.replace(/\s+/g, '_')}.pdf`;
    
    // @ts-ignore - html2pdf is globally imported in index.html
    const html2pdf = window.html2pdf;

    if (!html2pdf) {
      showToast("PDF Library tidak ditemukan. Silakan refresh halaman.", "error");
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
        logging: false 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: any) => {
      // Logic could be added here if needed after generation
    }).save().then(() => {
      setIsPrinting(false);
      showToast("PDF berhasil diunduh.", "success");
    }).catch((err: any) => {
      console.error("PDF Generation Error:", err);
      setIsPrinting(false);
      showToast("Gagal mengunduh PDF.", "error");
    });
  }, [candidate.name, showToast]);

  const discData = candidate.results?.disc?.raw ? 
    (Object.entries(candidate.results.disc.raw) as [string, { most: number; least: number; change: number }][]).map(([key, val]) => ({ name: key, most: val.most, least: val.least })) : [];

  const papiData = candidate.results?.papi ? Object.entries(candidate.results.papi).map(([key, value]) => ({ subject: key, A: value })) : [];

  const getRecommendationStyle = (rec?: RecommendationLevel) => {
    switch (rec) {
      case 'Highly Recommended': return 'bg-emerald-600 text-white shadow-emerald-500/20';
      case 'Recommended': return 'bg-emerald-400 text-white shadow-emerald-400/20';
      case 'Consider with Notes': return 'bg-amber-400 text-white shadow-amber-400/20';
      case 'Not Recommended': return 'bg-rose-500 text-white shadow-rose-500/20';
      default: return 'bg-slate-200 text-slate-500';
    }
  };

  return (
    <div 
      id="report-content-area"
      ref={reportRef}
      className={`report-container max-w-5xl mx-auto p-4 md:p-14 space-y-12 bg-white shadow-2xl rounded-[4rem] my-8 border border-slate-50 animate-in fade-in duration-700 print:shadow-none print:m-0 print:border-none ${isPrinting ? 'is-generating-pdf' : ''}`}
    >
      
      {/* BUANA Official Letterhead (Kop Surat) */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-slate-900 pb-10 gap-8 relative">
        <div className="flex gap-8 items-center">
          <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: BUANA_GREEN }}>
            <div className="w-12 h-12 bg-white rounded-tr-full transform -rotate-45 translate-y-2"></div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">PT. BUANA MEGAH</h1>
            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Recruitment & Assessment Center</p>
            <p className="text-[9px] font-medium text-slate-400 max-w-sm mt-1">Jl. Raya Cangkringmalang, Kec. Beji, Pasuruan, Jawa Timur 67154</p>
          </div>
        </div>
        
        <div className="text-right hidden md:block">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidential Report</p>
           <p className="text-xs font-bold text-slate-700 uppercase">ID: {candidate.id.toUpperCase()}</p>
        </div>

        {/* Floating Action Buttons (No Print) */}
        <div className="absolute top-0 right-0 flex gap-4 no-print -mt-8">
          <button 
            onClick={handleDownloadPdf} 
            disabled={isPrinting}
            className={`bg-white border-2 border-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-emerald-500 transition-all shadow-sm ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPrinting ? 'Memproses...' : 'Unduh PDF'}
          </button>
          <button onClick={handleGenerateReport} disabled={isGenerating || isPrinting} className="text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105" style={{ backgroundColor: BUANA_GREEN }}>
            {isGenerating ? 'Menganalisis...' : 'Mulai Analisis AI'}
          </button>
        </div>
      </div>

      {/* Candidate Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
         <div className="md:col-span-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
            <div className="flex gap-8 items-center mb-6">
               <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center font-black text-4xl text-white shadow-xl shadow-slate-900/10 uppercase">{candidate.name.charAt(0)}</div>
               <div>
                  <div className="flex items-center gap-4 flex-wrap mb-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{candidate.name}</h2>
                    {recommendation && <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${getRecommendationStyle(recommendation)} shadow-xl`}>{recommendation}</span>}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BUANA_GREEN }}>Posisi Dilamar: {candidate.appliedPosition || 'Kandidat Umum'}</p>
               </div>
            </div>
            <div className="pt-6 border-t border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                     <p className="text-sm font-bold text-slate-700">{candidate.whatsapp || '-'}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendidikan</p>
                     <p className="text-sm font-bold text-slate-700 uppercase">{candidate.education || '-'}</p>
                  </div>
               </div>
               <div className="mt-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{candidate.address || 'Data alamat tidak tersedia'}</p>
               </div>
            </div>
         </div>
         <div className="md:col-span-4 bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-center text-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">AI Performance Index</p>
            <p className="text-6xl font-black tracking-tighter leading-none">78<span className="text-slate-500 text-xl font-medium">/100</span></p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6">Analisis Psikometri Multidimensi</p>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-12">
        {/* Executive Summary Section */}
        <section className="bg-emerald-50/20 p-12 rounded-[4rem] border border-emerald-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <h3 className="text-xl font-black mb-8 text-slate-900 uppercase tracking-widest flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: BUANA_GREEN }}>Σ</div>
             Executive Summary
          </h3>
          <div className="prose text-slate-700 font-medium leading-loose whitespace-pre-wrap text-xl italic">{aiReport?.executiveSummary || "Laporan narasi belum dibuat. Silakan klik tombol 'Mulai Analisis AI'."}</div>
        </section>

        {/* Psychological Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Work Style (DISC Profile)</h4>
              {discData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={discData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: BUANA_GREEN}} />
                       <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                       <Area type="monotone" dataKey="most" stroke={BUANA_GREEN} fill={BUANA_GREEN} fillOpacity={0.15} strokeWidth={6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="flex items-center justify-center h-full text-slate-200 font-black uppercase text-xs">Data DISC Tidak Ditemukan</div>}
           </div>
           
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Competency Radar (PAPI)</h4>
              {papiData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <RadarChart data={papiData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                        <Radar name="Skor" dataKey="A" stroke={BUANA_GREEN_DARK} fill={BUANA_GREEN} fillOpacity={0.4} strokeWidth={4} />
                     </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="flex items-center justify-center h-full text-slate-200 font-black uppercase text-xs">Data PAPI Tidak Ditemukan</div>}
           </div>
        </div>
      </div>

      {/* Confidentiality Footer */}
      <footer className="mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-slate-300 gap-8">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: BUANA_GREEN }}>B</div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">PT. BUANA MEGAH PAPER MILLS</p>
               <p className="text-[8px] font-bold uppercase tracking-widest">Authorized Internal Document</p>
            </div>
         </div>
         <p className="text-[10px] font-bold uppercase tracking-widest">Confidential • Pasuruan Assessment Center • {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}).toUpperCase()}</p>
      </footer>
    </div>
  );
};

export default ReportView;