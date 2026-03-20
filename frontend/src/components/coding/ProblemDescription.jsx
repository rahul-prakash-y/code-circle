import React from 'react';
import { Play, Trophy } from 'lucide-react';

const ProblemDescription = ({ problem }) => {
  return (
    <div className="p-8 space-y-10">
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Play size={14} className="rotate-90" />
          </div>
          Objective
        </h2>
        <div className="text-slate-300 leading-relaxed space-y-4 font-medium">
          {problem.description.split('\n').map((para, i) => (
            <p key={i} className="text-sm">{para}</p>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Trophy size={14} />
          </div>
          Scenarios
        </h2>
        
        <div className="space-y-6">
          {problem.testCases.map((tc, index) => (
            <div key={index} className="stellar-glass p-6 space-y-4 group hover:border-blue-500/30 transition-all duration-500">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Input Vector</span>
                <pre className="bg-black/40 p-4 rounded-xl border border-white/5 text-[11px] text-blue-400 font-mono whitespace-pre-wrap shadow-inner">
                  {tc.input}
                </pre>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Output</span>
                <pre className="bg-black/40 p-4 rounded-xl border border-white/5 text-[11px] text-emerald-400 font-mono whitespace-pre-wrap shadow-inner">
                  {tc.expectedOutput}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemDescription;
