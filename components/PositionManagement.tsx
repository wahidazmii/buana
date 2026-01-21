
import React, { useState } from 'react';
import { JobPosition } from '../types';

interface PositionManagementProps {
  positions: JobPosition[];
  onSave: (pos: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PositionManagement: React.FC<PositionManagementProps> = ({ positions, onSave, onDelete, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingPos, setEditingPos] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState({ title: '', department: '', isActive: true, testIds: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (pos: JobPosition) => {
    const success = await onSave({ ...pos, isActive: !pos.isActive });
    if (success) showToast("Status lowongan diperbarui.", "info");
  };

  const handleDelete = async (pos: JobPosition) => {
    if (pos.applicantCount > 0) {
      showToast(`Posisi memiliki pelamar aktif. Tidak dapat dihapus.`, "error");
      return;
    }
    await onDelete(pos.id);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.department) {
      showToast("Lengkapi data wajib posisi.", "error");
      return;
    }

    setIsSaving(true);
    const posToSave = editingPos ? { ...formData, id: editingPos.id } : formData;
    const success = await onSave(posToSave);
    setIsSaving(false);

    if (success) {
      showToast(editingPos ? "Data posisi diperbarui." : "Posisi baru ditambahkan.", "success");
      closeModal();
    }
  };

  const openModal = (pos?: JobPosition) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({ title: pos.title, department: pos.department, isActive: pos.isActive, testIds: pos.testIds || [] });
    } else {
      setEditingPos(null);
      setFormData({ title: '', department: '', isActive: true, testIds: ['tm_disc'] });
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

  const filtered = (positions || []).filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari Lowongan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none" />
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
              {filtered.map(pos => (
                <tr key={pos.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-800 text-lg leading-tight">{pos.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{pos.department}</p>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button onClick={() => handleToggle(pos)} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${pos.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {pos.isActive ? 'Buka' : 'Tutup'}
                    </button>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {pos.testIds.map(tid => (
                        <span key={tid} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">{tid.split('_')[1]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openModal(pos)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDelete(pos)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-8">{editingPos ? 'Edit Konfigurasi Posisi' : 'Tambah Posisi Baru'}</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Jabatan</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Departemen / Divisi</label>
                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none" />
              </div>

              <div className="pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 block">Rangkaian Tes (Wajib Dikerjakan)</label>
                <div className="space-y-3">
                  {['tm_disc', 'tm_kraepelin', 'tm_k3'].map(tid => (
                    <label key={tid} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-emerald-100 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.testIds.includes(tid)}
                        onChange={() => toggleTestSelection(tid)}
                        className="w-5 h-5 accent-emerald-500"
                      />
                      <span className="font-bold text-slate-700 text-sm uppercase tracking-tight">{tid.split('_')[1].toUpperCase()} Modul Tes</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button onClick={closeModal} className="flex-1 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 disabled:opacity-50">
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionManagement;
