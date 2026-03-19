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
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-xl"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${color}`} />
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg bg-white/5 border border-white/10 text-white`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
          <ArrowUpRight size={14} className="mr-1" />
          {trend}
        </span>
      )}
    </div>
    
    <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
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

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading || !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-indigo-400" />
          Dashboard Analytics
        </h2>
        <p className="text-white/50 text-sm">Real-time performance and participation tracking</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={dashboardStats.totalStudents} 
          icon={Users} 
          color="bg-blue-500" 
          trend="+12%"
        />
        <StatCard 
          title="Total Events" 
          value={dashboardStats.totalEvents} 
          icon={Calendar} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Upcoming Events" 
          value={dashboardStats.upcomingEvents} 
          icon={Calendar} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${dashboardStats.attendancePercentage}%`} 
          icon={CheckCircle} 
          color="bg-emerald-500" 
          trend="+5%"
        />
      </div>

      {/* Participation Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Participation Trends</h3>
            <p className="text-white/50 text-sm">Event attendance over the last 6 months</p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="monthName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff60', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff60', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1b4b', 
                  borderColor: '#ffffff10', 
                  borderRadius: '12px',
                  color: '#fff' 
                }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
