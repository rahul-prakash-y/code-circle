import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ProblemDescription from './ProblemDescription';
import CodeEditor from './CodeEditor';
import Console from './Console';
import useCodingStore from '../../store/useCodingStore';
import useAntiCheat from '../../hooks/useAntiCheat';
import AntiCheatModal from './AntiCheatModal';
import { Loader2, Play, ChevronLeft, Star } from 'lucide-react';
import StellarBackground from '../ui/StellarBackground';

const CodingWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProblem, fetchProblemById, submitCode, isLoading, submissionResult } = useCodingStore();
  const [code, setCode] = useState('// Write your code here...');
  const [languageId, setLanguageId] = useState(63); // Default JavaScript
  const [showConsole, setShowConsole] = useState(true);

  const { warnings, isLocked } = useAntiCheat(3, () => {
    console.log('Workspace locked due to anti-cheat trigger');
  });

  useEffect(() => {
    fetchProblemById(id);
  }, [id, fetchProblemById]);

  const handleSubmit = async () => {
    try {
      await submitCode(id, code, languageId);
      setShowConsole(true);
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  if (!currentProblem) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-300 flex flex-col overflow-hidden font-sans relative">
      <StellarBackground />
      
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-[1px] bg-white/5" />
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none mt-0.5">{currentProblem.title}</h1>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-xl ${
              currentProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              currentProblem.difficulty === 'Medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
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
              className="stellar-input !py-1.5 !px-4 !text-[10px] !font-black !uppercase !tracking-widest !bg-white/5 !border-white/5 group-hover:!border-blue-500/30 transition-all cursor-pointer appearance-none pr-10"
            >
              <option value={63} className="bg-slate-950">JavaScript</option>
              <option value={62} className="bg-slate-950">Java</option>
              <option value={71} className="bg-slate-950">Python</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-blue-500 transition-colors">
              <Star size={12} strokeWidth={3} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="stellar-btn !py-2 !px-6 !text-[10px] !uppercase !tracking-widest flex items-center gap-2 group/run"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Play size={12} strokeWidth={3} className="group-hover/run:scale-110 transition-transform" />
            )}
            <span>{isLoading ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full overflow-y-auto custom-scrollbar stellar-glass !rounded-none !border-y-0 !border-l-0 border-r border-white/5 bg-slate-950/20">
              <ProblemDescription problem={currentProblem} />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-white/[0.02] hover:bg-blue-500/30 transition-all duration-300 relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-hover:bg-blue-400 transition-colors" />
          </PanelResizeHandle>
          
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <div className="h-full bg-[#0a0a0c]">
                  <CodeEditor code={code} setCode={setCode} languageId={languageId} />
                </div>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-white/[0.02] hover:bg-blue-500/30 transition-all duration-300 relative group">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/5 group-hover:bg-blue-400 transition-colors" />
              </PanelResizeHandle>
              
              <Panel collapsible={true} defaultSize={30} minSize={10}>
                <div className="h-full bg-slate-950/40 border-t border-white/5 overflow-hidden">
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
