import React, { useState } from 'react';
import AssessmentList from '../components/assessments/AssessmentList';
import CodingChallengeList from '../components/coding/CodingChallengeList';
import { Terminal, Award } from 'lucide-react';
import TutorialButton from '../components/common/TutorialButton';
import RestrictionBanner from '../components/common/RestrictionBanner';
import { Button } from '@heroui/react';

export const AssessmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coding' | 'mcq'>('coding');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Account Restriction Notice */}
      <RestrictionBanner feature="assessments" />

      {/* Page Header */}
      <div className="pb-3 border-b border-separator flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="meta-editorial text-label-secondary">Academic & Skills</p>
            <TutorialButton tutorialId={activeTab === 'coding' ? 'coding' : 'assessments'} label={activeTab === 'coding' ? 'Coding Guide' : 'MCQ Guide'} />
          </div>
          <h1 className="display-headline text-label-primary">Assessments</h1>
          <p className="text-[13px] sm:text-[14px] text-label-secondary mt-1">
            Algorithmic problem tracks, timed coding tests, and technical evaluations.
          </p>
        </div>

        {/* Apple Segmented Pill Switcher */}
        <div className="flex items-center p-1 rounded-2xl sm:rounded-full bg-surface-secondary border border-separator/80 shrink-0 w-full sm:w-auto shadow-sm gap-1">
          <Button
            size="sm"
            variant={activeTab === 'coding' ? 'primary' : 'ghost'}
            onPress={() => setActiveTab('coding')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 min-h-[40px] text-xs font-semibold"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Live Coding Sandbox</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'mcq' ? 'primary' : 'ghost'}
            onPress={() => setActiveTab('mcq')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 min-h-[40px] text-xs font-semibold"
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">MCQ Quizzes</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'coding' ? <CodingChallengeList /> : <AssessmentList />}
    </div>
  );
};

export default AssessmentsPage;
