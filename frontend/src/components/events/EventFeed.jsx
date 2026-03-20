import React, { useEffect, useState } from 'react';
import useEventStore from '../../store/useEventStore';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import EventCard from './EventCard';
import { Search, Filter, CalendarCheck, History, LayoutGrid, List, Calendar } from 'lucide-react';

const EventFeed = ({ isAdmin = false, onEdit, onDelete }) => {
  const { upcomingEvents, pastEvents, loading, fetchEvents } = useEventStore();
  const { fetchMyEnrollments } = useEnrollmentStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchEvents(activeTab);
    fetchMyEnrollments();
  }, [activeTab, fetchEvents, fetchMyEnrollments]);

  const eventsToDisplay = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
  
  const filteredEvents = eventsToDisplay.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SkeletonCard = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-[280px] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-24 h-6 bg-white/10 rounded-full" />
        <div className="w-16 h-6 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="w-12 h-12 bg-white/10 rounded-lg mb-2" />
        <div className="w-3/4 h-6 bg-white/10 rounded-md" />
        <div className="w-full h-4 bg-white/10 rounded-md" />
        <div className="w-full h-4 bg-white/10 rounded-md" />
      </div>
      <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="w-24 h-8 bg-white/10 rounded-md" />
        <div className="w-24 h-10 bg-white/10 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Code Circle Events</h2>
          <p className="text-slate-400">Discover coding hackathons, workshops, and tech talks.</p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-300 font-bold text-sm ${
              activeTab === 'upcoming' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarCheck size={18} />
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-300 font-bold text-sm ${
              activeTab === 'past' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History size={18} />
            Past Events
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all backdrop-blur-sm"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden md:flex items-center gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
               onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          
          <div className="flex-1 md:flex-none">
             <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
              <Filter size={18} />
              Filter
             </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard 
                key={event._id} 
                event={event} 
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="col-span-full stellar-glass p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-20" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No events found matching your criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFeed;
