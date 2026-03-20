import React, { useEffect } from 'react';
import { Trophy, Medal, Crown, Star, Loader2 } from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import { motion } from 'framer-motion';

const PodiumItem = ({ user, rank, delay }) => {
  const colors = {
    1: { border: 'border-blue-400', glow: 'shadow-blue-400/20', icon: Crown, text: 'text-blue-400', gradient: 'from-blue-500/20', height: 'h-52' },
    2: { border: 'border-white/20', glow: 'shadow-white/10', icon: Medal, text: 'text-slate-300', gradient: 'from-white/10', height: 'h-44' },
    3: { border: 'border-blue-900/40', glow: 'shadow-blue-900/10', icon: Medal, text: 'text-blue-900', gradient: 'from-blue-900/20', height: 'h-36' }
  };
  
  const config = colors[rank];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center group relative pt-10"
    >
      <div className="relative mb-6 z-10">
        <div className={`w-28 h-28 rounded-[2.5rem] border-2 ${config.border} p-1 overflow-hidden stellar-glass ${config.glow} shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-2`}>
          <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
            {user.profilePicUrl ? (
              <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-400 text-3xl font-black uppercase">
                {user.name[0]}
              </div>
            )}
          </div>
        </div>
        <div className={`absolute -top-6 -right-2 bg-black border border-white/10 rounded-xl p-2.5 ${config.text} shadow-2xl`}>
          <Icon size={20} strokeWidth={3} />
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-xl shadow-blue-500/40">
          RANK {rank}
        </div>
      </div>
      
      <div className="text-center w-full">
        <h4 className="text-white font-black truncate max-w-[140px] uppercase tracking-tight text-lg leading-none mb-2">{user.name}</h4>
        
        {/* Podium Base */}
        <div className={`w-40 ${config.height} bg-linear-to-b ${config.gradient} to-transparent rounded-[2.5rem] border-t border-x border-white/10 stellar-glass flex flex-col items-center justify-end pb-8 gap-1 shadow-2xl shadow-black/80`}>
          <div className={`text-3xl font-black ${config.text} tracking-tighter`}>{user.totalPoints}</div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-black">Credits</div>
        </div>
      </div>
    </motion.div>
  );
};

const Leaderboard = () => {
  const { leaderboard, loading, fetchLeaderboard } = useAnalyticsStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 px-6">
      {/* Title */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="inline-flex p-4 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
        >
          <Trophy size={40} strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Code Circle <span className="text-blue-500 ml-2">Hall of Fame</span></h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-xl mx-auto leading-relaxed">The elite developers recognized by their performance, consistency, and absolute commitment to code.</p>
      </div>

      {/* Podium Section */}
      {top3.length > 0 && (
        <div className="flex flex-wrap justify-center items-end gap-10 md:gap-16 pt-12">
          {top3[1] && <PodiumItem user={top3[1]} rank={2} delay={0.2} />}
          {top3[0] && <PodiumItem user={top3[0]} rank={1} delay={0} />}
          {top3[2] && <PodiumItem user={top3[2]} rank={3} delay={0.4} />}
        </div>
      )}

      {/* Others List */}
      <div className="stellar-glass overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-12 px-10 py-6 bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <div className="col-span-1">Pos</div>
          <div className="col-span-6 md:col-span-7">Operator</div>
          <div className="col-span-2 hidden md:block text-center whitespace-nowrap">Solutions</div>
          <div className="col-span-3 md:col-span-2 text-right">Points</div>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {others.map((user, index) => (
            <motion.div 
              key={user._id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="grid grid-cols-12 px-10 py-6 items-center group hover:bg-white/5 transition-all duration-500 border-b border-white/[0.02] last:border-none"
            >
              <div className="col-span-1 font-black text-slate-600 group-hover:text-blue-400 transition-colors text-sm">
                #{index + 4}
              </div>
              <div className="col-span-6 md:col-span-7 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-blue-500/30 transition-all duration-500">
                  {user.profilePicUrl ? (
                    <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-400 font-black text-base uppercase">
                      {user.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-black text-base uppercase tracking-tight group-hover:text-blue-400 transition-colors duration-500">{user.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.rollNo}</div>
                </div>
              </div>
              <div className="col-span-2 hidden md:flex items-center justify-center gap-2 text-slate-400 font-bold text-sm">
                <Star size={14} className="text-blue-500/50" />
                <span>{user.problemsSolved}</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="text-white font-black text-lg group-hover:text-blue-500 transition-colors duration-500">{user.totalPoints}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
