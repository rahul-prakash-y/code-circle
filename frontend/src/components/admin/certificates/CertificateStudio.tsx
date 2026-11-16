import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Check,
  AlertTriangle,
  X,
  FileCheck,
  Send,
  Sliders,
  Eye,
  ShieldCheck,
  Trash2,
  Copy,
  ExternalLink,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useCertificateStore, { CertificateTemplate } from '../../../store/useCertificateStore';
import useEventStore from '../../../store/useEventStore';
import useDomainStore from '../../../store/useDomainStore';
import useUserStore from '../../../store/useUserStore';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';

export const THEMES = [
  { id: 'classic-ivory', label: 'Classic Pearl Ivory', primary: '#1e3a8a', secondary: '#d97706', bg: '#f8fafc', card: '#ffffff', text: '#0f172a', textMuted: '#475569', border: '#1e40af' },
  { id: 'imperial-gold', label: 'Imperial Ivory Gold', primary: '#b45309', secondary: '#d97706', bg: '#fefce8', card: '#ffffff', text: '#1c1917', textMuted: '#78716c', border: '#ca8a04' },
  { id: 'royal-sapphire', label: 'Royal Sapphire Light', primary: '#0284c7', secondary: '#0369a1', bg: '#f0f9ff', card: '#ffffff', text: '#0c4a6e', textMuted: '#475569', border: '#0284c7' },
  { id: 'emerald-merit', label: 'Emerald Jade Merit', primary: '#059669', secondary: '#047857', bg: '#f0fdf4', card: '#ffffff', text: '#064e3b', textMuted: '#4b5563', border: '#059669' },
  { id: 'ruby-excellence', label: 'Ruby Velvet Light', primary: '#e11d48', secondary: '#be123c', bg: '#fff1f2', card: '#ffffff', text: '#881337', textMuted: '#6b7280', border: '#e11d48' },
  { id: 'amethyst-prestige', label: 'Amethyst Violet Light', primary: '#7c3aed', secondary: '#6d28d9', bg: '#faf5ff', card: '#ffffff', text: '#4c1d95', textMuted: '#6b7280', border: '#7c3aed' },
  { id: 'monochrome-executive', label: 'Executive Platinum Minimal', primary: '#0f172a', secondary: '#334155', bg: '#f8fafc', card: '#ffffff', text: '#020617', textMuted: '#64748b', border: '#334155' },
  { id: 'ocean-azure', label: 'Oceanic Azure Teal', primary: '#0d9488', secondary: '#0f766e', bg: '#f0fdfa', card: '#ffffff', text: '#134e4a', textMuted: '#52525b', border: '#0d9488' },
  { id: 'crimson-collegiate', label: 'Harvard Crimson Collegiate', primary: '#991b1b', secondary: '#b91c1c', bg: '#fef2f2', card: '#ffffff', text: '#450a0a', textMuted: '#57534e', border: '#991b1b' },
  { id: 'nordic-frost', label: 'Nordic Arctic Cyan', primary: '#0284c7', secondary: '#2563eb', bg: '#f8fafc', card: '#ffffff', text: '#0f172a', textMuted: '#64748b', border: '#0284c7' },
  { id: 'champagne-vintage', label: 'Champagne Vintage Parchment', primary: '#854d0e', secondary: '#a16207', bg: '#faf8f5', card: '#ffffff', text: '#292524', textMuted: '#78716c', border: '#854d0e' },
  { id: 'sunset-topaz', label: 'Sunset Amber Topaz', primary: '#ea580c', secondary: '#c2410c', bg: '#fff7ed', card: '#ffffff', text: '#431407', textMuted: '#78716c', border: '#ea580c' },
  { id: 'rose-elegance', label: 'Rose Quartz Elegance', primary: '#db2777', secondary: '#be185d', bg: '#fdf2f8', card: '#ffffff', text: '#500724', textMuted: '#71717a', border: '#db2777' },
  { id: 'corporate-steel', label: 'Corporate Steel Navy', primary: '#334155', secondary: '#1e3a8a', bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', textMuted: '#475569', border: '#334155' },
  { id: 'botanical-sage', label: 'Botanical Sage Green', primary: '#15803d', secondary: '#166534', bg: '#f6f8f6', card: '#ffffff', text: '#14532d', textMuted: '#52525b', border: '#15803d' },
] as const;

export type CertificateThemeId = typeof THEMES[number]['id'];

export const CertificateStudio: React.FC = () => {
  const {
    templates,
    issuedCertificates,
    pendingApprovals,
    pagination,
    loading,
    issuing,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    issueCertificates,
    fetchIssuedCertificates,
    fetchPendingApprovals,
    approveCertificate,
    approveAllCertificates,
    revokeCertificate,
    revokeAllCertificates,
    downloadCertificatePdf,
    downloadPreviewPdf,
  } = useCertificateStore();

  const { events, fetchEvents } = useEventStore();
  const { domains, fetchDomains } = useDomainStore();
  const { users, fetchUsers } = useUserStore();

  const [activeTab, setActiveTab] = useState<'designer' | 'issue' | 'approvals' | 'ledger'>('designer');

  // Designer Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('new');
  const [title, setTitle] = useState('Certificate of Achievement');
  const [subtitle, setSubtitle] = useState('Proudly Presented To');
  const [description, setDescription] = useState(
    'For exceptional technical competence, sustained dedication, and active participation in advanced club initiatives.'
  );
  const [theme, setTheme] = useState<string>('classic-ivory');
  
  // Three Faculty Members - All Positions Set as Faculty Coordinator
  const [signatoryName, setSignatoryName] = useState('Dr. Dhanasekar R');
  const [signatoryTitle, setSignatoryTitle] = useState('Faculty Coordinator');
  const [signatoryDepartment, setSignatoryDepartment] = useState('Faculty Coordinator · EIE');
  const [secondarySignatoryName, setSecondarySignatoryName] = useState('Dr. Nandhini K M');
  const [secondarySignatoryTitle, setSecondarySignatoryTitle] = useState('Faculty Coordinator');
  const [secondarySignatoryDepartment, setSecondarySignatoryDepartment] = useState('Faculty Coordinator · EIE');
  const [tertiarySignatoryName, setTertiarySignatoryName] = useState('Prof. RATHNA S');
  const [tertiarySignatoryTitle, setTertiarySignatoryTitle] = useState('Faculty Coordinator');
  const [tertiarySignatoryDepartment, setTertiarySignatoryDepartment] = useState('Faculty Coordinator · CSE');
  const [signatoryOrganization, setSignatoryOrganization] = useState('Code Circle · Bannari Amman Institute of Technology');
  
  const [sampleRecipientName, setSampleRecipientName] = useState('RAHUL P');
  const [sampleRollNo, setSampleRollNo] = useState('7376231CS272');
  const [associatedEventId, setAssociatedEventId] = useState('');
  const [associatedDomainId, setAssociatedDomainId] = useState('');

  // Course Approvals State
  const [approvalDomainFilter, setApprovalDomainFilter] = useState('');
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Bulk Revocation Modal State
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [revokeAllReason, setRevokeAllReason] = useState('Bulk revoked by institutional administration');
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Issuance State
  const [issueTemplateId, setIssueTemplateId] = useState('');
  const [targetType, setTargetType] = useState<'EVENT' | 'COURSE' | 'USERS'>('EVENT');
  const [targetId, setTargetId] = useState('');
  const [completedOnly, setCompletedOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Ledger Filter State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchIssuedCertificates();
    fetchPendingApprovals();
    fetchEvents();
    fetchDomains();
  }, []);

  useEffect(()=>{
    const timer = setTimeout(()=> {fetchUsers({search:userSearch})},500);
    return () => clearInterval(timer);
  },[userSearch]);

  const handleSelectTemplate = (tmpl: CertificateTemplate) => {
    setSelectedTemplateId(tmpl._id);
    setTitle(tmpl.title);
    setSubtitle(tmpl.subtitle || 'Proudly Presented To');
    setDescription(tmpl.description || '');
    setTheme(tmpl.theme || 'classic-ivory');
    setSignatoryName(tmpl.signatoryName || 'Dr. Dhanasekar R');
    setSignatoryTitle(tmpl.signatoryTitle || 'Faculty Coordinator');
    setSignatoryDepartment(tmpl.signatoryDepartment || 'Faculty Coordinator · EIE');
    setSecondarySignatoryName(tmpl.secondarySignatoryName || 'Dr. Nandhini K M');
    setSecondarySignatoryTitle(tmpl.secondarySignatoryTitle || 'Faculty Coordinator');
    setSecondarySignatoryDepartment(tmpl.secondarySignatoryDepartment || 'Faculty Coordinator · EIE');
    setTertiarySignatoryName(tmpl.tertiarySignatoryName || 'Prof. RATHNA S');
    setTertiarySignatoryTitle(tmpl.tertiarySignatoryTitle || 'Faculty Coordinator');
    setTertiarySignatoryDepartment(tmpl.tertiarySignatoryDepartment || 'Faculty Coordinator · CSE');
    setSignatoryOrganization(tmpl.signatoryOrganization || 'Code Circle · Bannari Amman Institute of Technology');
    setAssociatedEventId(tmpl.associatedEventId?._id || tmpl.associatedEventId || '');
    setAssociatedDomainId(tmpl.associatedDomainId?._id || tmpl.associatedDomainId || '');
  };

  const handleResetToNew = () => {
    setSelectedTemplateId('new');
    setTitle('Certificate of Technical Excellence');
    setSubtitle('Proudly Presented To');
    setDescription(
      'For exceptional technical competence, sustained dedication, and active participation in advanced club initiatives.'
    );
    setTheme('classic-ivory');
    setSignatoryName('Dr. Dhanasekar R');
    setSignatoryTitle('Faculty Coordinator');
    setSignatoryDepartment('Faculty Coordinator · EIE');
    setSecondarySignatoryName('Dr. Nandhini K M');
    setSecondarySignatoryTitle('Faculty Coordinator');
    setSecondarySignatoryDepartment('Faculty Coordinator · EIE');
    setTertiarySignatoryName('Prof. RATHNA S');
    setTertiarySignatoryTitle('Faculty Coordinator');
    setTertiarySignatoryDepartment('Faculty Coordinator · CSE');
    setSignatoryOrganization('Code Circle · Bannari Amman Institute of Technology');
    setAssociatedEventId('');
    setAssociatedDomainId('');
  };

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    const payload = {
      title,
      subtitle,
      description,
      theme,
      signatoryName,
      signatoryTitle,
      signatoryDepartment,
      secondarySignatoryName,
      secondarySignatoryTitle,
      secondarySignatoryDepartment,
      tertiarySignatoryName,
      tertiarySignatoryTitle,
      tertiarySignatoryDepartment,
      signatoryOrganization,
      associatedEventId: associatedEventId || null,
      associatedDomainId: associatedDomainId || null,
    };

    if (selectedTemplateId === 'new') {
      const ok = await createTemplate(payload as any);
      if (ok) handleResetToNew();
    } else {
      await updateTemplate(selectedTemplateId, payload as any);
    }
  };

  const handleDownloadPreview = () => {
    downloadPreviewPdf({
      title,
      subtitle,
      description,
      theme,
      signatoryName,
      signatoryTitle,
      signatoryDepartment,
      secondarySignatoryName,
      secondarySignatoryTitle,
      secondarySignatoryDepartment,
      tertiarySignatoryName,
      tertiarySignatoryTitle,
      tertiarySignatoryDepartment,
      signatoryOrganization,
      recipientName: sampleRecipientName,
      recipientRollNo: sampleRollNo,
    });
  };

  const handleExecuteIssue = async () => {
    if (!issueTemplateId) {
      toast.error('Please select a certificate template to issue');
      return;
    }

    if ((targetType === 'EVENT' || targetType === 'COURSE') && !targetId) {
      toast.error(`Please select an associated ${targetType === 'EVENT' ? 'Event' : 'Course'}`);
      return;
    }

    if (targetType === 'USERS' && selectedUserIds.length === 0) {
      toast.error('Please select at least one student recipient');
      return;
    }

    const res = await issueCertificates({
      templateId: issueTemplateId,
      targetType,
      targetId: targetId || undefined,
      userIds: targetType === 'USERS' ? selectedUserIds : undefined,
      completedOnly: targetType === 'COURSE' ? completedOnly : undefined,
    });

    if (res.success) {
      setActiveTab('ledger');
    }
  };

  const currentTheme : any = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-2 rounded-2xl border border-separator shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-separator/60 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'designer'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Sliders size={15} />
            <span>Template Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'issue'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Send size={15} />
            <span>Bulk Issuer</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('approvals');
              fetchPendingApprovals(approvalDomainFilter || undefined);
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'approvals'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Course Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-mono font-bold animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <FileCheck size={15} />
            <span>Registry & Ledger</span>
            {issuedCertificates.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full font-mono">
                {issuedCertificates.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeTab === 'designer' && (
            <button
              onClick={handleResetToNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>New Template</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: DESIGNER & LIVE CANVAS --- */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Template Preset Selector */}
            <div className="bg-surface p-5 rounded-2xl border border-separator space-y-3">
              <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                Saved Templates ({templates.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                <button
                  onClick={handleResetToNew}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTemplateId === 'new'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-raised border-separator text-label-secondary hover:border-primary/40'
                  }`}
                >
                  + Create New
                </button>
                {templates.map((tmpl) => (
                  <button
                    key={tmpl._id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all truncate max-w-50 ${
                      selectedTemplateId === tmpl._id
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-raised border-separator text-label-secondary hover:border-primary/40'
                    }`}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Form Inputs */}
            <div className="bg-surface p-6 rounded-2xl border border-separator space-y-4">
              <h3 className="text-sm font-bold text-label-primary flex items-center gap-2">
                <Award size={16} className="text-primary" />
                <span>Certificate Parameters</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-label-secondary">Certificate Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Certificate of Appreciation"
                  className="w-full px-3.5 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-label-secondary">Subtitle / Salutation</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Proudly Presented To"
                  className="w-full px-3.5 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-label-secondary">Description Body</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary transition-all font-medium resize-none"
                />
              </div>

              {/* Theme Palette Chooser - 15 Light Themes */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                    Light Theme Collection ({THEMES.length} Themes)
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    100% Light Print-Ready
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                          : 'border-separator bg-surface-raised hover:border-separator-focus'
                      }`}
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ background: t.primary }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ background: t.secondary }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-label-primary truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Three Faculty Members Configuration - All Positioned as Faculty Coordinator */}
              <div className="space-y-3 pt-2 border-t border-separator/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={15} className="text-primary" />
                    <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                      Faculty Coordinators (3 Members)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    Position: Faculty Coordinator
                  </span>
                </div>

                {/* Faculty 1: Coordinator */}
                <div className="bg-surface-raised p-3 rounded-xl border border-separator/80 space-y-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                    <span>1. Faculty Coordinator</span>
                    <span className="text-label-tertiary font-normal">Coordinator 1</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="Name (e.g. Dr. Dhanasekar R)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary font-medium"
                    />
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      placeholder="Title (Faculty Coordinator)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={signatoryDepartment}
                      onChange={(e) => setSignatoryDepartment(e.target.value)}
                      placeholder="Department (Faculty Coordinator · EIE)"
                      className="col-span-2 w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-secondary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Faculty 2: Coordinator */}
                <div className="bg-surface-raised p-3 rounded-xl border border-separator/80 space-y-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                    <span>2. Faculty Coordinator</span>
                    <span className="text-label-tertiary font-normal">Coordinator 2</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={secondarySignatoryName}
                      onChange={(e) => setSecondarySignatoryName(e.target.value)}
                      placeholder="Name (e.g. Dr. Nandhini K M)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary font-medium"
                    />
                    <input
                      type="text"
                      value={secondarySignatoryTitle}
                      onChange={(e) => setSecondarySignatoryTitle(e.target.value)}
                      placeholder="Title (Faculty Coordinator)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={secondarySignatoryDepartment}
                      onChange={(e) => setSecondarySignatoryDepartment(e.target.value)}
                      placeholder="Department (Faculty Coordinator · EIE)"
                      className="col-span-2 w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-secondary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Faculty 3: Coordinator */}
                <div className="bg-surface-raised p-3 rounded-xl border border-separator/80 space-y-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                    <span>3. Faculty Coordinator</span>
                    <span className="text-label-tertiary font-normal">Coordinator 3</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tertiarySignatoryName}
                      onChange={(e) => setTertiarySignatoryName(e.target.value)}
                      placeholder="Name (e.g. Prof. RATHNA S)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary font-medium"
                    />
                    <input
                      type="text"
                      value={tertiarySignatoryTitle}
                      onChange={(e) => setTertiarySignatoryTitle(e.target.value)}
                      placeholder="Title (Faculty Coordinator)"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={tertiarySignatoryDepartment}
                      onChange={(e) => setTertiarySignatoryDepartment(e.target.value)}
                      placeholder="Department (Faculty Coordinator · CSE)"
                      className="col-span-2 w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-secondary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  className="flex-1 min-w-[140px] py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  <span>{selectedTemplateId === 'new' ? 'Save New Template' : 'Update Template'}</span>
                </button>
                <button
                  onClick={handleDownloadPreview}
                  disabled={loading}
                  className="py-2.5 px-3 bg-surface-raised hover:bg-surface-raised/80 text-label-primary border border-separator font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Download vector PDF preview"
                >
                  <Download size={14} className="text-primary" />
                  <span>Download Preview</span>
                </button>
                {selectedTemplateId !== 'new' && (
                  <button
                    onClick={() => deleteTemplate(selectedTemplateId)}
                    className="p-2.5 text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-xl transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Live Canvas Column */}
          <div className="lg:col-span-7 space-y-4 sticky top-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                <span className="text-xs font-bold text-label-primary uppercase tracking-wider">
                  Live Visual Render
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-surface-raised border border-separator rounded-md text-label-tertiary">
                  A4 Landscape
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sampleRecipientName}
                  onChange={(e) => setSampleRecipientName(e.target.value)}
                  placeholder="Sample Name"
                  className="w-28 sm:w-32 px-2.5 py-1 text-xs bg-surface border border-separator rounded-lg text-label-primary font-medium"
                />
                <button
                  onClick={handleDownloadPreview}
                  disabled={loading}
                  className="py-1 px-3 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
                  title="Download official PDF preview"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Download Preview PDF</span>
                  <span className="sm:hidden">Preview PDF</span>
                </button>
              </div>
            </div>

            {/* Visual Canvas Card */}
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <div
                className="min-w-[560px] sm:min-w-0 w-full aspect-[1.414/1] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 select-none border"
                style={{
                  backgroundColor: currentTheme.bg,
                  borderColor: currentTheme.primary + '55',
                  color: currentTheme.text,
                }}
              >
              {/* Decorative Corner Ornaments */}
              <div
                className="absolute inset-3 sm:inset-5 border rounded-xl pointer-events-none"
                style={{ borderColor: currentTheme.primary + '35' }}
              />
              <div
                className="absolute inset-4 sm:inset-6 border rounded-lg pointer-events-none opacity-50"
                style={{ borderColor: currentTheme.primary + '18' }}
              />

              {/* Ambient Glows */}
              <div
                className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: currentTheme.primary }}
              />
              <div
                className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: currentTheme.secondary }}
              />

              {/* Header with Club Logo */}
              <div className="text-center relative z-10 pt-1">
                <img
                  src="/codecirclelogo.jpeg"
                  alt="Code Circle Logo"
                  className="w-11 h-11 sm:w-13 sm:h-13 mx-auto mb-1.5 rounded-full border-2 border-black/10 shadow-sm object-cover bg-black/5"
                />
                <p
                  className="text-[9px] sm:text-[10px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: currentTheme.primary }}
                >
                  {signatoryOrganization}
                </p>
                <h2
                  className="text-base sm:text-xl font-black tracking-tight mt-0.5 uppercase"
                  style={{ color: currentTheme.text }}
                >
                  {title || 'Certificate Title'}
                </h2>
                <p
                  className="text-[9px] sm:text-[11px] opacity-75 tracking-widest uppercase mt-0.5"
                  style={{ color: currentTheme.text }}
                >
                  {subtitle}
                </p>
                <div
                  className="w-16 h-0.5 mx-auto my-1.5 rounded-full"
                  style={{ backgroundColor: currentTheme.secondary || currentTheme.primary }}
                />
              </div>

              {/* Recipient Spotlight */}
              <div className="text-center my-auto relative z-10 py-1">
                <h1
                  className="text-xl sm:text-3xl font-extrabold tracking-tight uppercase"
                  style={{ color: currentTheme.primary }}
                >
                  {sampleRecipientName}
                </h1>
                {sampleRollNo && (
                  <p
                    className="text-[9px] sm:text-[11px] font-mono opacity-65 mt-0.5 font-semibold"
                    style={{ color: currentTheme.text }}
                  >
                    Roll No: {sampleRollNo}
                  </p>
                )}
                <p
                  className="text-[9px] sm:text-[11px] opacity-80 max-w-md mx-auto mt-1.5 leading-relaxed px-4 line-clamp-2"
                  style={{ color: currentTheme.text }}
                >
                  {description}
                </p>
              </div>

              {/* Footer: Official Seal & Three Faculty Signatories */}
              <div
                className="space-y-2 relative z-10 pt-2 border-t"
                style={{ borderColor: currentTheme.primary + '20' }}
              >
                {/* Mid Verification Strip */}
                <div
                  className="flex items-center justify-between px-2 text-[7px] sm:text-[9px] font-mono opacity-70"
                  style={{ color: currentTheme.text }}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} style={{ color: currentTheme.primary }} />
                    <span className="font-bold tracking-wider uppercase">Verified Institutional Credential</span>
                  </div>
                  <div>ID: CC-CERT-SAMPLE · DATE: {new Date().toLocaleDateString()}</div>
                </div>

                {/* Three Faculty Signatures Side by Side - All Faculty Coordinators */}
                <div
                  className="grid grid-cols-3 gap-2 pt-1 border-t text-center"
                  style={{ borderColor: currentTheme.primary + '20' }}
                >
                  <div>
                    <div
                      className="w-16 sm:w-24 h-0.5 mx-auto mb-1"
                      style={{ backgroundColor: currentTheme.primary + '55' }}
                    />
                    <p
                      className="text-[8px] sm:text-[10px] font-bold truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {signatoryName || 'Dr. Dhanasekar R'}
                    </p>
                    <p
                      className="text-[7px] sm:text-[8px] font-semibold opacity-90 truncate"
                      style={{ color: currentTheme.primary }}
                    >
                      {signatoryTitle || 'Faculty Coordinator'}
                    </p>
                    <p
                      className="text-[6px] sm:text-[7px] opacity-60 truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {signatoryDepartment || 'Faculty Coordinator · EIE'}
                    </p>
                  </div>

                  <div>
                    <div
                      className="w-16 sm:w-24 h-0.5 mx-auto mb-1"
                      style={{ backgroundColor: currentTheme.primary + '55' }}
                    />
                    <p
                      className="text-[8px] sm:text-[10px] font-bold truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {secondarySignatoryName || 'Dr. Nandhini K M'}
                    </p>
                    <p
                      className="text-[7px] sm:text-[8px] font-semibold opacity-90 truncate"
                      style={{ color: currentTheme.primary }}
                    >
                      {secondarySignatoryTitle || 'Faculty Coordinator'}
                    </p>
                    <p
                      className="text-[6px] sm:text-[7px] opacity-60 truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {secondarySignatoryDepartment || 'Faculty Coordinator · EIE'}
                    </p>
                  </div>

                  <div>
                    <div
                      className="w-16 sm:w-24 h-0.5 mx-auto mb-1"
                      style={{ backgroundColor: currentTheme.primary + '55' }}
                    />
                    <p
                      className="text-[8px] sm:text-[10px] font-bold truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {tertiarySignatoryName || 'Prof. RATHNA S'}
                    </p>
                    <p
                      className="text-[7px] sm:text-[8px] font-semibold opacity-90 truncate"
                      style={{ color: currentTheme.primary }}
                    >
                      {tertiarySignatoryTitle || 'Faculty Coordinator'}
                    </p>
                    <p
                      className="text-[6px] sm:text-[7px] opacity-60 truncate"
                      style={{ color: currentTheme.text }}
                    >
                      {tertiarySignatoryDepartment || 'Faculty Coordinator · CSE'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: BULK ISSUER --- */}
      {activeTab === 'issue' && (
        <div className="max-w-3xl mx-auto bg-surface p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-separator shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-label-primary flex items-center gap-2">
              <Send size={20} className="text-primary" />
              <span>Bulk Certificate Issuance Studio</span>
            </h2>
            <p className="text-xs text-label-tertiary mt-1">
              Issue high-resolution cryptographic certificates to event participants, domain course completers, or targeted students.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1: Template Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                1. Select Certificate Template
              </label>
              <HeroUISelect
                value={issueTemplateId}
                onChange={setIssueTemplateId}
                placeholder="-- Choose a template --"
                options={templates.map((t) => ({
                  value: t._id,
                  label: `${t.title} (${t.theme})`,
                }))}
                size="sm"
                isSearchable
              />
            </div>

            {/* Step 2: Target Audience Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                2. Target Recipient Source
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetType('EVENT')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'EVENT'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-separator bg-surface-raised text-label-secondary hover:border-primary/40'
                  }`}
                >
                  <Calendar size={18} className="mx-auto mb-1" />
                  <span className="text-xs">Event Attendees</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('COURSE')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'COURSE'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-separator bg-surface-raised text-label-secondary hover:border-primary/40'
                  }`}
                >
                  <Layers size={18} className="mx-auto mb-1" />
                  <span className="text-xs">Course Completers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('USERS')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'USERS'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-separator bg-surface-raised text-label-secondary hover:border-primary/40'
                  }`}
                >
                  <Users size={18} className="mx-auto mb-1" />
                  <span className="text-xs">Custom Students</span>
                </button>
              </div>
            </div>

            {/* Target Selector by Event or Course */}
            {targetType === 'EVENT' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-xs font-medium text-label-secondary">Choose Event</label>
                <HeroUISelect
                  value={targetId}
                  onChange={setTargetId}
                  placeholder="-- Select Event --"
                  options={events.map((ev: { _id: any; title: any; date: string | number | Date; }) => ({
                    value: ev._id,
                    label: `${ev.title} (${new Date(ev.date).toLocaleDateString()})`,
                  }))}
                  size="sm"
                  isSearchable
                />
              </div>
            )}

            {targetType === 'COURSE' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-label-secondary">Choose Domain Course</label>
                  <HeroUISelect
                    value={targetId}
                    onChange={setTargetId}
                    placeholder="-- Select Domain Course --"
                    options={domains.map((d) => ({
                      value: d._id,
                      label: `${d.name} (${d.levelsCount || d.levels?.length || 0} levels)`,
                    }))}
                    size="sm"
                    isSearchable
                  />
                </div>

                {/* Course Completion Condition */}
                <div className="flex items-center justify-between p-3 bg-surface-raised border border-separator/80 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-label-primary">Target Completed Students Only</p>
                    <p className="text-[10px] text-label-tertiary">
                      Only issue certificates to students whose course status is marked as 'completed'
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={completedOnly}
                      onChange={(e) => setCompletedOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-separator peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black/10 dark:after:border-white/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Target Selector by Users Directory */}
            {targetType === 'USERS' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-medium text-label-secondary">
                  Select Students ({selectedUserIds.length} chosen)
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by student name, roll number, or email..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-separator rounded-xl p-2 bg-surface-raised space-y-1">
                  {users
                    .filter(
                      (u) =>
                        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.rollNo?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .slice(0, 30)
                    .map((u) => {
                      const isSelected = selectedUserIds.includes(u._id);
                      return (
                        <button
                          type="button"
                          key={u._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== u._id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, u._id]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface text-label-primary'
                          }`}
                        >
                          <div>
                            <p>{u.name}</p>
                            <p className="text-[10px] text-label-tertiary">
                              {u.rollNo || u.studentId || u.email}
                            </p>
                          </div>
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-primary text-white border-primary' : 'border-separator'
                            }`}
                          >
                            {isSelected ? <Check size={10} strokeWidth={2.5} /> : null}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-separator">
            <button
              onClick={handleExecuteIssue}
              disabled={issuing}
              className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {issuing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              <span>{issuing ? 'Generating & Issuing Credentials...' : 'Issue Verified Certificates'}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 3: COURSE COMPLETION APPROVALS --- */}
      {activeTab === 'approvals' && (
        <div className="bg-surface rounded-2xl border border-separator shadow-sm overflow-hidden space-y-4 p-4 sm:p-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <span>Course Completion Certificate Approvals</span>
              </h3>
              <p className="text-xs text-label-tertiary mt-0.5">
                Students who have successfully cleared 100% of curriculum levels must receive administrative approval before their verifiable credentials are released.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <HeroUISelect
                value={approvalDomainFilter}
                onChange={(val) => {
                  setApprovalDomainFilter(val);
                  fetchPendingApprovals(val || undefined);
                }}
                options={[
                  { value: '', label: 'All Courses' },
                  ...domains.map((d) => ({ value: d._id, label: d.name })),
                ]}
                placeholder="Filter Course..."
                size="sm"
                className="w-full sm:w-48 shrink-0"
              />

              <button
                onClick={async () => {
                  if (pendingApprovals.length === 0) return;
                  if (!confirm(`Are you sure you want to approve all ${pendingApprovals.length} pending course certificates?`)) return;
                  setIsApprovingAll(true);
                  try {
                    await approveAllCertificates(approvalDomainFilter || undefined);
                  } finally {
                    setIsApprovingAll(false);
                  }
                }}
                disabled={pendingApprovals.length === 0 || isApprovingAll}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                {isApprovingAll ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Check size={14} strokeWidth={2.5} />
                )}
                <span>Approve All ({pendingApprovals.length})</span>
              </button>
            </div>
          </div>

          {/* Pending Table */}
          <div className="overflow-x-auto border border-separator rounded-xl custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-surface-raised border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course Cleared</th>
                  <th className="py-3 px-4">Temp Certificate ID</th>
                  <th className="py-3 px-4">Requested On</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator text-label-primary font-medium">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="font-bold text-label-primary">All Caught Up!</p>
                      <p className="text-xs text-label-tertiary">
                        No pending course certificates are currently awaiting administrative review.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((cert) => (
                    <tr key={cert._id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-label-primary">{cert.recipientName}</p>
                        <p className="text-[10px] text-label-tertiary font-mono">
                          {cert.recipientRollNo || cert.recipientEmail}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          <span>{cert.associatedDomainId?.name || cert.title}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-label-secondary text-[11px]">
                        {cert.certificateId}
                      </td>
                      <td className="py-3 px-4 text-label-secondary">
                        {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Awaiting Approval
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={async () => {
                            setApprovingId(cert._id);
                            try {
                              await approveCertificate(cert._id);
                            } finally {
                              setApprovingId(null);
                            }
                          }}
                          disabled={approvingId === cert._id}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5"
                          title="Approve and release certificate to student"
                        >
                          {approvingId === cert._id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} strokeWidth={2.5} />
                          )}
                          <span>Approve & Release</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: REGISTRY & LEDGER --- */}
      {activeTab === 'ledger' && (
        <div className="bg-surface rounded-2xl border border-separator shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
                <FileCheck size={18} className="text-primary" />
                <span>Certificate Registry & Audit Ledger</span>
              </h3>
              <p className="text-xs text-label-tertiary mt-0.5">
                Complete record of all verified credentials issued through the Code Circle platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    fetchIssuedCertificates({ search: e.target.value, status: statusFilter });
                  }}
                  placeholder="Search recipient or ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary w-full sm:w-48"
                />
              </div>

              <HeroUISelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  fetchIssuedCertificates({ search: ledgerSearch, status: val });
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
                  { value: 'REVOKED', label: 'Revoked' },
                ]}
                size="sm"
                className="w-full sm:w-36 shrink-0"
                placement="bottom-end"
              />

              <button
                onClick={() => setShowRevokeAllModal(true)}
                className="py-1.5 px-3 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
                title="Revoke all active/pending certificates"
              >
                <AlertTriangle size={13} />
                <span>Revoke All</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-separator rounded-xl custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-surface-raised border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator text-label-primary font-medium">
                {issuedCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-label-tertiary">
                      No issued certificates recorded yet. Use the Bulk Issuer tab to generate credentials.
                    </td>
                  </tr>
                ) : (
                  issuedCertificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {cert.certificateId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold">{cert.recipientName}</p>
                        <p className="text-[10px] text-label-tertiary">{cert.recipientRollNo || cert.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-4 truncate max-w-[180px]">{cert.title}</td>
                      <td className="py-3 px-4 text-label-secondary">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            cert.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : cert.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {cert.status === 'ACTIVE' && (
                          <button
                            onClick={() => downloadCertificatePdf(cert._id, cert.certificateId)}
                            className="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/verify/${cert.verificationCode}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Public verification link copied!');
                          }}
                          className="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:bg-surface-raised text-label-secondary rounded-lg transition-colors cursor-pointer"
                          title="Copy Verification Link"
                        >
                          <Copy size={15} />
                        </button>
                        {cert.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter revocation reason (optional):');
                              if (reason !== null) revokeCertificate(cert._id, reason || undefined);
                            }}
                            className="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Revoke Certificate"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revoke All Confirmation Modal */}
      {showRevokeAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-destructive/30 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-label-primary">Revoke All Certificates?</h4>
                <p className="text-xs text-label-tertiary">Institutional bulk revocation protocol</p>
              </div>
            </div>

            <p className="text-xs text-label-secondary leading-relaxed">
              This action will permanently invalidate all currently active and pending certificates across the institution. Public verification will display them as REVOKED.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-label-secondary">Revocation Reason</label>
              <input
                type="text"
                value={revokeAllReason}
                onChange={(e) => setRevokeAllReason(e.target.value)}
                placeholder="Reason for bulk revocation..."
                className="w-full px-3 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-destructive"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
              <button
                type="button"
                onClick={() => setShowRevokeAllModal(false)}
                disabled={isRevokingAll}
                className="px-4 py-2 text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface-raised rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsRevokingAll(true);
                  try {
                    await revokeAllCertificates(revokeAllReason);
                    setShowRevokeAllModal(false);
                  } finally {
                    setIsRevokingAll(false);
                  }
                }}
                disabled={isRevokingAll}
                className="px-4 py-2 text-xs font-bold bg-destructive text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-destructive/20"
              >
                {isRevokingAll && <RefreshCw size={13} className="animate-spin" />}
                <span>Confirm Revoke All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateStudio;
