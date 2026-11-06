import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  FileText,
  Printer,
  Save,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Calendar,
  Building,
  Layers,
  Sparkles,
  Info,
  Eye,
  Columns2,
  FileEdit,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Textarea, HeroUISelect } from '../../ui/HeroUIComponents';
import { EmilCard, EmilButton } from '../../ui/emil-ui';
import OfficialReportTemplate, { ReportData } from './OfficialReportTemplate';
import api from '../../../lib/axios';

// ══════════════════════════════════════════════════════════════
// REUSABLE DRAG & DROP EVIDENCE UPLOADER
// ══════════════════════════════════════════════════════════════
interface EvidenceDropzoneProps {
  label: string;
  description: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}

const EvidenceDropzone: React.FC<EvidenceDropzoneProps> = ({
  label,
  description,
  urls,
  onChange,
  multiple = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileList = Array.from(files);
      const validFiles = fileList.filter((file) => file.type.startsWith('image/'));

      if (validFiles.length === 0) {
        toast.error('Please upload valid image files (PNG, JPG, WEBP)');
        return;
      }

      const readers = validFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers)
        .then((newBase64s) => {
          if (multiple) {
            onChange([...urls, ...newBase64s]);
          } else {
            onChange([newBase64s[0]]);
          }
          toast.success(`${newBase64s.length} image(s) processed for ${label}`);
        })
        .catch((err) => {
          console.error('File conversion error:', err);
          toast.error('Failed to read image file');
        });
    },
    [label, multiple, onChange, urls]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (indexToRemove: number) => {
    onChange(urls.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-label-primary">{label}</h4>
          <p className="text-[11px] text-label-secondary">{description}</p>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface-secondary text-label-secondary">
          {urls.length} Attached
        </span>
      </div>

      {/* Drop Target Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.005]'
            : 'border-separator hover:border-primary/50 hover:bg-surface-secondary/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = ''; // Reset input
          }}
        />

        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1.5 pointer-events-none">
          <UploadCloud size={18} />
        </div>
        <p className="text-xs font-semibold text-label-primary pointer-events-none">
          Drop files here, or <span className="text-primary underline">browse</span>
        </p>
        <p className="text-[10px] text-label-tertiary pointer-events-none mt-0.5">
          PNG, JPG, JPEG or WEBP (Saved directly to report)
        </p>
      </div>

      {/* Previews Grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
          {urls.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-video rounded-lg overflow-hidden border border-separator bg-surface-secondary flex items-center justify-center"
            >
              <img
                src={url}
                alt={`${label} Preview ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/75 hover:bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer shadow-sm"
                title="Remove photo"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// LIVE PDF PREVIEW CANVAS SUBCOMPONENT
// ══════════════════════════════════════════════════════════════
interface LivePdfPreviewProps {
  data: ReportData;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPrint: () => void;
  isCompact?: boolean;
}

const LivePdfPreview: React.FC<LivePdfPreviewProps> = ({
  data,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrint,
  isCompact = false,
}) => {
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Preview Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface rounded-2xl border border-separator shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <div>
            <h4 className="text-xs font-bold text-label-primary leading-tight">
              Official BIT Document &bull; Live Preview
            </h4>
            <p className="text-[10px] text-label-secondary font-mono">
              A4 Portrait &bull; 210mm &times; 297mm &bull; Bannari Amman Institute of Technology
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-surface-secondary rounded-xl p-1 border border-separator">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 text-label-secondary hover:text-label-primary rounded-lg hover:bg-surface transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono px-2 font-semibold text-label-primary">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 text-label-secondary hover:text-label-primary rounded-lg hover:bg-surface transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={onResetZoom}
              className="p-1 text-label-secondary hover:text-label-primary rounded-lg hover:bg-surface transition-colors cursor-pointer border-l border-separator pl-1.5 ml-0.5"
              title="Reset Zoom (100%)"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          <EmilButton
            type="button"
            variant="solid"
            size="sm"
            whileTap={{ scale: 0.97 }}
            onClick={onPrint}
            className="gap-1.5 cursor-pointer text-xs bg-primary text-white shadow-xs"
          >
            <Printer size={13} />
            <span>Print / Save PDF</span>
          </EmilButton>
        </div>
      </div>

      {/* Realistic Paper Stage Canvas */}
      <div className={`relative w-full overflow-auto bg-neutral-200/70 dark:bg-neutral-900/80 p-4 sm:p-8 rounded-2xl border border-separator shadow-inner flex justify-center ${isCompact ? 'min-h-[500px] max-h-[800px]' : 'min-h-[700px] max-h-[85vh]'}`}>
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: '210mm',
          }}
          className="shadow-[0_20px_50px_rgba(0,0,0,0.22)] ring-1 ring-black/15 bg-white text-black transition-transform duration-150 flex-shrink-0 mb-8"
        >
          <OfficialReportTemplate data={data} />
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN FORM COMPONENT: EventReportForm
// ══════════════════════════════════════════════════════════════
export interface EventReportFormProps {
  eventId?: string;
  eventsList?: any[];
  initialData?: Partial<ReportData>;
  onSuccess?: (report: any) => void;
}

export const EventReportForm: React.FC<EventReportFormProps> = ({
  eventId,
  eventsList = [],
  initialData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  // View Mode: 'edit' | 'split' | 'preview'
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [previewZoom, setPreviewZoom] = useState<number>(95);

  // Hidden print reference for react-to-print
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Report Form State
  const [formData, setFormData] = useState<ReportData>({
    eventId: eventId || '',
    clubName: initialData?.clubName || 'Code Circle',
    eventCategory: initialData?.eventCategory || 'Technical Workshop & Coding Challenge',
    academicYear: initialData?.academicYear || '2025-2026',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    venue: initialData?.venue || 'Computing Laboratory 4, BIT Main Campus',
    // Core Text
    objective: initialData?.objective || '',
    outcome: initialData?.outcome || '',
    // Detailed Summary
    eventOverview: initialData?.eventOverview || '',
    strategiesUsed: Array.isArray(initialData?.strategiesUsed)
      ? initialData?.strategiesUsed.join('\n')
      : initialData?.strategiesUsed || '',
    activitiesDone: Array.isArray(initialData?.activitiesDone)
      ? initialData?.activitiesDone.join('\n')
      : initialData?.activitiesDone || '',
    accomplishments: Array.isArray(initialData?.accomplishments)
      ? initialData?.accomplishments.join('\n')
      : initialData?.accomplishments || '',
    takeaways: Array.isArray(initialData?.takeaways)
      ? initialData?.takeaways.join('\n')
      : initialData?.takeaways || '',
    // Evidence (5 required zones)
    circularUrl: initialData?.circularUrl || [],
    brochureUrl: initialData?.brochureUrl || [],
    geoPhotoUrl: initialData?.geoPhotoUrl || [],
    feedbackUrl: initialData?.feedbackUrl || [],
    billSettlementUrl: initialData?.billSettlementUrl || [],
  });

  // Client-Side PDF Generation Handler
  const handlePrint = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: `${formData.clubName.replace(/\s+/g, '_')}_Official_Event_Report_${formData.academicYear}`,
  });

  // Update eventId when prop changes
  useEffect(() => {
    if (eventId) {
      setFormData((prev) => ({ ...prev, eventId }));
    }
  }, [eventId]);

  // Fetch pre-existing report or event details if eventId is provided
  useEffect(() => {
    if (!eventId) return;

    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        // First try to fetch existing report
        try {
          const reportRes = await api.get(`/reports/${eventId}`);
          if (reportRes.data?.data && isMounted) {
            const report = reportRes.data.data;
            setFormData({
              eventId: eventId,
              clubName: report.clubName || 'Code Circle',
              eventCategory: report.eventCategory || 'Technical Workshop',
              academicYear: report.academicYear || '2025-2026',
              date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
              venue: report.venue || '',
              objective: report.objective || '',
              outcome: report.outcome || '',
              eventOverview: report.eventOverview || '',
              strategiesUsed: Array.isArray(report.strategiesUsed)
                ? report.strategiesUsed.join('\n')
                : report.strategiesUsed || '',
              activitiesDone: Array.isArray(report.activitiesDone)
                ? report.activitiesDone.join('\n')
                : report.activitiesDone || '',
              accomplishments: Array.isArray(report.accomplishments)
                ? report.accomplishments.join('\n')
                : report.accomplishments || '',
              takeaways: Array.isArray(report.takeaways)
                ? report.takeaways.join('\n')
                : report.takeaways || '',
              circularUrl: report.circularUrl || [],
              brochureUrl: report.brochureUrl || [],
              geoPhotoUrl: report.geoPhotoUrl || [],
              feedbackUrl: report.feedbackUrl || [],
              billSettlementUrl: report.billSettlementUrl || [],
              createdBy: report.createdBy,
            });
            return;
          }
        } catch {
          // If no report yet, prefill event details from event route
        }

        const eventRes = await api.get(`/events/${eventId}`);
        if (eventRes.data?.data && isMounted) {
          const ev = eventRes.data.data;
          setFormData((prev) => ({
            ...prev,
            eventId: ev._id,
            venue: ev.venueOrLink || prev.venue,
            date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : prev.date,
            objective: prev.objective || ev.description || '',
          }));
        }
      } catch (err) {
        console.warn('Could not auto-populate event details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleChange = (field: keyof ReportData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormDirty(true);
  };

  // Submit to Backend
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.eventId) {
      toast.error('Please specify an associated Event ID');
      return;
    }
    if (!formData.clubName.trim()) {
      toast.error('Club / Cell Name is required');
      return;
    }
    if (!formData.objective.trim() || !formData.outcome.trim()) {
      toast.error('Both Event Objective and Attained Outcomes are mandatory');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        strategiesUsed: typeof formData.strategiesUsed === 'string'
          ? formData.strategiesUsed.split('\n').filter(Boolean)
          : formData.strategiesUsed,
        activitiesDone: typeof formData.activitiesDone === 'string'
          ? formData.activitiesDone.split('\n').filter(Boolean)
          : formData.activitiesDone,
        accomplishments: typeof formData.accomplishments === 'string'
          ? formData.accomplishments.split('\n').filter(Boolean)
          : formData.accomplishments,
        takeaways: typeof formData.takeaways === 'string'
          ? formData.takeaways.split('\n').filter(Boolean)
          : formData.takeaways,
      };

      const response = await api.post('/reports', payload);
      toast.success('Documentation report saved and synchronized with database!');
      setFormDirty(false);
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (err: any) {
      console.error('Save report failed:', err);
      toast.error(err.response?.data?.error || 'Failed to save event documentation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setPreviewZoom((z) => Math.min(150, z + 10));
  const handleZoomOut = () => setPreviewZoom((z) => Math.max(50, z - 10));
  const handleResetZoom = () => setPreviewZoom(95);

  // Renders the Input Form Body
  const renderFormFields = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION 1: BASIC INFORMATION (EmilCard) */}
      <EmilCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-separator">
          <Building size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-label-primary uppercase tracking-wide">
            1. Basic Institutional &amp; Event Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {eventsList && eventsList.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-label-secondary">
                Associated Event <span className="text-destructive">*</span>
              </label>
              <HeroUISelect
                value={typeof formData.eventId === 'string' ? formData.eventId : formData.eventId?._id || ''}
                onChange={(selId) => {
                  handleChange('eventId', selId);
                  const matched = eventsList.find((ev) => ev._id === selId);
                  if (matched) {
                    setFormData((prev) => ({
                      ...prev,
                      eventId: matched._id,
                      venue: matched.venueOrLink || prev.venue,
                      date: matched.date ? new Date(matched.date).toISOString().split('T')[0] : prev.date,
                      objective: prev.objective || matched.description || '',
                    }));
                  }
                }}
                placeholder="-- Choose an Event --"
                options={eventsList.map((ev) => ({
                  value: ev._id,
                  label: ev.title,
                }))}
                isSearchable
                size="sm"
                className="w-full"
              />
            </div>
          ) : (
            <Input
              label="Associated Event ID"
              placeholder="MongoDB ObjectId of Event"
              value={typeof formData.eventId === 'string' ? formData.eventId : formData.eventId?._id || ''}
              onChange={(e) => handleChange('eventId', e.target.value)}
              isRequired
              description="Foreign key ref to the registered Event"
            />
          )}

          <Input
            label="Club / Department Name"
            placeholder="e.g. Code Circle"
            value={formData.clubName}
            onChange={(e) => handleChange('clubName', e.target.value)}
            isRequired
          />

          <Input
            label="Event Category"
            placeholder="e.g. Technical Workshop, Hackathon"
            value={formData.eventCategory}
            onChange={(e) => handleChange('eventCategory', e.target.value)}
            isRequired
          />

          <Input
            label="Academic Year"
            placeholder="e.g. 2025-2026"
            value={formData.academicYear}
            onChange={(e) => handleChange('academicYear', e.target.value)}
            isRequired
          />

          <Input
            type="date"
            label="Event Date"
            value={typeof formData.date === 'string' ? formData.date.split('T')[0] : ''}
            onChange={(e) => handleChange('date', e.target.value)}
            isRequired
          />

          <Input
            label="Venue / Laboratory"
            placeholder="e.g. Main Auditorium / Lab 3"
            value={formData.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            isRequired
          />
        </div>
      </EmilCard>

      {/* SECTION 2: CORE TEXT - OBJECTIVE & OUTCOME (EmilCard) */}
      <EmilCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-separator">
          <FileText size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-label-primary uppercase tracking-wide">
            2. Core Objectives &amp; Attained Outcomes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Event Objective"
            placeholder="State the institutional and pedagogical objectives of the event..."
            value={formData.objective}
            onChange={(e) => handleChange('objective', e.target.value)}
            minRows={4}
            isRequired
            description="Clear statement of why the event was conducted"
          />

          <Textarea
            label="Attained Learning Outcomes"
            placeholder="Detail what technical skills or milestones the participants achieved..."
            value={formData.outcome}
            onChange={(e) => handleChange('outcome', e.target.value)}
            minRows={4}
            isRequired
            description="Measured benefits, competencies, and deliverables"
          />
        </div>
      </EmilCard>

      {/* SECTION 3: DETAILED SUMMARY (EmilCard) */}
      <EmilCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-separator">
          <Layers size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-label-primary uppercase tracking-wide">
            3. Detailed Summary &amp; Methodology
          </h3>
        </div>

        <div className="space-y-4">
          <Textarea
            label="Event Overview"
            placeholder="Comprehensive narrative description of the event progression..."
            value={formData.eventOverview}
            onChange={(e) => handleChange('eventOverview', e.target.value)}
            minRows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Strategies & Methodology Used"
              placeholder="One per line: e.g. Peer programming sessions&#10;Hands-on debugging drill"
              value={formData.strategiesUsed as string}
              onChange={(e) => handleChange('strategiesUsed', e.target.value)}
              minRows={3}
              description="Enter points separated by new lines"
            />

            <Textarea
              label="Activities & Challenges Conducted"
              placeholder="One per line: e.g. Speed coding round&#10;Architecture design sprint"
              value={formData.activitiesDone as string}
              onChange={(e) => handleChange('activitiesDone', e.target.value)}
              minRows={3}
              description="Enter points separated by new lines"
            />

            <Textarea
              label="Accomplishments & Milestones"
              placeholder="One per line: e.g. 150+ students completed assignments&#10;12 prototypes deployed"
              value={formData.accomplishments as string}
              onChange={(e) => handleChange('accomplishments', e.target.value)}
              minRows={3}
              description="Enter points separated by new lines"
            />

            <Textarea
              label="Key Takeaways & Feedback Insights"
              placeholder="One per line: e.g. High demand for intermediate algorithms workshop"
              value={formData.takeaways as string}
              onChange={(e) => handleChange('takeaways', e.target.value)}
              minRows={3}
              description="Enter points separated by new lines"
            />
          </div>
        </div>
      </EmilCard>

      {/* SECTION 4: EVIDENCE DRAG & DROP UPLOAD (EmilCard) */}
      <EmilCard className="p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-separator">
          <UploadCloud size={16} className="text-primary" />
          <div>
            <h3 className="text-sm font-bold text-label-primary uppercase tracking-wide">
              4. Documentary Evidence &amp; Compliance Attachments
            </h3>
            <p className="text-xs text-label-secondary">
              Drag and drop scans or photos for the 5 official evidence categories. These images will be embedded directly into the print-ready PDF.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <EvidenceDropzone
            label="1. Official Circular / Sanction Order"
            description="Scanned copy of the approved circular, notice or permission letter"
            urls={formData.circularUrl}
            onChange={(urls) => handleChange('circularUrl', urls)}
          />

          <div className="border-t border-separator/40" />

          <EvidenceDropzone
            label="2. Event Brochure & Promotional Leaflet"
            description="Digital brochure, poster, agenda pamphlet or invitation"
            urls={formData.brochureUrl}
            onChange={(urls) => handleChange('brochureUrl', urls)}
          />

          <div className="border-t border-separator/40" />

          <EvidenceDropzone
            label="3. Geo-Tagged Live Event Photographs"
            description="High-resolution photographs taken during the session displaying venue/date"
            urls={formData.geoPhotoUrl}
            onChange={(urls) => handleChange('geoPhotoUrl', urls)}
          />

          <div className="border-t border-separator/40" />

          <EvidenceDropzone
            label="4. Participant Feedback & Attendance Proof"
            description="Feedback chart summary, sign-off attendance sheets, or analytics"
            urls={formData.feedbackUrl}
            onChange={(urls) => handleChange('feedbackUrl', urls)}
          />

          <div className="border-t border-separator/40" />

          <EvidenceDropzone
            label="5. Bill Settlement & Financial Vouchers"
            description="Settlement invoice, refreshments/prizes bills, or expenditure statement"
            urls={formData.billSettlementUrl}
            onChange={(urls) => handleChange('billSettlementUrl', urls)}
          />
        </div>
      </EmilCard>

      {/* BOTTOM SUBMIT & PRINT FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-secondary/70 border border-separator">
        <div className="flex items-center gap-2 text-xs text-label-secondary">
          <Info size={14} className="text-primary" />
          <span>
            PDF rendering executes completely client-side in your browser via <code className="font-mono text-label-primary">react-to-print</code>.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <EmilButton
            type="button"
            variant="outline"
            size="md"
            whileTap={{ scale: 0.97 }}
            onClick={() => setViewMode('preview')}
            className="gap-2 whitespace-nowrap cursor-pointer w-full sm:w-auto"
          >
            <Eye size={16} />
            <span>Full PDF Preview</span>
          </EmilButton>

          <EmilButton
            type="button"
            variant="outline"
            size="md"
            whileTap={{ scale: 0.97 }}
            onClick={() => handlePrint()}
            className="gap-2 whitespace-nowrap cursor-pointer w-full sm:w-auto"
          >
            <Printer size={16} />
            <span>Generate PDF</span>
          </EmilButton>

          <EmilButton
            type="submit"
            variant="solid"
            size="md"
            whileTap={{ scale: 0.97 }}
            isLoading={submitting}
            className="gap-2 whitespace-nowrap cursor-pointer shadow-md bg-primary hover:bg-primary/95 text-white w-full sm:w-auto"
          >
            <Save size={16} />
            <span>Save to MongoDB</span>
          </EmilButton>
        </div>
      </div>
    </form>
  );

  return (
    <div className={`w-full mx-auto space-y-6 pb-16 transition-all duration-200 ${viewMode === 'split' ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
      {/* ══════════════════════════════════════════════════════════════
          PAGE TITLE & HEADER CONTROLS
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-separator">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-label-secondary">
              Bannari Amman Institute of Technology &bull; Event Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-label-primary">
            Official Event Documentation Generator
          </h2>
          <p className="text-xs text-label-secondary">
            Fill in official compliance details, attach documentary evidence, and preview the live print-ready document.
          </p>
        </div>

        {/* Global Toolbar & Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Segment Switcher: Edit | Split | Preview */}
          <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl border border-separator">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <FileEdit size={13} />
              <span>Edit Form</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <Columns2 size={13} />
              <span>Split View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <Eye size={13} />
              <span>PDF Preview</span>
            </button>
          </div>

          {/* Client-side PDF Generation Button */}
          <EmilButton
            type="button"
            variant="outline"
            size="md"
            whileTap={{ scale: 0.97 }}
            onClick={() => handlePrint()}
            className="gap-2 whitespace-nowrap cursor-pointer border-neutral-300 dark:border-white/15"
          >
            <Printer size={16} />
            <span>Generate PDF</span>
          </EmilButton>

          {/* Database Submit Button with requirement whileTap={{ scale: 0.97 }} */}
          <EmilButton
            type="button"
            variant="solid"
            size="md"
            whileTap={{ scale: 0.97 }}
            isLoading={submitting}
            onClick={() => handleSubmit()}
            className="gap-2 whitespace-nowrap cursor-pointer shadow-md bg-primary hover:bg-primary/95 text-white"
          >
            <Save size={16} />
            <span>Save to MongoDB</span>
          </EmilButton>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-label-secondary text-sm">
          Loading report configuration...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 1: EDIT FORM ONLY
          ══════════════════════════════════════════════════════════ */}
          {viewMode === 'edit' && renderFormFields()}

          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 2: SPLIT SCREEN (SIDE-BY-SIDE ON DESKTOP)
          ══════════════════════════════════════════════════════════ */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Form Editor */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-separator">
                  <h3 className="text-sm font-bold text-label-primary uppercase tracking-wide flex items-center gap-2">
                    <FileEdit size={15} className="text-primary" /> Form Editor
                  </h3>
                  <span className="text-xs text-label-secondary">Live syncing with document</span>
                </div>
                {renderFormFields()}
              </div>

              {/* Right Column: Sticky Live PDF Preview */}
              <div className="lg:sticky lg:top-6 space-y-4">
                <LivePdfPreview
                  data={formData}
                  zoom={previewZoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                  onPrint={handlePrint}
                  isCompact={true}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW MODE 3: FULL SCREEN PDF PREVIEW
          ══════════════════════════════════════════════════════════ */}
          {viewMode === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  &larr; Back to Form Editing
                </button>
              </div>

              <LivePdfPreview
                data={formData}
                zoom={previewZoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onPrint={handlePrint}
                isCompact={false}
              />
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PART 3: HIDDEN A4 PRINTABLE COMPONENT IN DOM
          Rendered off-screen with full DOM structure so react-to-print
          can read pristine unscaled styles and images synchronously
          for the browser print dialog.
      ══════════════════════════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        className="fixed -left-[20000px] top-0 pointer-events-none opacity-0 overflow-hidden"
      >
        <OfficialReportTemplate ref={printContainerRef} data={formData} />
      </div>
    </div>
  );
};

export default EventReportForm;
