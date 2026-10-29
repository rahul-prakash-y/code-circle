import React from 'react';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';
import { Sparkles, MessageSquareQuote } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="relative pb-6 border-b border-separator">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles size={11} />
              <span>Feedback & discussions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15] text-label-primary">
              Community feedback
            </h1>
            <p className="text-sm sm:text-[15px] text-label-secondary max-w-prose leading-relaxed">
              Share your thoughts on workshops, contests, and suggest new learning tracks to help improve the club community.
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
