import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, XCircle, Clock, Star, Play, Sparkles } from 'lucide-react';
import { EMIL_EASE_OUT, DURATION_MODAL } from '../../lib/motion';

const Console = ({ result }) => {
  return (
    <div className="h-full flex flex-col bg-[#000000] text-neutral-200 overflow-hidden select-none font-mono">
      {/* Apple Spatial Window Frame Header */}
      <div className="h-10 px-4 bg-[#0A0A0A] border-b border-white/[0.08] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Apple Traffic Light Dots */}
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-xs" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-xs" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-xs" />
          <span className="text-[11px] text-neutral-400 font-medium ml-2 tracking-tight">
            Terminal · Execution Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-neutral-400 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OLED True Black
          </span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar leading-relaxed space-y-6">
        {!result ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-neutral-500 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-neutral-400">
              <Terminal size={28} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium tracking-tight">
              Awaiting execution · Click 'Run' to evaluate test cases
            </span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
            className="space-y-6"
          >
            {/* Status Pill */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div
                className={`p-2 rounded-lg ${
                  result.status === 'Accepted'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {result.status === 'Accepted' ? (
                  <CheckCircle2 size={18} strokeWidth={2.2} />
                ) : (
                  <XCircle size={18} strokeWidth={2.2} />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Test Execution Result
                </div>
                <div
                  className={`text-sm font-bold tracking-tight uppercase ${
                    result.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {result.status}
                </div>
              </div>
            </div>

            {/* Test sequence cases */}
            <div className="space-y-4">
              {result.results?.map((res, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Evaluation Sequence
                      </div>
                      <div className="text-white font-bold tabular-nums text-xs">
                        Test Case #{index + 1}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        res.status === 'Accepted'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {res.stdout && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                          Stdout
                        </div>
                        <pre className="bg-[#050505] p-3 rounded-xl border border-white/[0.06] text-neutral-300 font-mono text-[11px] whitespace-pre-wrap">
                          {res.stdout}
                        </pre>
                      </div>
                    )}

                    {res.stderr && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-rose-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          Stderr
                        </div>
                        <pre className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 text-rose-300 font-mono text-[11px] whitespace-pre-wrap">
                          {res.stderr}
                        </pre>
                      </div>
                    )}

                    <div className="pt-2 flex gap-5 text-[11px] font-medium uppercase tracking-wider text-neutral-400 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-neutral-500" />
                        <span>{res.time}s</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-neutral-500" />
                        <span>{(res.memory / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Console;
