import React, { useEffect, useState } from 'react';
import useEventStore from '../../store/useEventStore';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import EventCard from './EventCard';
import { Search, Filter, CalendarCheck, History, LayoutGrid, List, Calendar, Radio, Activity, Sparkles } from 'lucide-react';

const EVENT_TYPES = ['all', 'Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['all', 'Individual', 'Team'];

const EventFeed = ({ isAdmin = false, onEdit, onDelete }) => {
  const { events, upcomingEvents, pastEvents, loading, fetchEvents } = useEventStore();
  const { fetchMyEnrollments } = useEnrollmentStore();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'live', 'past', 'all'
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents({
      status: activeTab === 'all' ? undefined : activeTab,
      type: selectedType !== 'all' ? selectedType : undefined,
      format: selectedFormat !== 'all' ? selectedFormat : undefined,
      search: searchQuery || undefined,
    });
    fetchMyEnrollments();
  }, [activeTab, selectedType, selectedFormat, fetchEvents, fetchMyEnrollments]);

  // Determine list of events
  let eventsToDisplay = events;
  if (activeTab === 'upcoming') {
    eventsToDisplay = upcomingEvents && upcomingEvents.length > 0
      ? upcomingEvents
      : events.filter((e) => e.status !== 'Completed' && e.status !== 'Cancelled');
  } else if (activeTab === 'past') {
    eventsToDisplay = pastEvents && pastEvents.length > 0
      ? pastEvents
      : events.filter((e) => e.status === 'Completed');
  } else if (activeTab === 'live') {
    eventsToDisplay = events.filter((e) => e.status === 'Live');
  }

  const filteredEvents = eventsToDisplay.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.venueOrLink && event.venueOrLink.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesFormat =
      selectedFormat === 'all' ||
      event.format === selectedFormat ||
      (selectedFormat === 'Team' && event.type === 'Team') ||
      (selectedFormat === 'Individual' && event.type === 'Individual');

    return matchesSearch && matchesType && matchesFormat;
  });

  const SkeletonCard = () => (
    <div className="glass p-8 h-[280px] animate-pulse rounded-3xl">
      <div className="flex justify-between mb-4">
        <div className="w-24 h-6 bg-surface-elevated rounded-full" />
        <div className="w-16 h-6 bg-surface-elevated rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="w-12 h-12 bg-surface-elevated rounded-xl mb-2" />
        <div className="w-3/4 h-6 bg-surface-elevated rounded-md" />
        <div className="w-full h-4 bg-surface-elevated rounded-md" />
        <div className="w-full h-4 bg-surface-elevated rounded-md" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-3xl font-black text-text-primary tracking-tight">Events Arena</h2>
          </div>
          <p className="text-text-muted text-sm font-medium">Discover workshops, lectures, hackathons, and technical sprints.</p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 glass rounded-2xl overflow-x-auto">
          {[
            { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
            { id: 'live', label: 'Live Now', icon: Activity },
            { id: 'past', label: 'Past / Archive', icon: History },
            { id: 'all', label: 'All Events', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-black uppercase tracking-wider text-xs whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-xl shadow-white/10'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              <tab.icon size={14} className={tab.id === 'live' && activeTab === tab.id ? 'text-red-500 animate-pulse' : ''} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search events by title, description, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-2xl pl-11 pr-4 py-2.5 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-surface-elevated border border-border p-1 rounded-2xl">
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedType === type
                    ? 'bg-blue-500 text-text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 bg-surface-elevated border border-border p-1 rounded-2xl">
            {EVENT_FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedFormat === format
                    ? 'bg-purple-600 text-text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {format === 'all' ? 'All Formats' : format === 'Individual' ? 'Solo' : 'Squad'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
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
            <div className="col-span-full glass p-16 text-center rounded-3xl">
              <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
              <p className="text-text-primary font-black text-sm uppercase tracking-widest">No events found matching your criteria</p>
              <p className="text-text-muted text-xs mt-1">Try switching tabs or resetting the type and format filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFeed;
