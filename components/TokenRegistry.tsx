
import React, { useState, useEffect } from 'react';
import { TokenSession, SessionStatus } from '../types';

const MOCK_SESSIONS: TokenSession[] = [
  {
    id: 's1',
    tokenCode: 'DEV-24-X99',
    candidateName: 'Ahmad Dani',
    position: 'Fullstack Developer',
    status: 'ONLINE',
    currentActivity: 'Kraepelin: Kolom 12/40',
    progress: 30,
    tabSwitches: 3,
    remainingSeconds: 1200,
    lastSeen: new Date().toISOString(),
    device: 'Chrome on Windows 11',
    ip: '192.168.1.1',
    logs: [
      { timestamp: '09:15:00', event: 'User Login Sukses', type: 'info' },
      { timestamp: '09:15:20', event: 'Memulai Tes DISC', type: 'info' },
      { timestamp: '09:25:00', event: 'Menyelesaikan Tes DISC', type: 'info' },
      { timestamp: '09:30:15', event: 'WARNING: Jendela tidak aktif (Alt-Tab)', type: 'warning' }
    ]
  },
  {
    id: 's2',
    tokenCode: 'MKT-99-B72',
    candidateName: 'Sinta Permata',
    position: 'Marketing Lead',
    status: 'IDLE',
    currentActivity: 'Papi Kostik: Soal 45/90',
    progress: 50,
    tabSwitches: 0,
    remainingSeconds: 1800,
    lastSeen: new Date(Date.now() - 3 * 60000).toISOString(),
    device: 'Safari on macOS',
    ip: '10.0.0.45',
    logs: [
      { timestamp: '09:00:00', event: 'User Login Sukses', type: 'info' },
      { timestamp: '09:05:00', event: 'Memulai Tes Papi Kostik', type: 'info' }
    ]
  },
  {
    id: 's3',
    tokenCode: 'FIN-01-A22',
    candidateName: 'Bambang Pamungkas',
    position: 'Accounting',
    status: 'COMPLETED',
    currentActivity: 'Semua Modul Selesai',
    progress: 100,
    tabSwitches: 1,
    remainingSeconds: 0,
    lastSeen: new Date(Date.now() - 45 * 60000).toISOString(),
    device: 'Chrome on Android',
    ip: '110.12.33.9',
    logs: [
      { timestamp: '08:00:00', event: 'Sesi Dimulai', type: 'info' },
      { timestamp: '08:45:00', event: 'Sesi Selesai', type: 'info' }
    ]
  }
];

const TokenRegistry: React.FC = () => {
  const [sessions, setSessions] = useState<TokenSession[]>(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<TokenSession | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [search, setSearch] = useState('');

  const getStatusStyle = (status: SessionStatus) => {
    switch (status) {
      case 'ONLINE': return 'bg-emerald-500 shadow-emerald-500/50 animate-pulse';
      case 'IDLE': return 'bg-amber-500 shadow-amber-500/50';
      case 'OFFLINE': return 'bg-rose-500 shadow-rose-500/50';
      case 'COMPLETED': return 'bg-slate-400';
      case 'SUSPENDED': return 'bg-red-700';
      default: return 'bg-slate-200';
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.candidateName.toLowerCase().includes(search.toLowerCase()) || 
    s.tokenCode.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search & Filter Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari Token atau Nama Peserta..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all font-bold"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            Live Update: {isLive ? 'ON' : 'OFF'}
          </button>
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10">
            + Generate Baru
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Token & Peserta</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Activity</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Log</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sisa Waktu</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSessions.map(session => (
              <tr 
                key={session.id} 
                className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-black text-slate-900">{session.tokenCode}</span>
                      <span className="text-sm font-bold text-slate-500">{session.candidateName}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusStyle(session.status)}`}></div>
                      <span className="text-xs font-black text-slate-800">{session.currentActivity}</span>
                    </div>
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${session.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  {session.tabSwitches > 0 ? (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 w-fit">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">{session.tabSwitches}x Tab Switch</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aman</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="font-mono font-black text-slate-600">
                    {Math.floor(session.remainingSeconds / 60)}:{(session.remainingSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-3 text-slate-400 hover:text-slate-900 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Forensic Drawer */}
      {selectedSession && (
        <div className="fixed inset-0 z-[110] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedSession(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Session Forensic</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">ID: {selectedSession.tokenCode}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Device Section */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Device Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">Browser & OS</p>
                    <p className="font-bold text-slate-800 text-xs">{selectedSession.device}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">IP Address</p>
                    <p className="font-mono font-bold text-slate-800 text-xs">{selectedSession.ip}</p>
                  </div>
                </div>
              </section>

              {/* Audit Timeline */}
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Activity Log</h4>
                <div className="space-y-4 relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100"></div>
                  {selectedSession.logs.map((log, i) => (
                    <div key={i} className="flex gap-6 relative z-10">
                      <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex-shrink-0 mt-1
                        ${log.type === 'warning' ? 'bg-amber-500' : log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 mb-1">{log.timestamp}</p>
                        <p className={`text-sm font-bold ${log.type === 'warning' ? 'text-amber-700' : 'text-slate-700'}`}>{log.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Control Actions */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Emergency Controls</h4>
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all group">
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-sm">🔄 Reset Sesi</p>
                      <p className="text-[10px] text-slate-400 font-bold">Kembalikan status ke 'Unused'</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-sm">⏳ Tambah Waktu</p>
                      <p className="text-[10px] text-slate-400 font-bold">Berikan kompensasi +5 Menit</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl hover:bg-rose-500 group transition-all">
                    <div className="text-left">
                      <p className="font-black text-rose-700 group-hover:text-white text-sm">⛔ Force Stop / Ban</p>
                      <p className="text-[10px] text-rose-400 group-hover:text-white/80 font-bold">Hentikan & Diskualifikasi Sesi</p>
                    </div>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenRegistry;
