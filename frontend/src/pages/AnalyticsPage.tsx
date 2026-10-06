import React, { useState } from 'react';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import OnboardingStatsWidget from '../components/admin/OnboardingStatsWidget';
import { BarChart3, UserCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'analytics'>('onboarding');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-separator pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="meta-editorial mb-1 text-label-secondary">Intelligence & Operations</p>
          <h1 className="display-headline text-label-primary">Admin Analytics</h1>
          <p className="mt-1 text-[14px] text-label-secondary">
            Club engagement, student onboarding verification, attendance metrics, and platform performance.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center rounded-2xl border border-separator/80 bg-surface-secondary p-1">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'onboarding'
                ? 'bg-surface text-label-primary shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <UserCheck size={14} className={activeTab === 'onboarding' ? 'text-accent' : ''} />
            <span>Onboarding Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-surface text-label-primary shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <BarChart3 size={14} className={activeTab === 'analytics' ? 'text-accent' : ''} />
            <span>Platform Trends</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'onboarding' ? (
        <div className="space-y-8">
          <OnboardingStatsWidget />
        </div>
      ) : (
        <AdminAnalytics />
      )}
    </div>
  );
};

export default AnalyticsPage;

