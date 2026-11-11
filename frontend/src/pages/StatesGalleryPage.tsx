import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  EmptyState,
  DelayedSkeleton,
  CardGridSkeleton,
  ErrorState,
  SlowNetworkNotice,
  NoSearchResults,
  PermissionDenied,
  FormErrorSummary,
  FieldInlineError,
  RequiredFieldMarker,
  SuccessState,
} from '@/components/states';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@heroui/react';
import {
  Layers,
  Sparkles,
  WifiOff,
  Clock,
  Search,
  Camera,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
} from 'lucide-react';

export const StatesGalleryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [formValues, setFormValues] = useState({ title: '', email: '' });
  const [formTouched, setFormTouched] = useState({ title: false, email: false });
  const [triggerUnauthorized, setTriggerUnauthorized] = useState(false);

  const errors = {
    title: formTouched.title && !formValues.title ? 'Title is required. Please provide a clear event headline.' : undefined,
    email:
      formTouched.email && !formValues.email.includes('@')
        ? 'Please enter a valid official email address (e.g. name@bitsathy.ac.in).'
        : undefined,
  };

  const handleSimulate401 = () => {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    setTriggerUnauthorized(true);
  };

  const tabs = [
    { id: 'all', label: 'All 10 States', icon: Layers },
    { id: 'empty', label: '1. Empty', icon: Sparkles },
    { id: 'loading', label: '2. Loading', icon: Clock },
    { id: 'error', label: '3. Error', icon: AlertTriangle },
    { id: 'offline', label: '4. Offline', icon: WifiOff },
    { id: 'slow', label: '5. Slow Net', icon: Clock },
    { id: 'search', label: '6. Search', icon: Search },
    { id: 'permission', label: '7. Permission', icon: Camera },
    { id: 'session', label: '8. Session 401', icon: KeyRound },
    { id: 'validation', label: '9. Validation', icon: AlertTriangle },
    { id: 'success', label: '10. Success', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-canvas text-label-primary p-4 sm:p-8 space-y-8">
      {/* Gallery Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-separator">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-accent/15 text-accent border border-accent/25">
              DEV GALLERY & AUDIT
            </span>
            <span className="text-xs text-label-tertiary">WCAG 2.1 AA Compliant States Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Universal Frontend UX States Gallery
          </h1>
          <p className="text-xs sm:text-sm text-label-secondary mt-1">
            Interactive live preview of all 10 standard user-facing states across themes and breakpoints.
          </p>
        </div>

        {/* Global Gallery Controls: Light/Dark Mode + Desktop/Mobile Frame */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            size="sm"
            variant="outline"
            onPress={() => setIsMobilePreview(!isMobilePreview)}
            startContent={isMobilePreview ? <Monitor size={14} /> : <Smartphone size={14} />}
            className="text-xs font-semibold rounded-full h-9"
          >
            {isMobilePreview ? 'Desktop View' : 'Mobile Frame (390px)'}
          </Button>

          <div className="p-1 rounded-full border border-separator bg-surface">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* State Filter Tabs */}
      <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface hover:bg-surface-secondary text-label-secondary hover:text-label-primary border border-separator'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive Preview Canvas Container */}
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobilePreview
            ? 'max-w-[390px] border-4 border-separator/80 rounded-[44px] p-4 shadow-2xl bg-canvas overflow-hidden min-h-[780px]'
            : 'max-w-6xl'
        }`}
      >
        <div className="space-y-12">
          {/* ── 1. EMPTY STATE ─────────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'empty') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 1: Empty States (First Use vs Filtered vs No Permission)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">Variant: First Use</p>
                  <EmptyState
                    reason="first-use"
                    title="No events scheduled yet"
                    description="Get started by creating your club’s first workshop or campus competition."
                    primaryAction={{
                      label: 'Create First Event',
                      onClick: () => alert('Create event clicked'),
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">Variant: Filtered Out</p>
                  <EmptyState
                    reason="filtered"
                    title="No events match 'Hackathon + Duo'"
                    description="You have applied filters that narrowed down all records. Reset filters to view all."
                    primaryAction={{
                      label: 'Clear All Filters',
                      onClick: () => alert('Filters cleared'),
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── 2. LOADING STATE ───────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'loading') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 2: Loading States (Dimension-Matched Skeletons)
                </h2>
              </div>
              <p className="text-xs text-label-secondary">
                Exact shape of final layout. Delayed by 180ms to avoid flicker on fast loads. Zero CLS.
              </p>
              <CardGridSkeleton count={isMobilePreview ? 2 : 4} cols={isMobilePreview ? 2 : 4} />
            </section>
          )}

          {/* ── 3. ERROR STATE ─────────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'error') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 3: Error States (Fault-Classified with Support Ref)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">Fault: Server (500)</p>
                  <ErrorState
                    fault="server"
                    referenceCode="CC-9E1A"
                    onRetry={() => alert('Retrying server call...')}
                  />
                </div>
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">Fault: Network Disconnected</p>
                  <ErrorState
                    fault="network"
                    referenceCode="CC-NET-404"
                    onRetry={() => alert('Checking connection...')}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── 4. OFFLINE STATE ───────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'offline') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 4: No Internet / Offline Mode
                </h2>
              </div>
              <div className="p-4 rounded-2xl border border-separator bg-surface space-y-3">
                <p className="text-xs text-label-secondary">
                  Persistent notification banner pinned to viewport. Informs user that cached records and drafts are safe in IndexedDB.
                </p>
                <div className="bg-amber-500/90 text-white p-3 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WifiOff size={14} />
                    <span className="font-semibold">Offline Mode:</span>
                    <span>You are browsing offline. Reviewing cached questions and local drafts is enabled.</span>
                  </div>
                  <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-full">Cache Safe</span>
                </div>
              </div>
            </section>
          )}

          {/* ── 5. SLOW NETWORK ────────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'slow') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 5: Slow Network (Threshold &gt; 3.5s Feedback)
                </h2>
              </div>
              <SlowNetworkNotice
                onRetry={() => alert('Retrying with backoff...')}
                onCancel={() => alert('Request cancelled')}
                onDataSaverToggle={() => alert('Data-saver mode toggled')}
              />
            </section>
          )}

          {/* ── 6. NO SEARCH RESULTS ───────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'search') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 6: No Search Results (Did-You-Mean & Quick Clear)
                </h2>
              </div>
              <NoSearchResults
                query="pythoon"
                didYouMean="Python"
                onSelectSuggestion={(term) => alert(`Searching suggestion: ${term}`)}
                onClearFilters={() => alert('Cleared search query')}
                popularSuggestions={['Algorithms', 'Data Structures', 'React', 'MongoDB', 'AI']}
              />
            </section>
          )}

          {/* ── 7. PERMISSION DENIED ────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'permission') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 7: Permission Denied (Browser Hardware vs 403 App Role)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">Hardware: Camera Proctoring</p>
                  <PermissionDenied
                    kind="camera"
                    onContinueWithout={() => alert('Continuing without webcam proctoring...')}
                    onGoBack={() => alert('Returning to previous screen')}
                  />
                </div>
                <div>
                  <p className="text-xs text-label-tertiary mb-2 font-mono">App Auth: 403 Forbidden</p>
                  <PermissionDenied
                    kind="app-403"
                    onRequestAccess={() => alert('Requested clearance from SuperAdmin')}
                    onGoBack={() => alert('Returning to dashboard')}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── 8. SESSION EXPIRED (401) ────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'session') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 8: Session Expired (Clean Login Redirection)
                </h2>
              </div>
              <div className="p-6 rounded-3xl border border-separator bg-surface space-y-4 text-center">
                <p className="text-xs sm:text-sm text-label-secondary max-w-lg mx-auto">
                  When a 401 Unauthorized occurs, the user session is smoothly invalidated and redirected directly to the official Login page without distracting modal overlays.
                </p>
                <Button
                  size="sm"
                  variant="solid"
                  color="danger"
                  onPress={handleSimulate401}
                  startContent={<KeyRound size={14} />}
                  className="font-medium text-xs rounded-full px-5 h-9"
                >
                  Simulate 401 Session Expiry
                </Button>
                {triggerUnauthorized && (
                  <p className="text-[11px] text-emerald-500 font-mono">
                    ✓ Global 401 interceptor triggered! Auth reset and redirected to login.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── 9. FORM VALIDATION ──────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'validation') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 9: Accessible Form Validation (Inline + Error Summary)
                </h2>
              </div>
              <div className="max-w-xl mx-auto p-6 rounded-3xl border border-separator bg-surface space-y-4">
                <FormErrorSummary errors={errors} />

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-label-primary block mb-1">
                      Event Headline <RequiredFieldMarker />
                    </label>
                    <input
                      type="text"
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? 'title-error' : undefined}
                      value={formValues.title}
                      onBlur={() => setFormTouched((p) => ({ ...p, title: true }))}
                      onChange={(e) => setFormValues((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Annual Hackathon 2026"
                      className={`w-full h-10 px-3 rounded-xl border text-xs bg-canvas text-label-primary outline-none transition-colors ${
                        errors.title ? 'border-danger' : 'border-separator focus:border-accent'
                      }`}
                    />
                    <FieldInlineError id="title-error" error={errors.title} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-label-primary block mb-1">
                      Coordinator Email <RequiredFieldMarker />
                    </label>
                    <input
                      type="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      value={formValues.email}
                      onBlur={() => setFormTouched((p) => ({ ...p, email: true }))}
                      onChange={(e) => setFormValues((p) => ({ ...p, email: e.target.value }))}
                      placeholder="e.g. coordinator@bitsathy.ac.in"
                      className={`w-full h-10 px-3 rounded-xl border text-xs bg-canvas text-label-primary outline-none transition-colors ${
                        errors.email ? 'border-danger' : 'border-separator focus:border-accent'
                      }`}
                    />
                    <FieldInlineError id="email-error" error={errors.email} />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    onPress={() => {
                      setFormTouched({ title: true, email: true });
                      if (!formValues.title || !formValues.email.includes('@')) {
                        // Focus first invalid
                        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
                        first?.focus();
                      } else {
                        alert('Form successfully validated!');
                      }
                    }}
                    className="text-xs font-semibold rounded-full px-5 h-9"
                  >
                    Validate & Submit
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* ── 10. SUCCESS STATE ──────────────────────────────────── */}
          {(activeTab === 'all' || activeTab === 'success') && (
            <section className="space-y-4">
              <div className="border-b border-separator/60 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-label-secondary font-mono">
                  State 10: Reassuring Success State (Timeline & Next Steps)
                </h2>
              </div>
              <SuccessState
                title="Event Registration Confirmed!"
                description="Your seat for 'Web3 & AI Workshop' on Nov 15 has been reserved."
                reassurance="Confirmation email sent. Your QR entry pass is active in your Passport."
                timeline={[
                  { label: 'Registration Recorded', time: 'Just now', done: true },
                  { label: 'Seat Assigned (Auditorium Hall 2)', time: 'Just now', done: true },
                  { label: 'Pre-event Verification Quest Unlocks', time: '24h before', done: false },
                  { label: 'Certificate Dispatch upon Attendance', time: 'Post event', done: false },
                ]}
                primaryAction={{
                  label: 'View Passport Ticket',
                  onClick: () => alert('Navigating to Passport ticket...'),
                }}
                onUndo={() => alert('Registration cancelled and seat released')}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatesGalleryPage;
