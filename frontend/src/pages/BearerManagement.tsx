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
import ResponsiveModal from '../components/ui/ResponsiveModal';
import { EmilCard, EmilButton } from '../components/ui/emil-ui';
import { HeroInput } from '@/components/ui/hero/HeroInput';
import { HeroTextarea } from '@/components/ui/hero/HeroTextarea';
import { HeroAvatar } from '@/components/ui/hero/HeroAvatar';
import { HeroFileInput } from '@/components/ui/hero/HeroFileInput';
import { Button, Link as HeroLink } from '@heroui/react';
import { useDebounce } from '../hooks/useDebounce';

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
  const debouncedSearch = useDebounce(searchQuery, 350);
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

  useEffect(() => {
    fetchBearers();
  }, [fetchBearers]);

  // Role Gate: Strict SuperAdmin Check
  const isSuperAdmin = user?.role === 'SuperAdmin';

  // If NOT SuperAdmin, show Apple-style Access Restricted screen
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full surface p-6 sm:p-8 rounded-[28px] border border-separator text-center shadow-card space-y-5"
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
              className="btn-primary py-2.5 px-6 min-h-[44px] text-xs font-semibold rounded-xl inline-flex items-center gap-2"
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
    if (!debouncedSearch.trim()) return bearers;
    const q = debouncedSearch.toLowerCase().trim();
    return bearers.filter((b) => {
      return (
        b.name.toLowerCase().includes(q) ||
        b.position.toLowerCase().includes(q) ||
        (b.bio && b.bio.toLowerCase().includes(q))
      );
    });
  }, [bearers, debouncedSearch]);

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
  const handlePhotoUpload = async (file: File) => {
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
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-4 max-w-7xl mx-auto">
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
          <p className="text-xs sm:text-sm text-text-muted">
            Appoint, configure, and maintain executive club council members and public leadership cards.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          <Link
            to="/bearers"
            target="_blank"
            className="btn-secondary py-2.5 px-4 min-h-[42px] text-xs font-semibold flex-1 sm:flex-none flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
            title="Preview Public Page"
          >
            <span>Public View</span>
            <ExternalLink size={13} />
          </Link>

          <Button
            variant="primary"
            onPress={handleOpenCreate}
            className="py-2.5 px-5 min-h-[42px] flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-semibold rounded-xl shadow-sm"
          >
            <Plus size={16} />
            <span>Add Bearer</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            className="surface p-4 sm:p-5 rounded-[20px] flex items-center justify-between border border-separator shadow-card"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-text-muted">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold tracking-tight mt-1 ${stat.statusColor}`}>
                {stat.value}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-elevated text-text-secondary flex items-center justify-center border border-separator shrink-0">
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 max-w-md">
          <HeroInput
            placeholder="Search bearers by name, title, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="text-text-muted" size={15} />}
            isClearable
            onClear={() => setSearchQuery('')}
            variant="flat"
            size="sm"
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
              className="surface p-5 sm:p-6 rounded-[22px] flex flex-col justify-between border border-separator shadow-card hover:border-text-secondary/30 transition-all duration-200 group"
            >
              <div>
                {/* Portrait & Action Buttons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <HeroAvatar
                    src={bearer.photoUrl}
                    name={bearer.name}
                    isBordered
                    color="primary"
                    size="lg"
                    className="shrink-0 shadow-sm"
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => handleOpenEdit(bearer)}
                      className="min-w-[36px] min-h-[36px] text-text-muted hover:text-text-primary rounded-xl"
                      title="Edit bearer"
                      aria-label={`Edit ${bearer.name}`}
                    >
                      <Edit2 size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => setDeleteConfirmId(bearer._id)}
                      className="min-w-[36px] min-h-[36px] text-text-muted hover:text-destructive rounded-xl"
                      title="Delete bearer"
                      aria-label={`Delete ${bearer.name}`}
                    >
                      <Trash2 size={15} />
                    </Button>
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
                  <HeroLink
                    target="_blank" rel="noopener noreferrer"
                    href={bearer.linkedinUrl}
                    className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:underline font-medium min-h-[30px]"
                  >
                    <Linkedin size={12} />
                    <span>LinkedIn</span>
                  </HeroLink>
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
        <div className="surface p-8 sm:p-12 rounded-[22px] text-center border border-separator shadow-card">
          <Crown className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-semibold text-text-primary">No Student Bearers</h3>
          <p className="text-text-muted text-xs mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No student bearers match your search query.'
              : 'Add your first executive bearer to populate the club leadership board.'}
          </p>
          <Button
            variant="primary"
            onPress={handleOpenCreate}
            className="mt-4 py-2.5 px-4 min-h-[42px] text-xs font-medium inline-flex items-center gap-1.5 rounded-xl"
          >
            <Plus size={14} />
            <span>Add Executive Bearer</span>
          </Button>
        </div>
      )}

      {/* --- RESPONSIVE MODAL: CREATE / EDIT BEARER --- */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-text-primary flex items-center justify-center shrink-0">
              <Crown size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {editingBearer ? 'Edit Executive Bearer' : 'Add Executive Bearer'}
              </h3>
            </div>
          </div>
        }
        description="Configure profile portrait, leadership title, and public bio"
        dialogClassName="sm:max-w-lg"
      >
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
              <div className="flex flex-wrap items-center gap-2">
                <HeroFileInput
                  variant="button"
                  accept="image/*"
                  buttonText={uploadingImage ? 'Uploading...' : 'Upload Image'}
                  isLoading={uploadingImage}
                  isDisabled={uploadingImage}
                  color="primary"
                  startContent={<Upload size={12} />}
                  onFilesSelected={(files) => {
                    if (files[0]) handlePhotoUpload(files[0]);
                  }}
                  showChips={false}
                />
                <span className="text-[11px] text-text-muted">or paste URL below</span>
              </div>
            </div>
          </div>

          {/* Direct Photo URL Input */}
          <HeroInput
            label="Photo URL (Direct Link)"
            labelPlacement="inside"
            variant="flat"
            type="url"
            isRequired
            value={formData.photoUrl}
            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
            placeholder="https://images.unsplash.com/photo-..."
          />

          {/* Name & Position Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HeroInput
              label="Full Name"
              labelPlacement="inside"
              variant="flat"
              isRequired
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aarav Sharma"
            />

            <HeroInput
              label="Position / Title"
              labelPlacement="inside"
              variant="flat"
              isRequired
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. President, Vice President"
            />
          </div>

          {/* LinkedIn URL */}
          <HeroInput
            label="LinkedIn URL (Optional)"
            labelPlacement="inside"
            variant="flat"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/username"
            startContent={<Linkedin size={15} className="text-text-muted" />}
          />

          {/* Bio with strict 120 character counter */}
          <HeroTextarea
            label={`Bio / Summary (${formData.bio?.length || 0}/120 chars)`}
            labelPlacement="inside"
            variant="flat"
            rows={3}
            maxLength={120}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Brief highlight of club leadership responsibilities..."
          />

          {/* Modal Actions */}
          <div className="flex gap-3 pt-3 border-t border-separator">
            <Button
              type="button"
              variant="outline"
              onPress={() => setIsModalOpen(false)}
              className="flex-1 min-h-[44px] text-xs font-medium rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={actionLoading || uploadingImage}
              isLoading={actionLoading}
              className="flex-1 min-h-[44px] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              {editingBearer ? 'Save Changes' : 'Create Bearer'}
            </Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* --- RESPONSIVE MODAL: DELETE CONFIRMATION --- */}
      <ResponsiveModal
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
        title="Remove Bearer?"
        description="Are you sure you want to remove this student bearer from the club council? This action is irreversible."
        dialogClassName="sm:max-w-sm"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
            <AlertTriangle size={24} />
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onPress={() => setDeleteConfirmId(null)}
              className="flex-1 min-h-[42px] text-xs font-medium rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onPress={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              isDisabled={actionLoading}
              isLoading={actionLoading}
              className="flex-1 min-h-[42px] rounded-xl text-xs font-semibold"
            >
              Delete
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default BearerManagement;
