import React, { useEffect } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import { motion } from 'framer-motion';

const PodiumItem = ({ user, rank, delay }) => {
  const colors = {
    1: { border: 'border-yellow-400', glow: 'shadow-yellow-400/20', icon: Crown, text: 'text-yellow-400', height: 'h-48' },
    2: { border: 'border-slate-300', glow: 'shadow-slate-300/20', icon: Medal, text: 'text-slate-300', height: 'h-40' },
    3: { border: 'border-amber-600', glow: 'shadow-amber-600/20', icon: Medal, text: 'text-amber-600', height: 'h-32' }
  };
  
  const config = colors[rank];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.8 }}
      className="flex flex-col items-center group"
    >
      <div className="relative mb-4">
        <div className={`w-24 h-24 rounded-full border-4 ${config.border} p-1 overflow-hidden bg-white/5 ${config.glow} shadow-2xl transition-transform group-hover:scale-110 duration-500`}>
          {user.profilePicUrl ? (
            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 text-2xl font-bold">
              {user.name[0]}
            </div>
          )}
        </div>
        <div className={`absolute -top-4 -right-2 bg-slate-900 rounded-full p-2 border border-white/10 ${config.text}`}>
          <Icon size={20} />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white">
          #{rank}
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="text-white font-bold truncate max-w-[120px]">{user.name}</h4>
        <p className="text-white/50 text-xs mb-4">{user.rollNo}</p>
        
        {/* Podium Base */}
        <div className={`w-32 ${config.height} bg-linear-to-b from-white/10 to-transparent rounded-t-2xl border-t border-x border-white/20 flex flex-col items-center justify-end pb-4`}>
          <div className={`text-xl font-black ${config.text}`}>{user.totalPoints}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Points</div>
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3, 50);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2"
        >
          <Trophy size={32} />
        </motion.div>
        <h2 className="text-4xl font-black text-white tracking-tight">Code Circle <span className="text-indigo-500">Hall of Fame</span></h2>
        <p className="text-white/40">The elite developers recognized by their absolute performance and consistency.</p>
      </div>

      {/* Podium Section */}
      {top3.length > 0 && (
        <div className="flex flex-wrap justify-center items-end gap-4 md:gap-12 pt-8">
          {/* Rank 2 */}
          {top3[1] && <PodiumItem user={top3[1]} rank={2} delay={0.2} />}
          {/* Rank 1 */}
          {top3[0] && <PodiumItem user={top3[0]} rank={1} delay={0} />}
          {/* Rank 3 */}
          {top3[2] && <PodiumItem user={top3[2]} rank={3} delay={0.4} />}
        </div>
      )}

      {/* Others List */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 px-8 py-4 bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/40">
          <div className="col-span-1">Rank</div>
          <div className="col-span-6 md:col-span-7">Student</div>
          <div className="col-span-2 hidden md:block text-center">Solved</div>
          <div className="col-span-3 md:col-span-2 text-right">Points</div>
        </div>
        
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
          {others.map((user, index) => (
            <motion.div 
              key={user._id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              className="grid grid-cols-12 px-8 py-4 items-center group transition-colors"
            >
              <div className="col-span-1 font-mono text-white/40 group-hover:text-white transition-colors">
                #{index + 4}
              </div>
              <div className="col-span-6 md:col-span-7 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10">
                  {user.profilePicUrl ? (
                    <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {user.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors">{user.name}</div>
                  <div className="text-[10px] text-white/30">{user.rollNo}</div>
                </div>
              </div>
              <div className="col-span-2 hidden md:flex items-center justify-center gap-1 text-white/60">
                <Star size={12} className="text-indigo-400" />
                <span className="text-sm">{user.problemsSolved}</span>
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="text-indigo-400 font-bold">{user.totalPoints}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
