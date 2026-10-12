import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Medal, Sliders, Award, Sparkles, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import MyCertificatesView from '../components/dashboard/MyCertificatesView';
import CertificateStudio from '../components/admin/certificates/CertificateStudio';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isPrivileged =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee';

  const [viewMode, setViewMode] = useState<'my' | 'studio'>('my');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck size={16} />
            <span>Institutional Credentials Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
            Certificates & Credentials
          </h1>
          <p className="text-xs text-label-tertiary mt-1 max-w-xl">
            Verifiable digital certificates backed by Code Circle and Bannari Amman Institute of Technology.
          </p>
        </div>

        {/* Privileged Role Switcher */}
        {isPrivileged && (
          <div className="flex items-center p-1 bg-surface-raised border border-separator rounded-2xl shadow-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('my')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'my'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-label-tertiary hover:text-label-primary'
              }`}
            >
              <Medal size={15} />
              <span>My Certificates</span>
            </button>
            <button
              onClick={() => setViewMode('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'studio'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-label-tertiary hover:text-label-primary'
              }`}
            >
              <Sliders size={15} />
              <span>Certificate Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Render */}
      <div>
        {isPrivileged && viewMode === 'studio' ? (
          <CertificateStudio />
        ) : (
          <MyCertificatesView />
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
