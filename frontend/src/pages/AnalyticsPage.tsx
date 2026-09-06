import React from 'react';
import AdminAnalytics from '../components/admin/AdminAnalytics';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Intelligence</p>
        <h1 className="display-headline text-label-primary">Analytics</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          Club engagement, attendance metrics, assessment completion, and platform trends.
        </p>
      </div>

      {/* Main Analytics */}
      <AdminAnalytics />
    </div>
  );
};

export default AnalyticsPage;
