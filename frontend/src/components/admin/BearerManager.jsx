import React, { useState, useEffect } from 'react';
import useBearerStore from '../../store/useBearerStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Github, Linkedin, Mail, Instagram, Shield, Terminal, Cpu, Layout, Loader2, Camera } from 'lucide-react';

const icons = ['Shield', 'Terminal', 'Cpu', 'Layout'];

const BearerManager = () => {
  const { bearers, loading, fetchBearers, addBearer, updateBearer, deleteBearer } = useBearerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBearer, setEditingBearer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialization: '',
    iconType: 'Shield',
    profilePicUrl: '',
    socialLinks: { github: '', linkedin: '', instagram: '', email: '' }
  });

  useEffect(() => {
    fetchBearers();
  }, [fetchBearers]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/upload/profile-pic', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, profilePicUrl: response.data.url });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (bearer = null) => {
    if (bearer) {
      setEditingBearer(bearer);
      setFormData({
        name: bearer.name,
        role: bearer.role,
        specialization: bearer.specialization,
        iconType: bearer.iconType,
        profilePicUrl: bearer.profilePicUrl || '',
        socialLinks: { 
          github: bearer.socialLinks?.github || '',
          linkedin: bearer.socialLinks?.linkedin || '',
          instagram: bearer.socialLinks?.instagram || '',
          email: bearer.socialLinks?.email || ''
        }
      });
    } else {
      setEditingBearer(null);
      setFormData({
        name: '',
        role: '',
        specialization: '',
        iconType: 'Shield',
        profilePicUrl: '',
        socialLinks: { github: '', linkedin: '', instagram: '', email: '' }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success;
    if (editingBearer) {
      success = await updateBearer(editingBearer._id, formData);
    } else {
      success = await addBearer(formData);
    }
    if (success) setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this bearer?')) {
      await deleteBearer(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Student Bearers</h2>
          <p className="text-slate-400 text-sm">Add or update the club leadership board.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
        >
          <Plus size={18} />
          Add Bearer
        </button>
      </div>

      {loading && bearers.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bearers.map((bearer) => (
            <div key={bearer._id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    {bearer.iconType === 'Shield' && <Shield className="w-5 h-5 text-blue-400" />}
                    {bearer.iconType === 'Terminal' && <Terminal className="w-5 h-5 text-purple-400" />}
                    {bearer.iconType === 'Cpu' && <Cpu className="w-5 h-5 text-pink-400" />}
                    {bearer.iconType === 'Layout' && <Layout className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenModal(bearer)}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(bearer._id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white">{bearer.name}</h3>
                <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2">{bearer.role}</p>
                <p className="text-slate-400 text-sm mb-4">{bearer.specialization}</p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-white/5">
                {bearer.socialLinks.github && <Github className="w-4 h-4 text-slate-500" />}
                {bearer.socialLinks.linkedin && <Linkedin className="w-4 h-4 text-slate-500" />}
                {bearer.socialLinks.email && <Mail className="w-4 h-4 text-slate-500" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-white mb-6">
              {editingBearer ? 'Edit Bearer' : 'Add New Bearer'}
            </h3>

            {/* Profile Pic Upload */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                  {formData.profilePicUrl ? (
                    <img src={formData.profilePicUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Shield size={32} className="text-slate-600" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl cursor-pointer transition-all">
                  <Plus size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Profile Portrait</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Role</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Icon Theme</label>
                <div className="flex gap-4 p-2 bg-slate-800 border border-slate-700 rounded-xl">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, iconType: icon})}
                      className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-all ${formData.iconType === icon ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      {icon === 'Shield' && <Shield size={18} />}
                      {icon === 'Terminal' && <Terminal size={18} />}
                      {icon === 'Cpu' && <Cpu size={18} />}
                      {icon === 'Layout' && <Layout size={18} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">GitHub URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.github}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, github: e.target.value}})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, linkedin: e.target.value}})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Instagram URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.socialLinks.email}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, email: e.target.value}})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBearer ? 'Update Bearer' : 'Create Bearer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BearerManager;
