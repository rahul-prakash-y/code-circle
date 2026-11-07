import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ProblemDescription from './ProblemDescription';
import CodeEditor from './CodeEditor';
import Console from './Console';
import useCodingStore from '../../store/useCodingStore';
import useAntiCheat from '../../hooks/useAntiCheat';
import useFullScreenEnforcement from '../../hooks/useFullScreenEnforcement';
import AntiCheatModal from './AntiCheatModal';
import FullScreenEnforcementOverlay from '../assessments/FullScreenEnforcementOverlay';
import { Play, ChevronLeft, Clock, FileText, Code2, Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { HeroUISelect, HeroChip as Chip } from '../ui/HeroUIComponents';
import BackgroundGradient from '../ui/BackgroundGradient';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const CodingWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProblem, fetchProblemById, submitCode, isLoading, submissionResult } = useCodingStore();
  const [code, setCode] = useState('// Write your code here...');
  const [languageId, setLanguageId] = useState(63); // Default JavaScript
  const [cooldown, setCooldown] = useState(0);

  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mobileTab, setMobileTab] = useState('problem'); // 'problem' | 'code' | 'console'

  const { warnings, isLocked } = useAntiCheat(3, () => {
    console.log('Workspace locked due to anti-cheat trigger');
  });
  const { isFullscreen, requestFullscreen, toggleFullscreen } = useFullScreenEnforcement();

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
      if (isMobile) setMobileTab('console');
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  if (!currentProblem) return (
    <div className="h-[100dvh] min-h-[100dvh] bg-surface flex items-center justify-center">
      <Spinner size="lg" color="primary" />
    </div>
  );

  return (
    <div className="h-[100dvh] min-h-[100dvh] bg-surface text-text-secondary flex flex-col overflow-hidden font-sans relative">
      <BackgroundGradient />

      {/* Full-Screen Enforcement Overlay */}
      {!isLocked && (
        <FullScreenEnforcementOverlay
          isFullscreen={isFullscreen}
          onRequestFullscreen={requestFullscreen}
          title="Full Screen Mode Required"
          description="To preserve exam integrity and proctoring compliance, this problem workspace must be attended in full screen mode."
        />
      )}

      {/* Desktop Header (>= 1024px) */}
      <div className="hidden lg:flex h-16 border-b border-border items-center justify-between px-6 bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 hover:bg-surface-elevated rounded-xl text-text-muted hover:text-text-primary transition-all border border-transparent hover:border-border cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-[1px] bg-surface-elevated" />
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-text-primary tracking-tight leading-none mt-0.5">{currentProblem.title}</h1>
            <Chip
              size="sm"
              variant="flat"
              color={
                currentProblem.difficulty === 'Easy'
                  ? 'success'
                  : currentProblem.difficulty === 'Hard'
                  ? 'danger'
                  : 'warning'
              }
            >
              {currentProblem.difficulty}
            </Chip>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HeroUISelect
            value={String(languageId)}
            onChange={(val) => setLanguageId(Number(val))}
            options={[
              { value: '63', label: 'JavaScript' },
              { value: '62', label: 'Java' },
              { value: '71', label: 'Python' },
            ]}
            size="sm"
            className="w-36 shrink-0"
            placement="bottom-end"
          />

          <Button
            size="sm"
            color="primary"
            variant="solid"
            onPress={handleSubmit}
            isDisabled={isLoading || cooldown > 0}
            className="min-h-[38px] px-5 rounded-xl font-medium text-xs cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <Spinner size="sm" color="current" />
            ) : cooldown > 0 ? (
              <Clock size={13} className="text-white/70 animate-pulse" />
            ) : (
              <Play size={13} strokeWidth={2} />
            )}
            <span>
              {isLoading
                ? 'Running...'
                : cooldown > 0
                ? `Execute (${cooldown}s)`
                : 'Execute'}
            </span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            className="min-h-[38px] min-w-[38px] rounded-xl text-text-muted hover:text-text-primary bg-surface-elevated border border-border shrink-0 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>

      {/* Mobile Header (< 1024px) */}
      <div className="flex lg:hidden flex-col bg-surface/80 border-b border-border backdrop-blur-xl shrink-0 z-50">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 hover:bg-surface-elevated rounded-xl text-text-muted hover:text-text-primary transition-all border border-border shrink-0 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Back to dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-semibold text-text-primary tracking-tight truncate max-w-[130px] sm:max-w-xs">{currentProblem.title}</h1>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    currentProblem.difficulty === 'Easy'
                      ? 'success'
                      : currentProblem.difficulty === 'Hard'
                      ? 'danger'
                      : 'warning'
                  }
                  className="scale-90 origin-left"
                >
                  {currentProblem.difficulty}
                </Chip>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HeroUISelect
              value={String(languageId)}
              onChange={(val) => setLanguageId(Number(val))}
              options={[
                { value: '63', label: 'JS' },
                { value: '62', label: 'Java' },
                { value: '71', label: 'Python' },
              ]}
              size="sm"
              className="w-24 shrink-0"
              placement="bottom-end"
            />

            <Button
              size="sm"
              color="primary"
              variant="solid"
              onPress={handleSubmit}
              isDisabled={isLoading || cooldown > 0}
              className="min-h-[36px] px-3 rounded-xl font-medium text-xs cursor-pointer"
            >
              {isLoading ? (
                <Spinner size="sm" color="current" />
              ) : cooldown > 0 ? (
                <Clock size={12} className="text-white/70 animate-pulse" />
              ) : (
                <Play size={12} />
              )}
              <span>{isLoading ? '...' : cooldown > 0 ? `${cooldown}s` : 'Run'}</span>
            </Button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary bg-surface-elevated border border-border"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="px-3 py-1.5 bg-canvas/40 border-t border-border grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('problem')}
            className={`flex items-center justify-center gap-1.5 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-all cursor-pointer ${
              mobileTab === 'problem' ? 'bg-surface text-text-primary shadow-xs border border-border' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText size={13} />
            <span>Problem</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('code')}
            className={`flex items-center justify-center gap-1.5 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-all cursor-pointer ${
              mobileTab === 'code' ? 'bg-accent text-white shadow-xs font-semibold' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Code2 size={13} />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('console')}
            className={`flex items-center justify-center gap-1.5 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-all cursor-pointer ${
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

