import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, ArrowRight, ShieldCheck, Key, Plus, ListFilter, UserCheck } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import { format } from 'date-fns';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';

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
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">Attendance Intelligence</h2>
          <p className="text-text-muted font-medium">Generate OTPs and track real-time student presence.</p>
        </div>
        <Chip
          size="sm"
          color="accent"
          variant="flat"
          startContent={<UserCheck size={14} />}
          className="font-bold uppercase tracking-wider px-3.5 py-1.5"
        >
          Administrative View
        </Chip>
      </div>

      {/* Events Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => (
          <button
            type="button"
            key={event._id}
            onClick={() => handleOpenAttendance(event)}
            className="group relative glass p-6 hover:border-accent/30 transition-all cursor-pointer overflow-hidden text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Background Icon */}
            <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-blue-500/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent-muted border border-accent/20">
                    <Calendar size={20} />
                  </div>
                  <Chip size="sm" variant="flat" color="default" className="font-bold uppercase tracking-wider">
                    {format(new Date(event.date), 'MMM dd')}
                  </Chip>
                </div>
                <h3 className="text-xl font-black text-text-primary mb-2 group-hover:text-accent-muted transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-6">
                  {event.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <Users size={14} className="text-accent-muted" />
                    <span>Manage</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <Key size={14} className="text-emerald-400" />
                    <span>OTP</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-text-primary group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all">
                  <Plus size={20} />
                </div>
              </div>
            </div>
          </button>
        ))}
        
        {upcomingEvents.length === 0 && !loading && (
          <div className="col-span-full glass p-12 text-center">
            <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No active events found to manage</p>
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
