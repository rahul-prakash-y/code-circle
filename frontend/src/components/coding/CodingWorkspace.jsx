import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ProblemDescription from './ProblemDescription';
import CodeEditor from './CodeEditor';
import Console from './Console';
import useCodingStore from '../../store/useCodingStore';
import useAntiCheat from '../../hooks/useAntiCheat';
import AntiCheatModal from './AntiCheatModal';

const CodingWorkspace = () => {
  const { id } = useParams();
  const { currentProblem, fetchProblemById, submitCode, isLoading, submissionResult } = useCodingStore();
  const [code, setCode] = useState('// Write your code here...');
  const [languageId, setLanguageId] = useState(63); // Default JavaScript
  const [, setShowConsole] = useState(true);

  const { warnings, isLocked } = useAntiCheat(3, () => {
    // Auto-submit or lock logic
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

  if (!currentProblem) return <div className="p-8 text-white">Loading problem...</div>;

  return (
    <div className="h-screen bg-[#0a0a0c] text-secondary flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{currentProblem.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            currentProblem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
            currentProblem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {currentProblem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={languageId} 
            onChange={(e) => setLanguageId(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value={63}>JavaScript</option>
            <option value={62}>Java</option>
            <option value={71}>Python</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded transition-all font-medium disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize="40" minSize="20">
            <div className="h-full overflow-y-auto custom-scrollbar bg-white/5 border-r border-white/10">
              <ProblemDescription problem={currentProblem} />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-white/5 hover:bg-primary/50 transition-colors cursor-col-resize" />
          
          <Panel defaultSize="60" minSize="30">
            <PanelGroup orientation="vertical">
              <Panel defaultSize="70" minSize="20">
                <div className="h-full">
                  <CodeEditor code={code} setCode={setCode} languageId={languageId} />
                </div>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-white/5 hover:bg-primary/50 transition-colors cursor-row-resize" />
              
              <Panel collapsible={true} defaultSize="30" minSize="10" onCollapse={() => setShowConsole(false)} onExpand={() => setShowConsole(true)}>
                <div className="h-full bg-[#0d0d0f] border-t border-white/10 overflow-hidden">
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
