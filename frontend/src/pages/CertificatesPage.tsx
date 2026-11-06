import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Medal, Sliders, Award, Sparkles, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import MyCertificatesView from '../components/dashboard/MyCertificatesView';
import CertificateStudio from '../components/admin/certificates/CertificateStudio';
import { Button } from '@heroui/react';

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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-4 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck size={16} />
            <span>Institutional Credentials Engine</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
            Certificates & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-label-tertiary mt-1 max-w-xl">
            Verifiable digital certificates backed by Code Circle and Bannari Amman Institute of Technology.
          </p>
        </div>

        {/* Privileged Role Switcher */}
        {isPrivileged && (
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center p-1 bg-surface-raised border border-separator rounded-2xl shadow-xs shrink-0 gap-1">
            <Button
              size="sm"
              variant={viewMode === 'my' ? 'primary' : 'ghost'}
              onPress={() => setViewMode('my')}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 min-h-[40px] text-xs font-bold"
            >
              <Medal size={15} />
              <span>My Certificates</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'studio' ? 'primary' : 'ghost'}
              onPress={() => setViewMode('studio')}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 min-h-[40px] text-xs font-bold"
            >
              <Sliders size={15} />
              <span>Certificate Studio</span>
            </Button>
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
