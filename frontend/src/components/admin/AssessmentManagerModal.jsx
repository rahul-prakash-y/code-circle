import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Award, Code2, CheckCircle2, ChevronRight, BookOpen, Layers, Plus } from 'lucide-react';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
      title: 'Easy Assessment Level',
      difficulty: 'Easy',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Foundational syntax, array manipulation, and basic algorithmic logic.',
      count: easyProblems.length,
      sampleId: easyProblems[0]?._id,
    },
    {
      level: 'Tier 2',
      title: 'Medium Assessment Level',
      difficulty: 'Medium',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Intermediate data structures, trees, graphs, sorting, and dynamic logic.',
      count: mediumProblems.length,
      sampleId: mediumProblems[0]?._id,
    },
    {
      level: 'Tier 3',
      title: 'Hard Assessment Level',
      difficulty: 'Hard',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      description: 'Complex dynamic programming, graph theory, and competitive time bounds.',
      count: hardProblems.length,
      sampleId: hardProblems[0]?._id,
    },
    {
      level: 'Specialized',
      title: 'Quiz & Conceptual Track',
      difficulty: 'Quiz',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: 'Timed multi-choice concept assessments covering web, system design & CS fundamentals.',
      count: quizzes.length,
      sampleId: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl glass border border-border p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Glow ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">Assessment Levels & Tracks</h2>
              <p className="text-xs text-text-muted">Manage coding challenges and knowledge evaluation tiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Total Levels</span>
            <span className="text-2xl font-black text-text-primary">{assessmentTiers.length} Tracks</span>
          </div>
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Coding Problems</span>
            <span className="text-2xl font-black text-accent-muted">{problems.length} Available</span>
          </div>
          <div className="p-4 bg-surface-elevated border border-border rounded-2xl text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block">Quizzes</span>
            <span className="text-2xl font-black text-purple-400">{quizzes.length} Modules</span>
          </div>
        </div>

        {/* Assessment Tiers List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
          {assessmentTiers.map((tier, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-elevated border border-border hover:border-white/15 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${tier.badgeColor}`}>
                    {tier.level}
                  </span>
                  <h4 className="text-sm font-bold text-text-primary group-hover:text-purple-400 transition-colors">
                    {tier.title}
                  </h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{tier.description}</p>
              </div>

              <div className="text-right flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-black text-text-primary">{tier.count}</span>
                  <span className="text-[10px] text-text-muted block uppercase font-bold">Items</span>
                </div>
                {tier.difficulty === 'Quiz' ? (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAssessments) onOpenAssessments();
                    }}
                    className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-text-primary transition-all flex items-center gap-1 text-xs font-bold"
                    title="Launch MCQ Assessments Engine"
                  >
                    Open Engine <ChevronRight size={16} />
                  </button>
                ) : tier.sampleId && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/problem/${tier.sampleId}`);
                    }}
                    className="p-2 rounded-xl bg-surface-elevated group-hover:bg-accent text-text-muted group-hover:text-text-primary transition-all"
                    title="Launch Arena"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3 relative z-10">
          <button
            onClick={onClose}
            className="btn-primary text-xs"
          >
            Close Manager
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentManagerModal;
