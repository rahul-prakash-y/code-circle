import React from 'react';
import OnboardingStatsWidget from '../components/admin/OnboardingStatsWidget';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-separator pb-4">
        <div>
          <p className="meta-editorial mb-1 text-label-secondary">Intelligence & Operations</p>
          <h1 className="display-headline text-label-primary">Admin Analytics</h1>
          <p className="mt-1 text-[14px] text-label-secondary">
            Club engagement, student onboarding verification, attendance metrics, and directory standings.
          </p>
        </div>
      </div>

      {/* Main Content - Onboarding Tracker */}
      <div className="space-y-8">
        <OnboardingStatsWidget />
      </div>
    </div>
  );
};

export default AnalyticsPage;
