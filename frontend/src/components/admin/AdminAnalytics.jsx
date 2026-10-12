import React, { useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import useThemeStore from '../../store/useThemeStore';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.01 }}
    className="bg-surface border border-separator/80 p-6 rounded-2xl relative overflow-hidden group shadow-card hover:shadow-card-elevated transition-all"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-15 dark:opacity-25 ${color}`} />
    
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-surface-secondary border border-separator text-label-primary shadow-sm">
        <Icon size={22} />
      </div>
      {trend && (
        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <ArrowUpRight size={13} className="mr-1" />
          {trend}
        </span>
      )}
    </div>
    
    <h3 className="text-label-secondary text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
    <div className="text-3xl font-bold text-label-primary tracking-tight mb-3">{value}</div>
    
    <div className="w-full h-1.5 bg-separator/60 dark:bg-white/10 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '70%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full ${color.replace('bg-', 'bg-opacity-100 bg-')}`} 
      />
    </div>
  </motion.div>
);

const AdminAnalytics = () => {
  const { 
    dashboardStats, 
    growthData, 
    loading, 
    fetchDashboardStats 
  } = useAnalyticsStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading || !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-label-primary flex items-center gap-2">
          <TrendingUp className="text-accent" size={24} />
          Dashboard Analytics
        </h2>
        <p className="text-label-secondary text-xs sm:text-sm mt-0.5">Real-time performance and participation tracking</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={dashboardStats.totalUsers ?? dashboardStats.totalStudents} 
          icon={Users} 
          color="bg-blue-500" 
          trend="+12%"
        />
        <StatCard 
          title="Active Events" 
          value={dashboardStats.activeEvents ?? dashboardStats.upcomingEvents} 
          icon={Calendar} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Events" 
          value={dashboardStats.totalEvents} 
          icon={Calendar} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Assessment Levels" 
          value={`${dashboardStats.totalAssessmentLevels || 3} Tracks`} 
          icon={CheckCircle} 
          color="bg-emerald-500" 
          trend="+Active"
        />
      </div>

      {/* Participation Chart */}
      <div className="bg-surface border border-separator/80 p-6 sm:p-8 rounded-3xl shadow-card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-label-primary">Participation Trends</h3>
            <p className="text-label-secondary text-xs sm:text-sm mt-0.5">Event attendance over the last 6 months</p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#38bdf8' : '#0071E3'} stopOpacity={isDark ? 0.35 : 0.2}/>
                  <stop offset="95%" stopColor={isDark ? '#38bdf8' : '#0071E3'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} 
                vertical={false} 
              />
              <XAxis 
                dataKey="monthName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isDark ? '#A1A1A6' : '#86868B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isDark ? '#A1A1A6' : '#86868B', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', 
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', 
                  borderRadius: '14px',
                  color: isDark ? '#F5F5F7' : '#1D1D1F',
                  boxShadow: isDark
                    ? '0 12px 36px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                  padding: '10px 14px',
                }}
                labelStyle={{
                  color: isDark ? '#F5F5F7' : '#1D1D1F',
                  fontWeight: 600,
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
                itemStyle={{ color: isDark ? '#38bdf8' : '#0071E3', fontSize: '12px', fontWeight: 500 }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={isDark ? '#38bdf8' : '#0071E3'} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
