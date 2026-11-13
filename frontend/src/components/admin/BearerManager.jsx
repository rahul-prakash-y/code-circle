import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { HeroFileInput } from '../ui/hero/HeroFileInput';
import useBearerStore from '../../store/useBearerStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Github, Linkedin, Mail, Shield, Terminal, Cpu, Layout, Loader2 } from 'lucide-react';

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
      toast.success('Image uploaded successfully');
    } catch {
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
          <h2 className="text-2xl font-semibold text-text-primary tracking-tight">Manage student bearers</h2>
          <p className="text-text-muted text-sm font-normal">Add or update the club leadership board.</p>
        </div>
        <Button
          color="primary"
          variant="solid"
          onPress={() => handleOpenModal()}
          startContent={<Plus size={18} />}
          className="rounded-xl font-medium shadow-sm"
        >
          Add bearer
        </Button>
      </div>

      {loading && bearers.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bearers.map((bearer) => (
            <div key={bearer._id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                    {bearer.iconType === 'Shield' && <Shield className="w-5 h-5 text-accent-muted" />}
                    {bearer.iconType === 'Terminal' && <Terminal className="w-5 h-5 text-purple-400" />}
                    {bearer.iconType === 'Cpu' && <Cpu className="w-5 h-5 text-pink-400" />}
                    {bearer.iconType === 'Layout' && <Layout className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div className="flex gap-1.5">
                    <Button 
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenModal(bearer)}
                      className="rounded-lg text-text-muted hover:text-text-primary"
                      aria-label="Edit bearer"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(bearer._id)}
                      className="rounded-lg text-text-muted hover:text-danger"
                      aria-label="Delete bearer"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-text-primary">{bearer.name}</h3>
                <p className="text-accent-muted text-xs font-semibold uppercase tracking-wider mb-2">{bearer.role}</p>
                <p className="text-text-muted text-sm font-normal mb-4">{bearer.specialization}</p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                {bearer.socialLinks.github && <Github className="w-4 h-4 text-text-muted" />}
                {bearer.socialLinks.linkedin && <Linkedin className="w-4 h-4 text-text-muted" />}
                {bearer.socialLinks.email && <Mail className="w-4 h-4 text-text-muted" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-elevated border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <Button 
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 rounded-xl text-text-muted hover:text-text-primary"
              aria-label="Close modal"
            >
              <X size={20} />
            </Button>

            <h3 className="text-2xl font-semibold text-text-primary tracking-tight mb-6">
              {editingBearer ? 'Edit bearer' : 'Add new bearer'}
            </h3>

            {/* Profile Pic Upload */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-surface-elevated border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                  {formData.profilePicUrl ? (
                    <img src={formData.profilePicUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Shield size={32} className="text-text-muted" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <HeroFileInput
                    accept="image/*"
                    isDisabled={uploading}
                    isLoading={uploading}
                    showChips={false}
                    buttonText="Upload"
                    variant="compact"
                    startContent={<Plus size={14} />}
                    onFilesSelected={(files) => handleImageUpload({ target: { files } })}
                    aria-label="Upload bearer portrait"
                  />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">Profile portrait</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Full name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Role</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Icon theme</label>
                <div className="flex gap-4 p-2 bg-surface-elevated border border-slate-700 rounded-xl">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, iconType: icon})}
                      className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${formData.iconType === icon ? 'bg-accent text-text-primary' : 'hover:bg-surface-elevated text-text-muted'}`}
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
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">GitHub URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.github}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, github: e.target.value}})}
                    className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, linkedin: e.target.value}})}
                    className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Instagram URL</label>
                  <input
                    type="text"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})}
                    className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1">Contact email</label>
                <input
                  type="email"
                  value={formData.socialLinks.email}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, email: e.target.value}})}
                  className="w-full bg-surface-elevated border border-slate-700 rounded-xl px-4 py-2.5 text-text-primary focus:border-blue-500 transition-colors font-normal"
                />
              </div>

              <Button
                type="submit"
                color="primary"
                variant="solid"
                isLoading={loading}
                className="w-full font-medium py-3 rounded-xl mt-6 shadow-sm"
              >
                {editingBearer ? 'Update bearer' : 'Create bearer'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BearerManager;
