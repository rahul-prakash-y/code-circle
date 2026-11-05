import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Award, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

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
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Foundational syntax, array manipulation, and basic algorithmic logic.',
      count: easyProblems.length,
      sampleId: easyProblems[0]?._id,
    },
    {
      level: 'Tier 2',
      title: 'Medium assessment level',
      difficulty: 'Medium',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Intermediate data structures, trees, graphs, sorting, and dynamic logic.',
      count: mediumProblems.length,
      sampleId: mediumProblems[0]?._id,
    },
    {
      level: 'Tier 3',
      title: 'Hard assessment level',
      difficulty: 'Hard',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      description: 'Complex dynamic programming, graph theory, and competitive time bounds.',
      count: hardProblems.length,
      sampleId: hardProblems[0]?._id,
    },
    {
      level: 'Specialized',
      title: 'Quiz & conceptual track',
      difficulty: 'Quiz',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">Total levels</span>
            <span className="text-2xl font-semibold tabular-nums text-text-primary">{assessmentTiers.length} Tracks</span>
          </div>
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">Coding problems</span>
            <span className="text-2xl font-semibold tabular-nums text-accent-muted">{problems.length} Available</span>
          </div>
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">Quizzes</span>
            <span className="text-2xl font-semibold tabular-nums text-purple-400">{quizzes.length} Modules</span>
          </div>
        </div>

        {/* Assessment Tiers List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Loading assessment tracks...</span>
            </div>
          ) : (
            assessmentTiers.map((tier, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-elevated border border-border hover:border-white/15 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${tier.badgeColor}`}>
                    {tier.level}
                  </span>
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-purple-400 transition-colors">
                    {tier.title}
                  </h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-normal">{tier.description}</p>
              </div>

              <div className="text-right flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-semibold tabular-nums text-text-primary">{tier.count}</span>
                  <span className="text-[10px] text-text-muted block uppercase font-medium">Items</span>
                </div>
                {tier.difficulty === 'Quiz' ? (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAssessments) onOpenAssessments();
                    }}
                    className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-text-primary transition-all flex items-center gap-1 text-xs font-medium"
                    title="Launch MCQ Assessments Engine"
                  >
                    Open engine <ChevronRight size={16} />
                  </button>
                ) : tier.sampleId && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/problem/${tier.sampleId}`);
                    }}
                    className="p-2 rounded-xl bg-surface-elevated group-hover:bg-accent text-text-muted group-hover:text-text-primary transition-all"
                    title="Launch arena"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )))
        }
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition cursor-pointer shadow"
          >
            Close Manager
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AssessmentManagerModal;
