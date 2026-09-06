import React from 'react';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';

export const FeedbackPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Voice & Opinions</p>
        <h1 className="display-headline text-label-primary">Feedback</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          Share your candid event experiences, lecture reviews, and club recommendations.
        </p>
      </div>

      {/* Main Feedback Dashboard */}
      <FeedbackDashboard />
    </div>
  );
};

export default FeedbackPage;
