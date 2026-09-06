import React from 'react';
import AssessmentList from '../components/assessments/AssessmentList';

export const AssessmentsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Academic & Skills</p>
        <h1 className="display-headline text-label-primary">Assessments</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          Algorithmic problem tracks, timed coding tests, and technical evaluations.
        </p>
      </div>

      {/* Main Assessment List */}
      <AssessmentList />
    </div>
  );
};

export default AssessmentsPage;
