import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import useEventStore from '../../store/useEventStore';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import EventCard from './EventCard';
import EnrollmentModal from './EnrollmentModal';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import { 
  Search, 
  CalendarCheck, 
  History, 
  LayoutGrid, 
  List, 
  Calendar, 
  Activity, 
  Edit2, 
  Trash2, 
  Users, 
  Clock, 
  MapPin, 
  UserCheck, 
  ArrowUpRight 
} from 'lucide-react';

const EVENT_TYPES = ['all', 'Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['all', 'Individual', 'Team'];

export const EventFeed = ({
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const { events, upcomingEvents, pastEvents, loading, fetchEvents } = useEventStore();
  const { myEnrolledEventIds, fetchMyEnrollments } = useEnrollmentStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Selected event for enrollment / attendance modals triggered from table
  const [enrollEvent, setEnrollEvent] = useState(null);
  const [attendanceEvent, setAttendanceEvent] = useState(null);

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
    eventsToDisplay =
      upcomingEvents && upcomingEvents.length > 0
        ? upcomingEvents
        : events.filter((e) => e.status !== 'Completed' && e.status !== 'Cancelled');
  } else if (activeTab === 'past') {
    eventsToDisplay =
      pastEvents && pastEvents.length > 0
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-heading">
              Events Arena
            </h2>
          </div>
          <p className="text-text-muted text-xs sm:text-sm font-medium">
            Browse upcoming workshops, sprints, hackathons, and guest seminars.
          </p>
        </div>

        {/* Status Tabs & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 p-1 glass rounded-2xl overflow-x-auto">
            {[
              { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
              { id: 'live', label: 'Live', icon: Activity },
              { id: 'past', label: 'Archive', icon: History },
              { id: 'all', label: 'All', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <tab.icon size={13} className={tab.id === 'live' && activeTab === tab.id ? 'text-red-400 animate-pulse' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle (Grid vs Table) */}
          <div className="flex items-center gap-1 p-1 bg-surface-elevated border border-border rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            placeholder="Search events by title, description, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary placeholder-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-surface-elevated border border-border p-1 rounded-xl">
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-accent/15 text-accent border border-accent/25'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1 bg-surface-elevated border border-border p-1 rounded-xl">
            {EVENT_FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFormat === format
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {format === 'all' ? 'All Formats' : format === 'Individual' ? 'Solo' : 'Team'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Events Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass p-16 text-center rounded-3xl border border-border">
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
          <p className="text-text-primary font-bold text-sm tracking-wide">
            No events found matching your criteria
          </p>
          <p className="text-text-muted text-xs mt-1">
            Try switching filter tabs or resetting the search query.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View with AnimatePresence */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{ duration: 0.25 }}
              >
                <EventCard
                  event={event}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Data Table View with AnimatePresence and inline hover action buttons */
        <div className="glass overflow-hidden border-border/80 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated/60 border-b border-border/60">
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Event Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Schedule</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredEvents.map((event) => {
                    const isEnrolled = myEnrolledEventIds.includes(event._id);
                    return (
                      <motion.tr
                        key={event._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.25 } }}
                        transition={{ duration: 0.2 }}
                        className="group border-b border-border/40 even:bg-surface-elevated/25 odd:bg-transparent hover:bg-accent/5 transition-colors"
                      >
                        {/* Title & Venue */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                              <Calendar size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-text-primary truncate font-heading group-hover:text-accent transition-colors">
                                {event.title}
                              </h4>
                              <p className="text-xs text-text-muted truncate flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="shrink-0" />
                                <span>{event.venueOrLink || 'Online / Campus'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-semibold text-text-secondary whitespace-nowrap">
                          {format(new Date(event.date), 'MMM dd, yyyy')}
                        </td>

                        {/* Category Badges */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                              {event.type || 'Technical'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {event.format === 'Team' ? 'Squad' : 'Solo'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                            event.status === 'Live'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                              : event.status === 'Completed'
                              ? 'bg-surface-elevated text-text-muted border-border'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {event.status || 'Upcoming'}
                          </span>
                        </td>

                        {/* Action buttons - fade in on hover */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {/* Admin Controls */}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setAttendanceEvent(event)}
                                  className="p-2 rounded-xl bg-surface-elevated text-accent hover:text-white hover:bg-accent transition-all cursor-pointer"
                                  title="Attendance Console"
                                >
                                  <UserCheck size={14} />
                                </button>
                                <button
                                  onClick={() => onEdit && onEdit(event)}
                                  className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
                                  title="Edit Event"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => onDelete && onDelete(event._id)}
                                  className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {/* Student RSVP */}
                            {!isAdmin && (
                              <button
                                onClick={() => setEnrollEvent(event)}
                                disabled={isEnrolled}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isEnrolled
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'btn-primary py-1.5 px-3 text-xs'
                                }`}
                              >
                                {isEnrolled ? 'Registered' : 'RSVP'}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table-triggered Enrollment Modal */}
      {enrollEvent && (
        <EnrollmentModal
          isOpen={Boolean(enrollEvent)}
          onClose={() => setEnrollEvent(null)}
          event={enrollEvent}
        />
      )}

      {/* Table-triggered Attendance Dashboard Modal */}
      {attendanceEvent && (
        <AttendanceDashboard
          isOpen={Boolean(attendanceEvent)}
          onClose={() => setAttendanceEvent(null)}
          event={attendanceEvent}
        />
      )}
    </div>
  );
};

export default EventFeed;
