import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

const AntiCheatModal = ({ warnings, isLocked }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`max-w-md w-full glass-morphic-dark border ${
        isLocked ? 'border-red-500/30' : 'border-yellow-500/30'
      } p-8 rounded-2xl shadow-2xl relative overflow-hidden`}>
        {/* Glow effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[100px] ${
          isLocked ? 'bg-red-500/20' : 'bg-yellow-500/20'
        }`} />
        
        <div className="relative text-center">
          <div className="flex justify-center mb-6">
            {isLocked ? (
              <div className="p-4 bg-red-500/10 rounded-full">
                <Lock className="text-red-500" size={48} />
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 rounded-full">
                <AlertCircle className="text-yellow-500" size={48} />
              </div>
            )}
          </div>

          <h2 className={`text-2xl font-black mb-4 uppercase tracking-tighter ${
            isLocked ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {isLocked ? 'Workspace Locked' : 'Anti-Cheat Warning'}
          </h2>

          <p className="text-gray-300 mb-8 font-medium leading-relaxed">
            {isLocked 
              ? 'You have exceeded the maximum number of tab switches. Your progress has been logged and the workspace is now locked.'
              : `Switching tabs is not allowed during this session. This is warning ${warnings} of 3.`
            }
          </p>

          {isLocked ? (
            <div className="space-y-4">
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Action Required</p>
              <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all transform hover:scale-[1.02] shadow-lg shadow-red-600/20">
                Contact Administrator
              </button>
            </div>
          ) : (
            <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10">
              I Understand, Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AntiCheatModal;
