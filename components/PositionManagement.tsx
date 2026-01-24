import React, { useState } from 'react';
import { JobPosition, TestModule, TestType } from '../types';
import { api } from '../services/apiService';

interface PositionManagementProps {
  positions: JobPosition[];
  availableModules: TestModule[];
  onUpdate: (positions: JobPosition[]) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PositionManagement: React.FC<PositionManagementProps> = ({ positions, availableModules, onUpdate, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingPos, setEditingPos] = useState<JobPosition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    department: '', 
    isActive: true, 
    testIds: [] as string[] 
  });

  const handleToggle = async (pos: JobPosition) => {
    try {
      const updatedPos = { ...pos, isActive: !pos.isActive };
      await api.savePosition(updatedPos);
      const all = await api.getActivePositions();
      onUpdate(all);
      showToast(`Status lowongan ${pos.title} diperbarui.`, "success");
    } catch (err) {
      showToast("Gagal memperbarui status.", "error");
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.department) {
      showToast("Lengkapi Nama Jabatan dan Departemen.", "error");
      return;
    }
    
    if (formData.testIds.length === 0) {
        showToast("Pilih minimal satu jenis tes.", "error");
        return;
    }

    setIsSaving(true);
    try {
      const payload = editingPos ? { ...formData, id: editingPos.id } : formData;
      await api.savePosition(payload);
      const all = await api.getActivePositions();
      onUpdate(all);
      showToast(editingPos ? "Posisi diperbarui." : "Posisi baru ditambahkan.", "success");
      closeModal();
    } catch (err) {
      showToast("Gagal menyimpan ke server.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (pos?: JobPosition) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({ 
          title: pos.title, 
          department: pos.department, 
          isActive: pos.isActive, 
          testIds: pos.testIds || [] 
      });
    } else {
      setEditingPos(null);
      setFormData({ 
          title: '', 
          department: '', 
          isActive: true, 
          testIds: [] 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPos(null);
  };

  const toggleTestSelection = (testId: string) => {
    setFormData(prev => {
      const isSelected = prev.testIds.includes(testId);
      const newTestIds = isSelected 
        ? prev.testIds.filter(id => id !== testId) 
        : [...prev.testIds, testId];
      return { ...prev, testIds: newTestIds };
    });
  };

  const filtered = positions.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari Lowongan / Departemen..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none text-slate-700" 
          />
        </div>
        <button onClick={() => openModal()} className="bg-emerald-600 text-white px-10 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center gap-2">
          + Tambah Lowongan
        </button>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-emerald-50/20">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Lowongan Jabatan</th>
                <th className="px-10 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Mapping Tes</th>
                <th className="px-10 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map(pos => (
                <tr key={pos.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-800 text-lg leading-tight group-hover:text-emerald-700 transition-colors">{pos.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span> {pos.department}
                    </p>
                  </td>
                  <td className="px-10 py-8 text-center">
                      <button onClick={() => handleToggle(pos)} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${pos.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {pos.isActive ? 'BUKA' : 'TUTUP'}
                      </button>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                      {pos.testIds.map((tid, idx) => {
                          const mod = availableModules.find(m => m.id === tid);
                          const testLabel = mod ? mod.title : tid.replace('tm_', '').toUpperCase();
                          return (
                            <span key={tid} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black tracking-tight">
                                {idx + 1}. {testLabel}
                            </span>
                          );
                      })}
                      {pos.testIds.length === 0 && <span className="text-xs text-rose-400 font-bold italic">Belum disetting</span>}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(pos)} title="Edit Posisi" className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={4} className="py-20 text-center">
                          <p className="text-slate-300 font-black text-xl">Tidak ada data posisi ditemukan.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingPos ? 'Edit Posisi' : 'Posisi Baru'}</h3>
                <button onClick={closeModal} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">✕</button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Nama Jabatan</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        placeholder="Contoh: Operator Forklift"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Departemen</label>
                      <input 
                        type="text" 
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})} 
                        placeholder="Contoh: Warehouse"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-800" 
                      />
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urutan Rangkaian Tes</label>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{formData.testIds.length} Dipilih</span>
                  </div>
                  
                  {availableModules.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Bank Soal Kosong</p>
                          <p className="text-[10px] text-slate-400 mt-2 italic">Silakan buat modul tes terlebih dahulu di menu Bank Soal.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableModules.map(mod => {
                          const order = formData.testIds.indexOf(mod.id);
                          const isSelected = order !== -1;
                          
                          // Cosmetic styling based on type
                          let icon = '📄';
                          let colorClass = 'bg-slate-100 text-slate-400';
                          if (mod.type === TestType.DISC) { icon = '🎭'; colorClass = 'bg-emerald-100 text-emerald-600'; }
                          if (mod.type === TestType.PAPI) { icon = '🧠'; colorClass = 'bg-blue-100 text-blue-600'; }
                          if (mod.type === TestType.KRAEPELIN) { icon = '⏱️'; colorClass = 'bg-amber-100 text-amber-600'; }
                          if (mod.type === TestType.ISHIHARA) { icon = '👁️'; colorClass = 'bg-rose-100 text-rose-600'; }
                          if (mod.type === TestType.K3) { icon = '⛑️'; colorClass = 'bg-orange-100 text-orange-600'; }

                          return (
                            <button key={mod.id} 
                                onClick={() => toggleTestSelection(mod.id)}
                                className={`flex items-center justify-between p-4 rounded-3xl border-2 cursor-pointer transition-all
                                ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                              
                              <div className="flex items-center gap-4 text-left">
                                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${colorClass}`}>
                                    {icon}
                                 </div>
                                 <div>
                                    <p className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>{mod.title}</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{mod.type} Module • {mod.questionCount} Soal</p>
                                 </div>
                              </div>

                              {isSelected && (
                                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md animate-in zoom-in duration-300">
                                     #{order + 1}
                                  </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-10 pt-6 border-t border-slate-100">
                <button onClick={closeModal} className="flex-1 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? 'Menyimpan...' : (editingPos ? 'Simpan Perubahan' : 'Buat Lowongan')}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PositionManagement;