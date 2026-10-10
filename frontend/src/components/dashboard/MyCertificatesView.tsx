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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useCertificateStore, { IssuedCertificate } from '../../store/useCertificateStore';

export const MyCertificatesView: React.FC = () => {
  const { myCertificates, loading, fetchMyCertificates, downloadCertificatePdf } = useCertificateStore();
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);

  useEffect(() => {
    fetchMyCertificates();
  }, []);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification URL copied to clipboard!');
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
        {myCertificates.map((cert) => (
          <motion.div
            key={cert._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-surface rounded-2xl border border-separator hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            {/* Certificate Top Banner Preview */}
            <div className="p-6 bg-gradient-to-br from-primary/15 via-surface to-surface-raised border-b border-separator/60 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {cert.certificateId}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck size={12} />
                  <span>Verified</span>
                </span>
              </div>

              <h4 className="text-base font-extrabold text-label-primary tracking-tight line-clamp-1">
                {cert.title}
              </h4>
              <p className="text-xs text-label-tertiary mt-1 line-clamp-2 leading-relaxed">
                {cert.description || 'Awarded for active participation and technical achievement.'}
              </p>
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
                  onClick={() => downloadCertificatePdf(cert._id, cert.certificateId)}
                  className="py-2 px-3 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
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
        ))}
      </div>
    </div>
  );
};

export default MyCertificatesView;
