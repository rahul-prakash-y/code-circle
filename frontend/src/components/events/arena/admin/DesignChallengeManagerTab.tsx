import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Play,
  Plus,
  Trash2,
  Check,
  Image as ImageIcon,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { HeroFileInput } from '@/components/ui/hero/HeroFileInput';
import { ArenaAssessment } from '../../../../store/useEventArenaStore';

interface DesignChallengeManagerTabProps {
  eventId: string;
  selectedAssessment: ArenaAssessment;
  adminDesignChallenge: any;
  adminDesignChallenges: any[];
  canManageSelected: boolean;
  actionLoading: boolean;
  onSaveDesignChallenge: (data: { challenges: any[] }) => Promise<void>;
  uploadDesignImage: (file: File) => Promise<string>;
  onPreviewImage: (url: string) => void;
  onCloseModal: () => void;
}

export const DesignChallengeManagerTab: React.FC<DesignChallengeManagerTabProps> = memo(({
  eventId,
  selectedAssessment,
  adminDesignChallenge,
  adminDesignChallenges,
  canManageSelected,
  actionLoading,
  onSaveDesignChallenge,
  uploadDesignImage,
  onPreviewImage,
  onCloseModal,
}) => {
  const navigate = useNavigate();
  const [designChallengesList, setDesignChallengesList] = useState<any[]>([]);
  const [activeDesignOptionIdx, setActiveDesignOptionIdx] = useState(0);

  // Design Challenge Form state
  const [designTitle, setDesignTitle] = useState('');
  const [designDesc, setDesignDesc] = useState('');
  const [designProblem, setDesignProblem] = useState('');
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [designRefFigma, setDesignRefFigma] = useState('');
  const [designDeliverables, setDesignDeliverables] = useState<string[]>([
    'High-fidelity Desktop & Mobile layouts',
    'Interactive Prototype link with micro-interactions',
    'Consistent Component Design System',
  ]);
  const [designGuidelines, setDesignGuidelines] = useState<string[]>([
    'Adhere to visual hierarchy and readable typography scale',
    'Proper color contrast adhering to WCAG AA standard',
    'Use Figma auto-layout and clear layer naming',
  ]);
  const [designPoints, setDesignPoints] = useState(100);
  const [uploadingDesignImg, setUploadingDesignImg] = useState(false);

  // Sync design challenge form fields
  useEffect(() => {
    const dcs =
      adminDesignChallenges && adminDesignChallenges.length > 0
        ? adminDesignChallenges
        : selectedAssessment?.designChallenges && selectedAssessment.designChallenges.length > 0
        ? selectedAssessment.designChallenges
        : adminDesignChallenge
        ? [adminDesignChallenge]
        : selectedAssessment?.designChallenge
        ? [selectedAssessment.designChallenge]
        : [];

    if (dcs.length > 0) {
      setDesignChallengesList(dcs);
      const safeIdx = Math.min(activeDesignOptionIdx, dcs.length - 1);
      const dc = dcs[safeIdx] || dcs[0];
      setDesignTitle(dc.title || selectedAssessment?.title || '');
      setDesignDesc(dc.description || selectedAssessment?.description || '');
      setDesignProblem(dc.problemStatement || '');
      setDesignImageUrl(dc.referenceImageUrl || dc.designImageUrl || '');
      setDesignRefFigma(dc.figmaStarterUrl || dc.referenceFigmaUrl || '');
      if (dc.deliverables && dc.deliverables.length > 0) {
        setDesignDeliverables(dc.deliverables);
      }
      if (dc.guidelines && dc.guidelines.length > 0) {
        setDesignGuidelines(dc.guidelines);
      }
      setDesignPoints(dc.totalPoints || dc.points || selectedAssessment?.totalPoints || 100);
    } else if (selectedAssessment) {
      const defaultInitial = [
        {
          title: selectedAssessment.title || 'UI/UX Design Challenge',
          description: selectedAssessment.description || '',
          problemStatement: '',
          designImageUrl: '',
          referenceFigmaUrl: '',
          deliverables: [
            'High-fidelity Desktop & Mobile layouts',
            'Interactive Prototype link with micro-interactions',
            'Consistent Component Design System',
          ],
          guidelines: [
            'Adhere to visual hierarchy and readable typography scale',
            'Proper color contrast adhering to WCAG AA standard',
            'Use Figma auto-layout and clear layer naming',
          ],
          points: selectedAssessment.totalPoints || 100,
        },
      ];
      setDesignChallengesList(defaultInitial);
      setDesignTitle(defaultInitial[0].title);
      setDesignDesc(defaultInitial[0].description);
      setDesignProblem('');
      setDesignImageUrl('');
      setDesignRefFigma('');
      setDesignPoints(selectedAssessment.totalPoints || 100);
    }
  }, [adminDesignChallenge, adminDesignChallenges, selectedAssessment?._id]);

  const switchActiveChallengeOption = (targetIdx: number) => {
    const currentList = [...designChallengesList];
    if (currentList[activeDesignOptionIdx]) {
      currentList[activeDesignOptionIdx] = {
        ...currentList[activeDesignOptionIdx],
        title: designTitle.trim() || `Problem Statement ${activeDesignOptionIdx + 1}`,
        description: designDesc.trim(),
        problemStatement: designProblem.trim(),
        designImageUrl: designImageUrl.trim(),
        referenceFigmaUrl: designRefFigma.trim(),
        deliverables: designDeliverables.filter((d) => d.trim()),
        guidelines: designGuidelines.filter((g) => g.trim()),
        points: Number(designPoints) || 100,
      };
    }
    setDesignChallengesList(currentList);
    setActiveDesignOptionIdx(targetIdx);

    const target = currentList[targetIdx];
    if (target) {
      setDesignTitle(target.title || '');
      setDesignDesc(target.description || '');
      setDesignProblem(target.problemStatement || '');
      setDesignImageUrl(target.referenceImageUrl || target.designImageUrl || '');
      setDesignRefFigma(target.figmaStarterUrl || target.referenceFigmaUrl || '');
      setDesignDeliverables(
        target.deliverables && target.deliverables.length > 0
          ? target.deliverables
          : ['High-fidelity Desktop & Mobile layouts', 'Interactive Prototype link']
      );
      setDesignGuidelines(
        target.guidelines && target.guidelines.length > 0
          ? target.guidelines
          : ['Use Figma Auto-layout', 'Ensure accessible color contrast']
      );
      setDesignPoints(target.totalPoints || target.points || 100);
    }
  };

  const handleAddDesignChallengeOption = () => {
    const currentList = [...designChallengesList];
    if (currentList[activeDesignOptionIdx]) {
      currentList[activeDesignOptionIdx] = {
        ...currentList[activeDesignOptionIdx],
        title: designTitle.trim() || `Problem Statement ${activeDesignOptionIdx + 1}`,
        description: designDesc.trim(),
        problemStatement: designProblem.trim(),
        designImageUrl: designImageUrl.trim(),
        referenceFigmaUrl: designRefFigma.trim(),
        deliverables: designDeliverables.filter((d) => d.trim()),
        guidelines: designGuidelines.filter((g) => g.trim()),
        points: Number(designPoints) || 100,
      };
    }

    const newIdx = currentList.length;
    const newOption = {
      title: `Problem Statement ${newIdx + 1}`,
      description: 'Alternative problem design for students to choose from',
      problemStatement: '',
      designImageUrl: '',
      referenceFigmaUrl: '',
      deliverables: ['High-fidelity Desktop & Mobile layouts', 'Interactive Prototype link'],
      guidelines: ['Use Figma Auto-layout', 'Ensure accessible WCAG contrast'],
      points: 100,
    };
    const updated = [...currentList, newOption];
    setDesignChallengesList(updated);
    setActiveDesignOptionIdx(newIdx);

    setDesignTitle(newOption.title);
    setDesignDesc(newOption.description);
    setDesignProblem('');
    setDesignImageUrl('');
    setDesignRefFigma('');
    setDesignDeliverables(newOption.deliverables);
    setDesignGuidelines(newOption.guidelines);
    setDesignPoints(100);

    toast.success(`Problem Statement ${newIdx + 1} added! Enter the challenge details below.`);
  };

  const handleRemoveDesignChallengeOption = async (removeIdx: number) => {
    if (designChallengesList.length <= 1) {
      return toast.error('At least one design challenge problem statement is required.');
    }
    if (!window.confirm(`Delete Problem Statement #${removeIdx + 1}? This cannot be undone.`)) {
      return;
    }
    const updated = designChallengesList.filter((_, idx) => idx !== removeIdx);
    setDesignChallengesList(updated);
    const nextIdx = Math.max(0, removeIdx - 1);
    setActiveDesignOptionIdx(nextIdx);
    const target = updated[nextIdx];
    if (target) {
      setDesignTitle(target.title || '');
      setDesignDesc(target.description || '');
      setDesignProblem(target.problemStatement || '');
      setDesignImageUrl(target.referenceImageUrl || target.designImageUrl || '');
      setDesignRefFigma(target.figmaStarterUrl || target.referenceFigmaUrl || '');
      if (target.deliverables) setDesignDeliverables(target.deliverables);
      if (target.guidelines) setDesignGuidelines(target.guidelines);
      setDesignPoints(target.totalPoints || target.points || 100);
    }
    await onSaveDesignChallenge({ challenges: updated });
    toast.success('Design challenge problem removed and updated.');
  };

  const handleUploadDesignFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file (PNG, JPG, WEBP, etc.)');
    }
    setUploadingDesignImg(true);
    try {
      const url = await uploadDesignImage(file);
      setDesignImageUrl(url);
      toast.success('Design reference image uploaded successfully!');
    } catch {
      // toast in store
    } finally {
      setUploadingDesignImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designTitle.trim()) {
      return toast.error('Please enter a challenge title');
    }
    if (!designImageUrl.trim()) {
      return toast.error('Please upload or provide a reference design image');
    }

    const currentList = [...designChallengesList];
    currentList[activeDesignOptionIdx] = {
      title: designTitle.trim(),
      description: designDesc.trim(),
      problemStatement: designProblem.trim(),
      designImageUrl: designImageUrl.trim(),
      referenceFigmaUrl: designRefFigma.trim(),
      deliverables: designDeliverables.filter((d) => d.trim()),
      guidelines: designGuidelines.filter((g) => g.trim()),
      points: Number(designPoints) || 100,
    };

    await onSaveDesignChallenge({
      challenges: currentList,
    });
    setDesignChallengesList(currentList);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <Palette size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-label-primary flex items-center gap-2">
              <span>UI/UX & Figma Design Challenge Configuration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {designChallengesList.length} Problem{designChallengesList.length > 1 ? 's' : ''} Configured
              </span>
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              Create multiple problem statements for students. In the assessment arena, students can pick any 1 problem to solve and submit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<Play size={13} className="text-pink-400 fill-pink-400" />}
            onPress={() => {
              onCloseModal();
              navigate(`/events/${eventId}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
            }}
            className="rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 text-xs font-semibold border border-pink-500/30"
          >
            Preview Test
          </Button>
          {canManageSelected && (
            <Button
              size="sm"
              variant="solid"
              color="secondary"
              onPress={handleAddDesignChallengeOption}
              startContent={<Plus size={13} />}
              className="rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30"
            >
              Add New Problem Statement
            </Button>
          )}
        </div>
      </div>

      {/* MULTI-PROBLEM SELECTOR & MANAGEMENT BAR */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-pink-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-label-primary">
              Configured Problem Statements ({designChallengesList.length})
            </h5>
          </div>
          <span className="text-[11px] text-label-tertiary">
            Currently Editing: <strong className="text-pink-400">Problem #{activeDesignOptionIdx + 1}</strong>
          </span>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {designChallengesList.map((ch: any, idx: number) => {
            const isActive = activeDesignOptionIdx === idx;
            return (
              <button
                type="button"
                key={idx}
                onClick={() => switchActiveChallengeOption(idx)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  isActive
                    ? 'bg-pink-500/15 border-pink-500/50 shadow-sm ring-1 ring-pink-500/30'
                    : 'bg-surface border-separator hover:border-pink-500/30 hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-pink-500/25 text-pink-300' : 'bg-surface-secondary text-label-tertiary'
                    }`}
                  >
                    Problem #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-label-secondary font-bold">
                      {ch.points || 100} pts
                    </span>
                    {designChallengesList.length > 1 && canManageSelected && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemoveDesignChallengeOption(idx)}
                        className="w-6 h-6 min-w-6 min-h-6 text-label-tertiary hover:text-destructive"
                        title="Delete this problem"
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="font-bold text-xs text-label-primary truncate">
                    {ch.title || `Problem Statement #${idx + 1}`}
                  </p>
                  <p className="text-[10px] text-label-tertiary line-clamp-1">
                    {ch.description || ch.problemStatement || 'No description provided'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-label-tertiary pt-2 border-t border-separator/40">
                  <span className="inline-flex items-center gap-1">
                    {ch.designImageUrl || ch.referenceImageUrl ? (
                      <>
                        <Check size={11} className="text-emerald-500" />
                        <span>Image Attached</span>
                      </>
                    ) : (
                      'No image'
                    )}
                  </span>
                  <span className={`font-bold ${isActive ? 'text-pink-400' : 'text-label-secondary'}`}>
                    {isActive ? '● Editing' : 'Click to Edit'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Active Problem Editor Banner */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-label-primary">
              Editing Problem #{activeDesignOptionIdx + 1}: <span className="text-pink-400">{designTitle || 'Untitled Challenge'}</span>
            </h4>
          </div>
          <span className="text-[11px] text-label-tertiary">
            Remember to click Save Challenge below after editing
          </span>
        </div>

        {/* SECTION 1: REFERENCE DESIGN IMAGE UPLOAD */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                <ImageIcon size={14} className="text-pink-400" />
                <span>Design Reference Mockup Image</span>
                <span className="text-rose-400">*</span>
              </label>
              <p className="text-[11px] text-text-muted mt-0.5">
                Upload a high-resolution design mockup/wireframe that students must replicate or take inspiration from.
              </p>
            </div>
            {designImageUrl && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => onPreviewImage(designImageUrl)}
                startContent={<Maximize2 size={12} />}
                className="rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-label-primary"
              >
                Preview Fullscreen
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <HeroFileInput
                variant="dropzone"
                accept="image/*"
                buttonText="Click or Drag Image Here"
                description="PNG, JPG, SVG, WEBP up to 10MB"
                isLoading={uploadingDesignImg}
                isDisabled={uploadingDesignImg || !canManageSelected}
                color="secondary"
                onFilesSelected={(files) => {
                  if (files[0]) handleUploadDesignFile(files[0]);
                }}
                showChips={false}
              />

              <div className="relative">
                <span className="text-[11px] text-text-muted block mb-1">Or paste direct image URL:</span>
                <input
                  type="url"
                  value={designImageUrl}
                  onChange={(e) => setDesignImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or image link"
                  disabled={!canManageSelected}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none"
                />
              </div>
            </div>

            {/* Image Preview Box */}
            <div className="h-52 rounded-2xl border border-separator bg-black/40 overflow-hidden flex items-center justify-center relative group">
              {designImageUrl ? (
                <>
                  <img
                    src={designImageUrl}
                    alt="Design Reference"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => onPreviewImage(designImageUrl)}
                      startContent={<Maximize2 size={13} />}
                      className="rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm"
                    >
                      Inspect
                    </Button>
                    {canManageSelected && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => setDesignImageUrl('')}
                        startContent={<Trash2 size={13} />}
                        className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold backdrop-blur-sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <ImageIcon size={32} className="opacity-30" />
                  <span className="text-xs">No reference image uploaded yet</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: CHALLENGE DETAILS & PROBLEM STATEMENT */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-label-secondary mb-1.5">
                Challenge Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={designTitle}
                onChange={(e) => setDesignTitle(e.target.value)}
                placeholder="e.g. Modern Fintech Banking App Mobile & Desktop UI"
                disabled={!canManageSelected}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-label-secondary mb-1.5">
                Total Points
              </label>
              <input
                type="number"
                min={10}
                value={designPoints}
                onChange={(e) => setDesignPoints(Number(e.target.value))}
                disabled={!canManageSelected}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-label-secondary mb-1.5">
              Brief Overview / Description
            </label>
            <input
              type="text"
              value={designDesc}
              onChange={(e) => setDesignDesc(e.target.value)}
              placeholder="e.g. Design a sleek, high-conversion crypto & banking experience with rich micro-interactions."
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-label-secondary mb-1.5">
              Problem Statement & Functional Requirements
            </label>
            <textarea
              rows={4}
              value={designProblem}
              onChange={(e) => setDesignProblem(e.target.value)}
              placeholder="Detail the target audience, user personas, key flows (Onboarding, Dashboard, Transactions), design constraints, and expected user journeys..."
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none resize-none disabled:opacity-50 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-label-secondary mb-1.5 flex items-center justify-between">
              <span>Reference / Starter Figma URL (Optional)</span>
              <span className="text-[10px] text-text-muted">Students can duplicate this file</span>
            </label>
            <input
              type="url"
              value={designRefFigma}
              onChange={(e) => setDesignRefFigma(e.target.value)}
              placeholder="https://www.figma.com/file/... (starter kit / UI kit)"
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* SECTION 3: DELIVERABLES CHECKLIST */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-label-primary ">Expected Deliverables</h5>
              <p className="text-[11px] text-text-muted">Items students must complete in their Figma file.</p>
            </div>
            {canManageSelected && (
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                onPress={() => setDesignDeliverables([...designDeliverables, ''])}
                startContent={<Plus size={12} />}
                className="rounded-lg text-xs font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30"
              >
                Add Deliverable
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {designDeliverables.map((deliv, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500/15 text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={deliv}
                  onChange={(e) => {
                    const copy = [...designDeliverables];
                    copy[idx] = e.target.value;
                    setDesignDeliverables(copy);
                  }}
                  placeholder="e.g. Responsive Desktop layout (1440px) and Mobile layout (390px)"
                  disabled={!canManageSelected}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-pink-500 disabled:opacity-50"
                />
                {canManageSelected && designDeliverables.length > 1 && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setDesignDeliverables(designDeliverables.filter((_, i) => i !== idx))}
                    className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: GUIDELINES & EVALUATION CRITERIA */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-label-primary ">Guidelines & Evaluation Criteria</h5>
              <p className="text-[11px] text-text-muted">Rubric used by admins when grading design links.</p>
            </div>
            {canManageSelected && (
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                onPress={() => setDesignGuidelines([...designGuidelines, ''])}
                startContent={<Plus size={12} />}
                className="rounded-lg text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30"
              >
                Add Guideline
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {designGuidelines.map((guide, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={guide}
                  onChange={(e) => {
                    const copy = [...designGuidelines];
                    copy[idx] = e.target.value;
                    setDesignGuidelines(copy);
                  }}
                  placeholder="e.g. Visual Hierarchy, Spacing consistency, WCAG AA Contrast"
                  disabled={!canManageSelected}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 disabled:opacity-50"
                />
                {canManageSelected && designGuidelines.length > 1 && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setDesignGuidelines(designGuidelines.filter((_, i) => i !== idx))}
                    className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SAVE BUTTONS */}
        {canManageSelected && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-4">
            <Button
              type="button"
              size="sm"
              variant="flat"
              onPress={handleAddDesignChallengeOption}
              startContent={<Plus size={14} />}
              className="rounded-xl bg-surface-secondary border border-separator hover:bg-surface text-label-primary text-xs font-bold"
            >
              + Add Another Problem Statement
            </Button>

            <Button
              type="submit"
              size="sm"
              variant="solid"
              color="secondary"
              isLoading={actionLoading}
              startContent={<CheckCircle2 size={14} />}
              className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30"
            >
              Save Problem Statements ({designChallengesList.length})
            </Button>
          </div>
        )}
      </form>
    </div>
  );
});

DesignChallengeManagerTab.displayName = 'DesignChallengeManagerTab';
