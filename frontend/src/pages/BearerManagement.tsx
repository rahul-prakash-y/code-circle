import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Linkedin,
  Upload,
  Loader2,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useBearerStore, { StudentBearer, BearerFormData } from '../store/useBearerStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export const BearerManagement: React.FC = () => {
  const { user } = useAuthStore();
  const {
    bearers,
    loading,
    actionLoading,
    fetchBearers,
    createBearer,
    updateBearer,
    deleteBearer,
    uploadPhoto,
  } = useBearerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBearer, setEditingBearer] = useState<StudentBearer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BearerFormData>({
    name: '',
    position: '',
    photoUrl: '',
    linkedinUrl: '',
    bio: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBearers();
  }, [fetchBearers]);

  // Role Gate: Strict SuperAdmin Check
  const isSuperAdmin = user?.role === 'SuperAdmin';

  // If NOT SuperAdmin, show Apple-style Access Restricted screen
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full surface p-8 rounded-[28px] border border-separator text-center shadow-card space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 shadow-sm">
            <ShieldAlert size={30} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold tracking-wider">
              403 Forbidden
            </span>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              SuperAdmin Clearance Required
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Managing executive student bearers and club appointments is strictly restricted to
              users with the <span className="font-semibold text-text-primary">SuperAdmin</span> role.
              Standard Admin accounts do not have clearance.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              to="/dashboard"
              className="btn-primary py-2.5 px-6 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
            >
              <span>Return to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Filter bearers
  const filteredBearers = useMemo(() => {
    return bearers.filter((b) => {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.position.toLowerCase().includes(q) ||
        (b.bio && b.bio.toLowerCase().includes(q))
      );
    });
  }, [bearers, searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingBearer(null);
    setFormData({
      name: '',
      position: '',
      photoUrl: '',
      linkedinUrl: '',
      bio: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (bearer: StudentBearer) => {
    setEditingBearer(bearer);
    setFormData({
      name: bearer.name,
      position: bearer.position,
      photoUrl: bearer.photoUrl,
      linkedinUrl: bearer.linkedinUrl || '',
      bio: bearer.bio || '',
    });
    setIsModalOpen(true);
  };

  // Photo file upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    setUploadingImage(true);
    const url = await uploadPhoto(file);
    if (url) {
      setFormData((prev) => ({ ...prev, photoUrl: url }));
      toast.success('Photo uploaded successfully!');
    }
    setUploadingImage(false);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error('Name is required');
    }
    if (!formData.position.trim()) {
      return toast.error('Position is required');
    }
    if (!formData.photoUrl.trim()) {
      return toast.error('Photo URL or uploaded portrait is required');
    }
    if (formData.bio && formData.bio.length > 120) {
      return toast.error('Bio cannot exceed 120 characters');
    }

    let success = false;
    if (editingBearer) {
      success = await updateBearer(editingBearer._id, formData);
    } else {
      success = await createBearer(formData);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingBearer(null);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    const success = await deleteBearer(id);
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Student Bearers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-accent/15 text-accent border border-accent/20">
              SuperAdmin Only
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Appoint, configure, and maintain executive club council members and public leadership cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/bearers"
            target="_blank"
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-xl"
            title="Preview Public Page"
          >
            <span>Public View</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={handleOpenCreate}
            className="btn-primary py-2.5 px-5 flex items-center gap-2 text-xs font-semibold cursor-pointer rounded-xl shadow-sm"
          >
            <Plus size={16} />
            <span>Add Bearer</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Executives', value: bearers.length, icon: Crown, statusColor: 'text-text-primary' },
          {
            label: 'Public Display',
            value: `${bearers.length} Live`,
            icon: UserCheck,
            statusColor: 'text-emerald-500',
          },
          {
            label: 'Access Clearance',
            value: 'SuperAdmin',
            icon: Sparkles,
            statusColor: 'text-accent',
          },
          {
            label: 'Campus Visibility',
            value: 'Public',
            icon: CheckCircle2,
            statusColor: 'text-blue-400',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="surface p-5 rounded-[20px] flex items-center justify-between border border-separator shadow-card"
          >
            <div>
              <p className="text-xs font-medium text-text-muted">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold tracking-tight mt-1 ${stat.statusColor}`}>
                {stat.value}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-elevated text-text-secondary flex items-center justify-center border border-separator">
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            placeholder="Search bearers by name, title, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
        <p className="text-xs text-text-muted">
          Showing <span className="font-semibold text-text-primary">{filteredBearers.length}</span> of {bearers.length}
        </p>
      </div>

      {/* Bearers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface p-6 rounded-[22px] border border-separator h-[320px] animate-pulse">
              <div className="w-20 h-20 bg-surface-elevated rounded-2xl mb-4 mx-auto" />
              <div className="w-1/2 h-5 bg-surface-elevated rounded mx-auto mb-2" />
              <div className="w-1/3 h-3 bg-surface-elevated rounded mx-auto mb-6" />
              <div className="w-full h-12 bg-surface-elevated rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredBearers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBearers.map((bearer) => (
            <div
              key={bearer._id}
              className="surface p-6 rounded-[22px] flex flex-col justify-between border border-separator shadow-card hover:border-text-secondary/30 transition-all duration-200 group"
            >
              <div>
                {/* Portrait & Action Buttons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-elevated border border-separator shrink-0 shadow-sm">
                    {bearer.photoUrl ? (
                      <img
                        src={bearer.photoUrl}
                        alt={bearer.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-text-muted text-lg">
                        {bearer.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(bearer)}
                      className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                      title="Edit bearer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(bearer._id)}
                      className="p-1.5 text-text-muted hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete bearer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-text-primary leading-snug">
                    {bearer.name}
                  </h3>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20">
                    <Crown size={11} />
                    <span>{bearer.position}</span>
                  </div>
                </div>

                {/* Bio (max 120 chars) */}
                <div className="mt-3">
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {bearer.bio || <span className="italic text-text-muted">No bio provided</span>}
                  </p>
                </div>
              </div>

              {/* Footer Links & Metadata */}
              <div className="pt-4 mt-4 border-t border-separator flex items-center justify-between text-xs text-text-muted">
                {bearer.linkedinUrl ? (
                  <a
                    href={bearer.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:underline font-medium"
                  >
                    <Linkedin size={12} />
                    <span>LinkedIn</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-text-muted italic">No LinkedIn</span>
                )}

                <span className="text-[10px] text-text-muted font-mono">
                  {bearer.bio ? `${bearer.bio.length}/120 chars` : '0/120'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface p-12 rounded-[22px] text-center border border-separator shadow-card">
          <Crown className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-semibold text-text-primary">No Student Bearers</h3>
          <p className="text-text-muted text-xs mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No student bearers match your search query.'
              : 'Add your first executive bearer to populate the club leadership board.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 btn-primary py-2 px-4 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer rounded-xl"
          >
            <Plus size={14} />
            <span>Add Executive Bearer</span>
          </button>
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT BEARER --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg surface border border-separator rounded-[24px] p-6 shadow-card space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-separator pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-text-primary flex items-center justify-center">
                    <Crown size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      {editingBearer ? 'Edit Executive Bearer' : 'Add Executive Bearer'}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Configure profile, portrait, role, and public bio
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo Upload & Preview Section */}
                <div className="p-4 rounded-2xl bg-canvas border border-separator flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-elevated border border-separator shrink-0 flex items-center justify-center shadow-xs">
                    {uploadingImage ? (
                      <Loader2 size={20} className="animate-spin text-accent" />
                    ) : formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <Upload size={20} className="text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-semibold text-text-primary">Bearer Portrait Photo *</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="btn-secondary py-1.5 px-3 text-xs font-medium cursor-pointer rounded-lg inline-flex items-center gap-1.5"
                      >
                        <Upload size={12} />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                      <span className="text-[11px] text-text-muted">or paste URL below</span>
                    </div>
                  </div>
                </div>

                {/* Direct Photo URL Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Photo URL (Direct Link) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="input-field text-xs"
                  />
                </div>

                {/* Name & Position Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="input-field text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Position / Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g. President, Vice President"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
                    <span>LinkedIn URL (Optional)</span>
                    <Linkedin size={13} className="text-text-muted" />
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="input-field text-xs"
                  />
                </div>

                {/* Bio with strict 120 character counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Bio / Summary (Max 120 chars)
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        (formData.bio?.length || 0) > 110
                          ? 'text-destructive font-semibold'
                          : (formData.bio?.length || 0) > 90
                          ? 'text-amber-500'
                          : 'text-text-muted'
                      }`}
                    >
                      {formData.bio?.length || 0} / 120
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={120}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief highlight of club leadership responsibilities..."
                    className="input-field resize-none text-xs"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-3 border-t border-separator">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 btn-secondary py-2.5 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || uploadingImage}
                    className="flex-1 btn-primary py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : editingBearer ? (
                      'Save Changes'
                    ) : (
                      'Create Bearer'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm surface border border-separator rounded-[24px] p-6 shadow-card space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Remove Bearer?</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Are you sure you want to remove this student bearer from the club council? This action
                  is irreversible.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 btn-secondary py-2 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BearerManagement;
