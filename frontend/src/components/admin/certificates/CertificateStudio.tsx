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

const THEMES = [
  { id: 'modern-blue', label: 'Modern Blue', primary: '#38bdf8', bg: '#0b1120', text: '#f8fafc' },
  { id: 'executive-gold', label: 'Executive Gold', primary: '#fbbf24', bg: '#18181b', text: '#fffbeb' },
  { id: 'cyber-dark', label: 'Cyber Dark', primary: '#34d399', bg: '#050505', text: '#ffffff' },
  { id: 'emerald-minimal', label: 'Emerald Minimal', primary: '#047857', bg: '#ffffff', text: '#0f172a' },
  { id: 'ruby-elegance', label: 'Ruby Elegance', primary: '#fb7185', bg: '#1c1917', text: '#fff1f2' },
] as const;

export const CertificateStudio: React.FC = () => {
  const {
    templates,
    issuedCertificates,
    pagination,
    loading,
    issuing,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    issueCertificates,
    fetchIssuedCertificates,
    revokeCertificate,
    downloadCertificatePdf,
  } = useCertificateStore();

  const { events, fetchEvents } = useEventStore();
  const { domains, fetchDomains } = useDomainStore();
  const { users, fetchUsers } = useUserStore();

  const [activeTab, setActiveTab] = useState<'designer' | 'issue' | 'ledger'>('designer');

  // Designer Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('new');
  const [title, setTitle] = useState('Certificate of Achievement');
  const [subtitle, setSubtitle] = useState('Proudly Presented To');
  const [description, setDescription] = useState(
    'For exceptional technical competence, sustained dedication, and active participation in advanced club initiatives.'
  );
  const [theme, setTheme] = useState<'modern-blue' | 'executive-gold' | 'cyber-dark' | 'emerald-minimal' | 'ruby-elegance'>('modern-blue');
  const [signatoryName, setSignatoryName] = useState('Dr. S. K. Ramesh');
  const [signatoryTitle, setSignatoryTitle] = useState('Faculty Coordinator & Club Advisor');
  const [signatoryOrganization, setSignatoryOrganization] = useState('Code Circle · Bannari Amman Institute of Technology');
  const [sampleRecipientName, setSampleRecipientName] = useState('Alex Rivera');
  const [sampleRollNo, setSampleRollNo] = useState('7376222CB101');
  const [associatedEventId, setAssociatedEventId] = useState('');
  const [associatedDomainId, setAssociatedDomainId] = useState('');

  // Issuance State
  const [issueTemplateId, setIssueTemplateId] = useState('');
  const [targetType, setTargetType] = useState<'EVENT' | 'COURSE' | 'USERS'>('EVENT');
  const [targetId, setTargetId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Ledger Filter State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchIssuedCertificates();
    fetchEvents();
    fetchDomains();
    fetchUsers();
  }, []);

  const handleSelectTemplate = (tmpl: CertificateTemplate) => {
    setSelectedTemplateId(tmpl._id);
    setTitle(tmpl.title);
    setSubtitle(tmpl.subtitle || 'Proudly Presented To');
    setDescription(tmpl.description || '');
    setTheme(tmpl.theme || 'modern-blue');
    setSignatoryName(tmpl.signatoryName || 'Dr. S. K. Ramesh');
    setSignatoryTitle(tmpl.signatoryTitle || 'Faculty Coordinator & Club Advisor');
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
    setTheme('modern-blue');
    setSignatoryName('Dr. S. K. Ramesh');
    setSignatoryTitle('Faculty Coordinator & Club Advisor');
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
    });

    if (res.success) {
      setActiveTab('ledger');
    }
  };

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-2 rounded-2xl border border-separator shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-separator/60">
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'issue'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Send size={15} />
            <span>Bulk Issuer</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
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

        <div className="flex items-center gap-2">
          {activeTab === 'designer' && (
            <button
              onClick={handleResetToNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all truncate max-w-[200px] ${
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

              {/* Theme Palette Chooser */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-label-secondary">Theme & Aesthetics</label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-separator bg-surface-raised hover:border-separator-focus'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner"
                        style={{ background: t.primary }}
                      />
                      <span className="text-xs font-semibold text-label-primary truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Signatory Configuration */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-label-secondary">Signatory Name</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-label-secondary">Signatory Title</label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  <span>{selectedTemplateId === 'new' ? 'Save New Template' : 'Update Template'}</span>
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
            <div className="flex items-center justify-between">
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
                  className="w-32 px-2.5 py-1 text-xs bg-surface border border-separator rounded-lg text-label-primary font-medium"
                />
              </div>
            </div>

            {/* Visual Canvas Card */}
            <div
              className="w-full aspect-[1.414/1] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 select-none border"
              style={{
                backgroundColor: currentTheme.bg,
                borderColor: currentTheme.primary + '55',
                color: currentTheme.text,
              }}
            >
              {/* Decorative Corner Ornaments */}
              <div
                className="absolute inset-3 sm:inset-5 border rounded-xl pointer-events-none"
                style={{ borderColor: currentTheme.primary + '44' }}
              />
              <div
                className="absolute inset-4 sm:inset-6 border rounded-lg pointer-events-none opacity-50"
                style={{ borderColor: currentTheme.primary + '22' }}
              />

              {/* Ambient Glows */}
              <div
                className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: currentTheme.primary }}
              />
              <div
                className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: currentTheme.primary }}
              />

              {/* Header */}
              <div className="text-center relative z-10 pt-2">
                <p
                  className="text-[9px] sm:text-[11px] font-bold tracking-[0.25em] uppercase"
                  style={{ color: currentTheme.primary }}
                >
                  {signatoryOrganization}
                </p>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight mt-1 uppercase">
                  {title || 'Certificate Title'}
                </h2>
                <p className="text-[10px] sm:text-xs opacity-70 tracking-widest uppercase mt-0.5">
                  {subtitle}
                </p>
                <div
                  className="w-16 h-0.5 mx-auto my-2 rounded-full"
                  style={{ backgroundColor: currentTheme.primary }}
                />
              </div>

              {/* Recipient Spotlight */}
              <div className="text-center my-auto relative z-10 py-2">
                <h1
                  className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase"
                  style={{ color: currentTheme.primary }}
                >
                  {sampleRecipientName}
                </h1>
                {sampleRollNo && (
                  <p className="text-[10px] sm:text-xs font-mono opacity-60 mt-0.5">
                    Roll No: {sampleRollNo}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs opacity-75 max-w-md mx-auto mt-2 leading-relaxed px-4 line-clamp-3">
                  {description}
                </p>
              </div>

              {/* Footer Meta & Signatures */}
              <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
                {/* Official Seal */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex flex-col items-center justify-center shrink-0 shadow-md"
                    style={{ borderColor: currentTheme.primary }}
                  >
                    <ShieldCheck size={16} style={{ color: currentTheme.primary }} />
                    <span className="text-[6px] font-black tracking-tighter uppercase mt-0.5">
                      Verified
                    </span>
                  </div>
                  <div className="hidden sm:block text-[8px] font-mono opacity-60 leading-tight">
                    <p>ID: CC-CERT-SAMPLE</p>
                    <p>DATE: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Signatory Signature Block */}
                <div className="text-right">
                  <div className="w-28 sm:w-36 h-0.5 bg-white/30 ml-auto mb-1" />
                  <p className="text-[10px] sm:text-xs font-bold">{signatoryName}</p>
                  <p className="text-[8px] sm:text-[9px] opacity-70">{signatoryTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: BULK ISSUER --- */}
      {activeTab === 'issue' && (
        <div className="max-w-3xl mx-auto bg-surface p-8 rounded-3xl border border-separator shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-label-primary flex items-center gap-2">
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
              <select
                value={issueTemplateId}
                onChange={(e) => setIssueTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary font-medium"
              >
                <option value="">-- Choose a template --</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.theme})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Target Audience Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                2. Target Recipient Source
              </label>
              <div className="grid grid-cols-3 gap-3">
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
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Event --</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title} ({new Date(ev.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'COURSE' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-xs font-medium text-label-secondary">Choose Domain Course</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Domain Course --</option>
                  {domains.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                        <div
                          key={u._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== u._id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, u._id]);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
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
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-primary text-white border-primary' : 'border-separator'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
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

      {/* --- TAB 3: REGISTRY & LEDGER --- */}
      {activeTab === 'ledger' && (
        <div className="bg-surface rounded-2xl border border-separator shadow-sm overflow-hidden space-y-4 p-6">
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

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    fetchIssuedCertificates({ search: e.target.value, status: statusFilter });
                  }}
                  placeholder="Search recipient or ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchIssuedCertificates({ search: ledgerSearch, status: e.target.value });
                }}
                className="px-3 py-1.5 text-xs bg-surface-raised border border-separator rounded-xl text-label-primary focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-separator rounded-xl">
            <table className="w-full text-left text-xs">
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
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => downloadCertificatePdf(cert._id, cert.certificateId)}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/verify/${cert.verificationCode}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Public verification link copied!');
                          }}
                          className="p-1.5 hover:bg-surface-raised text-label-secondary rounded-lg transition-colors"
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
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
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
    </div>
  );
};

export default CertificateStudio;
