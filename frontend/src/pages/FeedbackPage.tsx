import React from 'react';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';
import { Sparkles, MessageSquareQuote } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header with Accent Touch */}
      <div className="relative pb-6 border-b border-separator">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tracking-wide uppercase">
              <Sparkles size={11} />
              <span>Voice & Opinions</span>
            </div>
            <h1 className="display-headline text-label-primary tracking-tight">
              Community Feedback
            </h1>
            <p className="text-sm text-label-secondary max-w-2xl leading-relaxed">
              Share your candid workshop experiences, contest impressions, and suggestions to elevate the Code Circle community.
            </p>
          </div>
        </div>
      </div>

      {/* Main Feedback Dashboard */}
      <FeedbackDashboard />
    </div>
  );
};

export default FeedbackPage;
