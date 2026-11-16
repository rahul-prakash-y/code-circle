import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Medal,
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  Eye,
  X,
  Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useCertificateStore, { IssuedCertificate } from '../../store/useCertificateStore';
import { THEMES } from '../admin/certificates/CertificateStudio';

export const MyCertificatesView: React.FC = () => {
  const { myCertificates, loading, fetchMyCertificates, downloadCertificatePdf } = useCertificateStore();
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);
  const [previewZoom, setPreviewZoom] = useState<'100%' | 'fit'>('100%');

  useEffect(() => {
    fetchMyCertificates();
  }, []);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification URL copied to clipboard!');
  };

  const getThemePalette = (themeKey?: string): any => {
    return THEMES.find((t) => t.id === themeKey) || THEMES[0];
  };

  if (loading && myCertificates.length === 0) {
    return (
      <div className="py-16 text-center text-label-tertiary animate-pulse space-y-3">
        <Medal size={40} className="mx-auto text-primary/40" />
        <p className="text-sm font-medium">Loading your verified certificates & credentials...</p>
      </div>
    );
  }

  if (myCertificates.length === 0) {
    return (
      <div className="py-20 text-center bg-surface rounded-3xl border border-separator p-8 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <Award size={32} />
        </div>
        <h3 className="text-lg font-bold text-label-primary">No Certificates Earned Yet</h3>
        <p className="text-xs text-label-tertiary max-w-md mx-auto leading-relaxed">
          Participate in Code Circle hackathons, attend club workshops, or complete domain learning tracks to earn verifiable institutional credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myCertificates.map((cert) => {
          const isPending = cert.status === 'PENDING_APPROVAL';
          const isRevoked = cert.status === 'REVOKED';

          return (
            <motion.div
              key={cert._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-surface rounded-2xl border border-separator hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Certificate Top Banner Preview */}
              <div
                onClick={() => setSelectedCert(cert)}
                className="p-6 bg-gradient-to-br from-primary/15 via-surface to-surface-raised border-b border-separator/60 relative cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    {cert.certificateId}
                  </span>
                  {isPending ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Sparkles size={12} />
                      <span>Pending Approval</span>
                    </span>
                  ) : isRevoked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <X size={12} />
                      <span>Revoked</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck size={12} />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <h4 className="text-base font-extrabold text-label-primary tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {cert.title}
                </h4>
                <p className="text-xs text-label-tertiary mt-1 line-clamp-2 leading-relaxed">
                  {cert.description || 'Awarded for active participation and technical achievement.'}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Eye size={13} />
                  <span>Click to preview full certificate</span>
                </div>
              </div>

              {/* Certificate Meta & Actions */}
              <div className="p-5 space-y-4 bg-surface">
                <div className="space-y-1.5 text-xs text-label-secondary font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-label-tertiary text-[11px]">Issued To:</span>
                    <span className="text-label-primary font-bold">{cert.recipientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label-tertiary text-[11px]">Issued On:</span>
                    <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label-tertiary text-[11px]">Signatory:</span>
                    <span className="truncate max-w-[150px]">{cert.signatoryName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-separator/60">
                  <button
                    onClick={() => {
                      if (isPending) {
                        toast('Certificate is awaiting administrator approval before PDF can be downloaded.', {
                          icon: '⏳',
                        });
                        return;
                      }
                      downloadCertificatePdf(cert._id, cert.certificateId);
                    }}
                    disabled={isPending}
                    className={`py-2 px-3 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                      isPending
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 cursor-not-allowed opacity-80'
                        : 'bg-primary text-white hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
                    {isPending ? <Lock size={13} /> : <Download size={14} />}
                    <span>{isPending ? 'Pending Approval' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={() => handleCopyLink(cert.verificationCode)}
                    className="py-2 px-3 bg-surface-raised hover:bg-surface-raised/80 text-label-secondary border border-separator text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visual Certificate Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl border border-separator max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-separator">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-primary" />
                    <span className="text-xs font-bold text-label-primary uppercase tracking-wider">
                      Official Certificate Preview
                    </span>
                  </div>
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-surface-raised border border-separator rounded-lg p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom('100%')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        previewZoom === '100%'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                      title="100% true-scale view"
                    >
                      100% Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom('fit')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        previewZoom === 'fit'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                      title="Fit to modal dialog"
                    >
                      Fit
                    </button>
                  </div>
                  {selectedCert.status === 'PENDING_APPROVAL' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Pending Approval
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-label-tertiary hover:text-label-primary rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Render Full Certificate Card matching Studio design */}
              {(() => {
                const currentTheme = getThemePalette(selectedCert.theme);
                return (
                  <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                    <div
                      className={`aspect-[1.414/1] rounded-2xl p-6 sm:p-9 md:p-12 flex flex-col justify-between shadow-xl relative overflow-hidden select-none border shrink-0 ${
                        previewZoom === '100%' ? 'w-[842px] min-w-[842px]' : 'w-full min-w-[560px]'
                      }`}
                      style={{
                        backgroundColor: currentTheme.bg,
                        borderColor: currentTheme.primary + '55',
                        color: currentTheme.text,
                      }}
                    >
                      {/* Ornate Double Border Frame (Matching Original Certificate Template) */}
                      <div
                        className="absolute inset-[18px] sm:inset-[26px] border-[2.5px] pointer-events-none"
                        style={{ borderColor: currentTheme.primary }}
                      />
                      <div
                        className="absolute inset-[24px] sm:inset-[32px] border pointer-events-none opacity-60"
                        style={{ borderColor: currentTheme.secondary || currentTheme.accent }}
                      />

                      {/* Ornate Corner Accents: Cross Bars and Gemstone Pins */}
                      {/* Top-Left */}
                      <div className="absolute top-[18px] sm:top-[26px] left-[18px] sm:left-[26px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div
                          className="w-2 h-2 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xs"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                        <div
                          className="w-6 h-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                        <div
                          className="w-0.5 h-6 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                      </div>

                      {/* Top-Right */}
                      <div className="absolute top-[18px] sm:top-[26px] right-[18px] sm:right-[26px] translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div
                          className="w-2 h-2 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xs"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                        <div
                          className="w-6 h-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                        <div
                          className="w-0.5 h-6 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                      </div>

                      {/* Bottom-Left */}
                      <div className="absolute bottom-[18px] sm:bottom-[26px] left-[18px] sm:left-[26px] -translate-x-1/2 translate-y-1/2 pointer-events-none">
                        <div
                          className="w-2 h-2 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xs"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                        <div
                          className="w-6 h-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                        <div
                          className="w-0.5 h-6 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                      </div>

                      {/* Bottom-Right */}
                      <div className="absolute bottom-[18px] sm:bottom-[26px] right-[18px] sm:right-[26px] translate-x-1/2 translate-y-1/2 pointer-events-none">
                        <div
                          className="w-2 h-2 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xs"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                        <div
                          className="w-6 h-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                        <div
                          className="w-0.5 h-6 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.accent }}
                        />
                      </div>

                      {/* Ambient Glows */}
                      <div
                        className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-12 pointer-events-none"
                        style={{ background: currentTheme.primary }}
                      />
                      <div
                        className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-12 pointer-events-none"
                        style={{ background: currentTheme.secondary }}
                      />
                      <div
                        className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-10 pointer-events-none"
                        style={{ background: currentTheme.accent || currentTheme.primary }}
                      />
                      <div
                        className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full blur-3xl opacity-10 pointer-events-none"
                        style={{ background: currentTheme.secondary }}
                      />

                      {/* Header with Club Logo */}
                      <div className="text-center relative z-10 pt-1">
                        <img
                          src="/codecirclelogo.jpeg"
                          alt="Code Circle Logo"
                          className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-2.5 rounded-full border-2 border-black/10 shadow-sm object-cover bg-black/5"
                        />
                        <p
                          className="text-[9.5px] sm:text-[11px] font-bold tracking-[0.24em] uppercase"
                          style={{ color: currentTheme.primary }}
                        >
                          {selectedCert.issuerOrganization || 'CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY'}
                        </p>
                        <h2
                          className="text-lg sm:text-2xl font-black tracking-tight mt-1 uppercase"
                          style={{ color: currentTheme.text }}
                        >
                          {selectedCert.title}
                        </h2>
                        <p
                          className="text-[9.5px] sm:text-[11px] font-medium opacity-75 tracking-[0.2em] uppercase mt-1"
                          style={{ color: currentTheme.text }}
                        >
                          {selectedCert.subtitle || 'PROUDLY PRESENTED TO'}
                        </p>
                        <div
                          className="w-16 sm:w-20 h-1 mx-auto my-3 sm:my-3.5 rounded-full"
                          style={{ backgroundColor: currentTheme.secondary || currentTheme.primary }}
                        />
                      </div>

                      {/* Recipient Spotlight */}
                      <div className="text-center my-auto relative z-10 py-3 sm:py-5">
                        <h1
                          className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase"
                          style={{ color: currentTheme.primary }}
                        >
                          {selectedCert.recipientName}
                        </h1>
                        {selectedCert.recipientRollNo && (
                          <p
                            className="text-xs sm:text-sm font-mono opacity-70 mt-1.5 font-semibold"
                            style={{ color: currentTheme.text }}
                          >
                            Roll No: {selectedCert.recipientRollNo}
                          </p>
                        )}
                        <p
                          className="text-xs sm:text-[13px] opacity-80 max-w-lg sm:max-w-xl mx-auto mt-2.5 sm:mt-3 leading-relaxed px-4 line-clamp-2"
                          style={{ color: currentTheme.text }}
                        >
                          {selectedCert.description}
                        </p>
                      </div>

                      {/* Footer: Verification Strip & Signatures */}
                      <div className="space-y-2.5 relative z-10 pt-2">
                        <div
                          className="flex items-center justify-between px-2.5 py-1.5 border-y text-[8px] sm:text-[9.5px] font-mono opacity-75"
                          style={{
                            borderColor: currentTheme.primary + '25',
                            color: currentTheme.text,
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck size={14} style={{ color: currentTheme.primary }} />
                            <span className="font-bold tracking-wider uppercase">Verified Institutional Credential</span>
                          </div>
                          <div>
                            ID: {selectedCert.certificateId} · DATE: {new Date(selectedCert.issueDate).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Three Faculty Signatures Side by Side */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-1 text-center">
                          <div>
                            <div
                              className="w-16 sm:w-24 h-0.5 mx-auto mb-1.5"
                              style={{ backgroundColor: currentTheme.primary + '55' }}
                            />
                            <p className="text-[9px] sm:text-[11px] font-bold truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.signatoryName || 'Dr. Dhanasekar R'}
                            </p>
                            <p className="text-[8px] sm:text-[9.5px] font-semibold opacity-90 truncate" style={{ color: currentTheme.primary }}>
                              {selectedCert.signatoryTitle || 'Faculty Coordinator'}
                            </p>
                            <p className="text-[7px] sm:text-[8.5px] opacity-60 truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.signatoryDepartment || 'Faculty Coordinator · EIE'}
                            </p>
                          </div>

                          <div>
                            <div
                              className="w-16 sm:w-24 h-0.5 mx-auto mb-1.5"
                              style={{ backgroundColor: currentTheme.primary + '55' }}
                            />
                            <p className="text-[9px] sm:text-[11px] font-bold truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.secondarySignatoryName || 'Dr. Nandhini K M'}
                            </p>
                            <p className="text-[8px] sm:text-[9.5px] font-semibold opacity-90 truncate" style={{ color: currentTheme.primary }}>
                              {selectedCert.secondarySignatoryTitle || 'Faculty Coordinator'}
                            </p>
                            <p className="text-[7px] sm:text-[8.5px] opacity-60 truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.secondarySignatoryDepartment || 'Faculty Coordinator · EIE'}
                            </p>
                          </div>

                          <div>
                            <div
                              className="w-16 sm:w-24 h-0.5 mx-auto mb-1.5"
                              style={{ backgroundColor: currentTheme.primary + '55' }}
                            />
                            <p className="text-[9px] sm:text-[11px] font-bold truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.tertiarySignatoryName || 'Prof. RATHNA S'}
                            </p>
                            <p className="text-[8px] sm:text-[9.5px] font-semibold opacity-90 truncate" style={{ color: currentTheme.primary }}>
                              {selectedCert.tertiarySignatoryTitle || 'Faculty Coordinator'}
                            </p>
                            <p className="text-[7px] sm:text-[8.5px] opacity-60 truncate" style={{ color: currentTheme.text }}>
                              {selectedCert.tertiarySignatoryDepartment || 'Faculty Coordinator · CSE'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface-raised rounded-xl transition-colors"
                >
                  Close
                </button>
                {selectedCert.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => downloadCertificatePdf(selectedCert._id, selectedCert.certificateId)}
                    className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCertificatesView;
