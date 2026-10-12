import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ProblemDescription from './ProblemDescription';
import CodeEditor from './CodeEditor';
import Console from './Console';
import useCodingStore from '../../store/useCodingStore';
import useAntiCheat from '../../hooks/useAntiCheat';
import AntiCheatModal from './AntiCheatModal';
import { Loader2, Play, ChevronLeft, Star, Clock, FileText, Code2, Terminal } from 'lucide-react';
import BackgroundGradient from '../ui/BackgroundGradient';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const CodingWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProblem, fetchProblemById, submitCode, isLoading, submissionResult } = useCodingStore();
  const [code, setCode] = useState('// Write your code here...');
  const [languageId, setLanguageId] = useState(63); // Default JavaScript
  const [showConsole, setShowConsole] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mobileTab, setMobileTab] = useState('problem'); // 'problem' | 'code' | 'console'

  const { warnings, isLocked } = useAntiCheat(3, () => {
    console.log('Workspace locked due to anti-cheat trigger');
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    fetchProblemById(id);
  }, [id, fetchProblemById]);

  const handleSubmit = async () => {
    if (cooldown > 0 || isLoading) return;
    try {
      setCooldown(10); // Enforce 10s cooldown on run
      await submitCode(id, code, languageId);
      setShowConsole(true);
      if (isMobile) setMobileTab('console');
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  if (!currentProblem) return (
    <div className="h-screen bg-surface flex items-center justify-center">
      <Loader2 className="animate-spin text-accent" size={40} />
    </div>
  );

  return (
    <div className="h-screen bg-surface text-text-secondary flex flex-col overflow-hidden font-sans relative">
      <BackgroundGradient />

      {/* Desktop Header (>= 1024px) */}
      <div className="hidden lg:flex h-16 border-b border-border items-center justify-between px-6 bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 hover:bg-surface-elevated rounded-xl text-text-muted hover:text-text-primary transition-all border border-transparent hover:border-border cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-[1px] bg-surface-elevated" />
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black text-text-primary uppercase tracking-widest leading-none mt-0.5">{currentProblem.title}</h1>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-xl ${
              currentProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              currentProblem.difficulty === 'Medium' ? 'bg-accent/10 text-accent-muted border-accent/20' :
              'bg-pink-500/10 text-pink-400 border-pink-500/20'
            }`}>
              {currentProblem.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <select 
              value={languageId} 
              onChange={(e) => setLanguageId(Number(e.target.value))}
              className="input-field !py-1.5 !px-4 !text-[10px] !font-black !uppercase !tracking-widest !bg-surface-elevated !border-border group-hover:!border-accent/30 transition-all cursor-pointer appearance-none pr-10"
            >
              <option value={63} className="bg-surface">JavaScript</option>
              <option value={62} className="bg-surface">Java</option>
              <option value={71} className="bg-surface">Python</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-accent transition-colors">
              <Star size={12} strokeWidth={3} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || cooldown > 0}
            className="btn-primary !py-2 !px-6 !text-[10px] !uppercase !tracking-widest flex items-center gap-2 group/run disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : cooldown > 0 ? (
              <Clock size={12} className="text-white/70 animate-pulse" />
            ) : (
              <Play size={12} strokeWidth={3} className="group-hover/run:scale-110 transition-transform" />
            )}
            <span>
              {isLoading
                ? 'Running...'
                : cooldown > 0
                ? `Execute (${cooldown}s)`
                : 'Execute'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Header (< 1024px) */}
      <div className="flex lg:hidden flex-col bg-surface/80 border-b border-border backdrop-blur-xl shrink-0 z-50">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 hover:bg-surface-elevated rounded-xl text-text-muted hover:text-text-primary transition-all border border-border shrink-0 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black text-text-primary truncate max-w-[130px] sm:max-w-xs">{currentProblem.title}</h1>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                  currentProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  currentProblem.difficulty === 'Medium' ? 'bg-accent/10 text-accent-muted border-accent/20' :
                  'bg-pink-500/10 text-pink-400 border-pink-500/20'
                }`}>
                  {currentProblem.difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={languageId}
              onChange={(e) => setLanguageId(Number(e.target.value))}
              className="bg-surface-elevated text-text-primary text-[11px] font-bold py-1 px-2 rounded-xl border border-border focus:outline-none cursor-pointer"
            >
              <option value={63}>JS</option>
              <option value={62}>Java</option>
              <option value={71}>Python</option>
            </select>

            <button
              onClick={handleSubmit}
              disabled={isLoading || cooldown > 0}
              className="btn-primary py-1.5 px-3 text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={12} />
              ) : cooldown > 0 ? (
                <Clock size={12} className="text-white/70 animate-pulse" />
              ) : (
                <Play size={12} />
              )}
              <span>{isLoading ? '...' : cooldown > 0 ? `${cooldown}s` : 'Run'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="px-3 py-1.5 bg-canvas/40 border-t border-border grid grid-cols-3 gap-1">
          <button
            onClick={() => setMobileTab('problem')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'problem' ? 'bg-surface text-text-primary shadow-xs border border-border' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText size={13} />
            <span>Problem</span>
          </button>
          <button
            onClick={() => setMobileTab('code')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'code' ? 'bg-accent text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Code2 size={13} />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setMobileTab('console')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'console' ? 'bg-surface text-text-primary shadow-xs border border-border' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Terminal size={13} />
            <span>Console</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Content Body (< 1024px) */}
      <div className="flex lg:hidden flex-1 overflow-hidden relative">
        {mobileTab === 'problem' && (
          <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 bg-surface/20">
            <ProblemDescription problem={currentProblem} />
          </div>
        )}
        {mobileTab === 'code' && (
          <div className="h-full w-full bg-[#0a0a0c]">
            <CodeEditor code={code} setCode={setCode} languageId={languageId} />
          </div>
        )}
        {mobileTab === 'console' && (
          <div className="h-full w-full bg-surface/40 overflow-hidden">
            <Console result={submissionResult} />
          </div>
        )}
      </div>

      {/* Desktop Main Workspace (>= 1024px) */}
      <div className="hidden lg:flex flex-1 relative">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full overflow-y-auto custom-scrollbar glass !rounded-none !border-y-0 !border-l-0 border-r border-border bg-surface/20">
              <ProblemDescription problem={currentProblem} />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-white/[0.02] hover:bg-accent-muted/30 transition-all duration-300 relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-surface-elevated group-hover:bg-blue-400 transition-colors" />
          </PanelResizeHandle>
          
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <div className="h-full bg-[#0a0a0c]">
                  <CodeEditor code={code} setCode={setCode} languageId={languageId} />
                </div>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-white/[0.02] hover:bg-accent-muted/30 transition-all duration-300 relative group">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-surface-elevated group-hover:bg-blue-400 transition-colors" />
              </PanelResizeHandle>
              
              <Panel collapsible={true} defaultSize={30} minSize={10}>
                <div className="h-full bg-surface/40 border-t border-border overflow-hidden">
                  <Console result={submissionResult} />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Anti-Cheat Modal */}
      {(warnings > 0 || isLocked) && (
        <AntiCheatModal warnings={warnings} isLocked={isLocked} />
      )}
    </div>
  );
};

export default CodingWorkspace;
