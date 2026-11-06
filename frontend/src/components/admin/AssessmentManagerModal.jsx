import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Card } from '@heroui/react';

const AssessmentManagerModal = ({ isOpen, onClose, onOpenAssessments }) => {
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchAssessmentData = async () => {
        setLoading(true);
        try {
          const [probRes, quizRes] = await Promise.all([
            api.get('/problems').catch(() => ({ data: [] })),
            api.get('/assessments').catch(() => ({ data: { data: [] } })),
          ]);
          setProblems(probRes.data || []);
          setQuizzes(quizRes.data?.data || quizRes.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchAssessmentData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const easyProblems = problems.filter((p) => p.difficulty === 'Easy');
  const mediumProblems = problems.filter((p) => p.difficulty === 'Medium');
  const hardProblems = problems.filter((p) => p.difficulty === 'Hard');

  const assessmentTiers = [
    {
      level: 'Tier 1',
      title: 'Easy assessment level',
      difficulty: 'Easy',
      badgeColor: 'bg-success-subtle text-success border-success/20',
      description: 'Foundational syntax, array manipulation, and basic algorithmic logic.',
      count: easyProblems.length,
      sampleId: easyProblems[0]?._id,
    },
    {
      level: 'Tier 2',
      title: 'Medium assessment level',
      difficulty: 'Medium',
      badgeColor: 'bg-warning-subtle text-warning border-warning/20',
      description: 'Intermediate data structures, trees, graphs, sorting, and dynamic logic.',
      count: mediumProblems.length,
      sampleId: mediumProblems[0]?._id,
    },
    {
      level: 'Tier 3',
      title: 'Hard assessment level',
      difficulty: 'Hard',
      badgeColor: 'bg-destructive-subtle text-destructive border-destructive/20',
      description: 'Complex dynamic programming, graph theory, and competitive time bounds.',
      count: hardProblems.length,
      sampleId: hardProblems[0]?._id,
    },
    {
      level: 'Specialized',
      title: 'Quiz & conceptual track',
      difficulty: 'Quiz',
      badgeColor: 'bg-accent-subtle text-accent border-accent/20',
      description: 'Timed multi-choice concept assessments covering web, system design & CS fundamentals.',
      count: quizzes.length,
      sampleId: null,
    },
  ];

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <span>Assessment Levels & Tracks</span>
        </div>
      }
      description="Manage coding challenges and knowledge evaluation tiers."
      dialogClassName="sm:max-w-2xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
          <div className="p-4 bg-surface-secondary border border-separator rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary block">Total levels</span>
            <span className="text-2xl font-semibold tabular-nums text-label-primary">{assessmentTiers.length} Tracks</span>
          </div>
          <div className="p-4 bg-surface-secondary border border-separator rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary block">Coding problems</span>
            <span className="text-2xl font-semibold tabular-nums text-accent">{problems.length} Available</span>
          </div>
          <div className="p-4 bg-surface-secondary border border-separator rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary block">Quizzes</span>
            <span className="text-2xl font-semibold tabular-nums text-accent">{quizzes.length} Modules</span>
          </div>
        </div>

        {/* Assessment Tiers List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-label-secondary flex items-center justify-center gap-2">
              <Spinner size="sm" color="primary" />
              <span>Loading assessment tracks...</span>
            </div>
          ) : (
            assessmentTiers.map((tier, idx) => (
              <Card
                key={idx}
                className="p-4 rounded-2xl bg-surface border border-separator hover:border-accent/40 transition-all flex flex-row items-center justify-between group shadow-xs"
              >
                <div className="space-y-1 max-w-[75%]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${tier.badgeColor}`}>
                      {tier.level}
                    </span>
                    <h4 className="text-sm font-medium text-label-primary group-hover:text-accent transition-colors">
                      {tier.title}
                    </h4>
                  </div>
                  <p className="text-xs text-label-secondary leading-relaxed font-normal">{tier.description}</p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-lg font-semibold tabular-nums text-label-primary">{tier.count}</span>
                    <span className="text-[10px] text-label-secondary block uppercase font-medium">Items</span>
                  </div>
                  {tier.difficulty === 'Quiz' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        onClose();
                        if (onOpenAssessments) onOpenAssessments();
                      }}
                      className="rounded-xl flex items-center gap-1 text-xs font-medium cursor-pointer"
                      title="Launch MCQ Assessments Engine"
                    >
                      Open engine <ChevronRight size={14} />
                    </Button>
                  ) : (
                    tier.sampleId && (
                      <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          onClose();
                          navigate(`/problem/${tier.sampleId}`);
                        }}
                        className="rounded-xl text-label-secondary hover:text-label-primary transition-all cursor-pointer"
                        title="Launch arena"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    )
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex justify-end gap-3">
          <Button
            variant="primary"
            size="sm"
            onPress={onClose}
            className="rounded-full px-5 font-semibold text-xs text-white"
          >
            Close Manager
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AssessmentManagerModal;
