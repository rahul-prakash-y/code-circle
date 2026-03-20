import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, ArrowRight, ShieldCheck, Key, Plus, ListFilter, UserCheck } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import { format } from 'date-fns';

const AttendanceManager = () => {
  const { upcomingEvents, fetchEvents, loading } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  useEffect(() => {
    fetchEvents('upcoming');
  }, [fetchEvents]);

  const handleOpenAttendance = (event) => {
    setSelectedEvent(event);
    setIsAttendanceOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Attendance Intelligence</h2>
          <p className="text-slate-400 font-medium">Generate OTPs and track real-time student presence.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
           <UserCheck size={14} />
           Administrative View
        </div>
      </div>

      {/* Events Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => (
          <div 
            key={event._id}
            onClick={() => handleOpenAttendance(event)}
            className="group relative stellar-glass p-6 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
          >
            {/* Background Icon */}
            <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-blue-500/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <Calendar size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {format(new Date(event.date), 'MMM dd')}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-6">
                  {event.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Users size={14} className="text-blue-400" />
                    <span>Manage</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Key size={14} className="text-emerald-400" />
                    <span>OTP</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
                  <Plus size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {upcomingEvents.length === 0 && !loading && (
          <div className="col-span-full stellar-glass p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-20" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active events found to manage</p>
          </div>
        )}
      </div>

      {/* Attendance Modal Reused */}
      <AttendanceDashboard 
        isOpen={isAttendanceOpen} 
        onClose={() => setIsAttendanceOpen(false)} 
        event={selectedEvent} 
      />
    </div>
  );
};

export default AttendanceManager;
