import React from 'react';
import { Terminal, CheckCircle2, XCircle, AlertCircle, Clock, Star } from 'lucide-react';

const Console = ({ result }) => {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <Terminal size={32} strokeWidth={1} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Idling... awaiting execution</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar font-mono text-sm leading-relaxed space-y-8">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg border ${
          result.status === 'Accepted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
        }`}>
          {result.status === 'Accepted' ? <CheckCircle2 size={18} strokeWidth={3} /> : <XCircle size={18} strokeWidth={3} />}
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Status</div>
          <div className={`text-lg font-black uppercase tracking-tighter ${result.status === 'Accepted' ? 'text-blue-400' : 'text-pink-400'}`}>
            {result.status}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {result.results.map((res, index) => (
          <div key={index} className="stellar-glass p-6 space-y-6 group hover:border-blue-500/30 transition-all duration-500">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Test Sequence</div>
                <div className="text-white font-black uppercase tracking-tight">Case 0{index + 1}</div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                res.status === 'Accepted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
              }`}>
                {res.status}
              </span>
            </div>
            
            <div className="space-y-4 text-[11px]">
              {res.stdout && (
                <div className="space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    Standard Output
                  </div>
                  <pre className="bg-black/40 p-4 rounded-xl border border-white/5 text-slate-300 font-mono whitespace-pre-wrap shadow-inner">{res.stdout}</pre>
                </div>
              )}
              
              {res.stderr && (
                <div className="space-y-2">
                  <div className="text-[9px] text-pink-500 uppercase font-black tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-pink-500 rounded-full" />
                    Error Stream
                  </div>
                  <pre className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/10 text-pink-300 font-mono whitespace-pre-wrap shadow-inner">{res.stderr}</pre>
                </div>
              )}

              <div className="pt-2 flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-blue-500/50" />
                  <span>Time / {res.time}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-blue-500/50" />
                  <span>Mem / {(res.memory / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Console;
