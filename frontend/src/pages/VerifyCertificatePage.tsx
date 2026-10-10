import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  Building,
  User,
  Award,
  ArrowLeft,
  Search,
} from 'lucide-react';
import api from '../lib/axios';

interface VerificationResult {
  certificateId: string;
  verificationCode: string;
  recipientName: string;
  recipientRollNo?: string;
  title: string;
  subtitle: string;
  description: string;
  issuerOrganization: string;
  signatoryName: string;
  signatoryTitle: string;
  issueDate: string;
  status: 'ACTIVE' | 'REVOKED';
  revocationReason?: string;
}

export const VerifyCertificatePage: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const [searchCode, setSearchCode] = useState(code || '');
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [certData, setCertData] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performVerification = async (targetCode: string) => {
    if (!targetCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/certificates/verify/${targetCode.trim()}`);
      setVerified(res.data.verified);
      setCertData(res.data.certificate);
    } catch (err: any) {
      setVerified(false);
      setCertData(null);
      setErrorMsg(
        err.response?.data?.error ||
          'No official credential was found matching this verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      performVerification(code);
    } else {
      setLoading(false);
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-semibold text-label-secondary hover:text-label-primary transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Code Circle Platform</span>
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
            Public Verification Portal
          </span>
        </div>

        {/* Search Bar for Manual Verification */}
        <div className="bg-surface p-3 rounded-2xl border border-separator shadow-sm flex items-center gap-2">
          <Search size={18} className="text-label-tertiary ml-2 shrink-0" />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Enter Certificate ID or Verification Code (e.g. CC-CERT-2026-XXXX)..."
            className="w-full bg-transparent text-xs text-label-primary placeholder-label-tertiary font-medium focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && performVerification(searchCode)}
          />
          <button
            onClick={() => performVerification(searchCode)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            Verify
          </button>
        </div>

        {/* Verification Result Card */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-label-tertiary">
              Validating credential cryptographic seal...
            </p>
          </div>
        ) : verified && certData ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl border border-emerald-500/30 p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden"
          >
            {/* Ambient Green Aura */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Seal Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                <ShieldCheck size={36} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  Officially Verified Credential
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-label-primary tracking-tight mt-1">
                  Authentic Certificate
                </h2>
                <p className="text-xs text-label-tertiary font-mono">
                  ID: {certData.certificateId} · Code: {certData.verificationCode}
                </p>
              </div>
            </div>

            {/* Recipient Spotlight */}
            <div className="p-6 bg-surface-raised rounded-2xl border border-separator/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-label-tertiary uppercase tracking-wider">
                <User size={14} className="text-primary" />
                <span>Awarded To</span>
              </div>
              <h3 className="text-2xl font-extrabold text-label-primary tracking-tight">
                {certData.recipientName}
              </h3>
              {certData.recipientRollNo && (
                <p className="text-xs font-mono text-label-secondary">
                  Roll / Student ID: {certData.recipientRollNo}
                </p>
              )}
            </div>

            {/* Certificate Details */}
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-label-tertiary font-bold uppercase tracking-wider text-[10px]">
                  Credential Title
                </p>
                <p className="text-base font-bold text-label-primary mt-0.5">{certData.title}</p>
                <p className="text-label-secondary mt-1 leading-relaxed">
                  {certData.description ||
                    'In recognition of active participation, problem-solving, and technical competence.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-separator">
                <div>
                  <p className="text-label-tertiary font-bold uppercase tracking-wider text-[10px]">
                    Issued By
                  </p>
                  <p className="text-label-primary font-semibold mt-0.5">
                    {certData.issuerOrganization}
                  </p>
                  <p className="text-[11px] text-label-secondary mt-0.5">
                    {certData.signatoryName} ({certData.signatoryTitle})
                  </p>
                </div>
                <div>
                  <p className="text-label-tertiary font-bold uppercase tracking-wider text-[10px]">
                    Date of Certification
                  </p>
                  <p className="text-label-primary font-semibold mt-0.5">
                    {new Date(certData.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] text-emerald-500 font-bold mt-0.5">
                    Permanent Academic Record
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="pt-2">
              <a
                href={`/api/certificates/download/${certData.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Download Official Certificate PDF</span>
              </a>
            </div>
          </motion.div>
        ) : errorMsg ? (
          <div className="bg-surface rounded-3xl border border-destructive/20 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-label-primary">Certificate Not Verified</h3>
            <p className="text-xs text-label-tertiary max-w-md mx-auto leading-relaxed">
              {errorMsg}
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-label-tertiary pt-10">
        <p>Code Circle Credential Verification Protocol · Bannari Amman Institute of Technology</p>
      </footer>
    </div>
  );
};

export default VerifyCertificatePage;
