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
    <div className="surface p-7 h-[260px] animate-pulse rounded-[18px]">
      <div className="flex justify-between mb-4">
        <div className="w-24 h-4 bg-separator rounded-md" />
        <div className="w-14 h-4 bg-separator rounded-md" />
      </div>
      <div className="space-y-3 mt-6">
        <div className="w-3/4 h-6 bg-separator rounded-md" />
        <div className="w-full h-4 bg-separator rounded-md" />
        <div className="w-2/3 h-4 bg-separator rounded-md" />
      </div>
      <div className="mt-8 pt-4 border-t border-separator flex justify-between items-center">
        <div className="w-20 h-4 bg-separator rounded-md" />
        <div className="w-24 h-8 bg-separator rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-label-primary tracking-tight font-heading">
            Events Arena
          </h2>
          <p className="text-label-secondary text-sm font-normal mt-1">
            Workshops, hackathons, guest lectures, and competitive tracks.
          </p>
        </div>

        {/* Status Tabs & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-separator rounded-full overflow-x-auto">
            {[
              { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
              { id: 'live', label: 'Live', icon: Activity },
              { id: 'past', label: 'Archive', icon: History },
              { id: 'all', label: 'All', icon: Calendar },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-label-secondary hover:text-label-primary hover:bg-canvas'
                  }`}
                >
                  <tab.icon size={13} className={tab.id === 'live' && isActive ? 'text-white' : ''} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View mode toggle (Grid vs Table) */}
          <div className="flex items-center gap-0.5 p-1 bg-surface border border-separator rounded-full">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-separator text-label-primary'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-separator text-label-primary'
                  : 'text-label-secondary hover:text-label-primary'
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
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" size={15} />
          <input
            type="text"
            placeholder="Search events by title, description, or venue…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-surface border border-separator p-1 rounded-full">
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedType === type
                    ? 'bg-separator text-label-primary'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1 bg-surface border border-separator p-1 rounded-full">
            {EVENT_FORMATS.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedFormat === format
                    ? 'bg-separator text-label-primary'
                    : 'text-label-secondary hover:text-label-primary'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="surface p-14 text-center rounded-[18px]">
          <Calendar className="w-10 h-10 text-label-tertiary mx-auto mb-3 opacity-30" />
          <p className="text-label-primary font-semibold text-base">
            No events found
          </p>
          <p className="text-label-secondary text-xs mt-1">
            Try switching filter tabs or clearing your search query.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((event) => (
            <div key={event._id}>
              <EventCard
                event={event}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View — Clean Apple-spec Table */
        <div className="surface overflow-hidden rounded-[18px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator bg-canvas/40">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-label-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const isEnrolled = myEnrolledEventIds.includes(event._id);
                  return (
                    <tr
                      key={event._id}
                      className="group border-b border-separator/60 hover:bg-canvas/50 transition-colors"
                    >
                      {/* Title & Venue */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-separator flex items-center justify-center text-label-secondary shrink-0">
                            <Calendar size={15} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-label-primary truncate group-hover:text-accent transition-colors">
                              {event.title}
                            </h4>
                            <p className="text-xs text-label-secondary truncate flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="shrink-0 text-label-tertiary" />
                              <span>{event.venueOrLink || 'Campus Venue'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs font-medium text-label-secondary whitespace-nowrap">
                        {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'TBA'}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-label-secondary font-medium">
                          {event.type || 'Technical'} • {event.format === 'Team' ? 'Team' : 'Solo'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {event.status === 'Live' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-destructive">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="text-xs text-label-secondary">
                            {event.status || 'Upcoming'}
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Admin Controls */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setAttendanceEvent(event)}
                                className="p-1.5 rounded-lg text-label-secondary hover:text-accent hover:bg-canvas transition-colors cursor-pointer"
                                title="Attendance Records"
                              >
                                <UserCheck size={15} />
                              </button>
                              <button
                                onClick={() => onEdit && onEdit(event)}
                                className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-canvas transition-colors cursor-pointer"
                                title="Edit Event"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => onDelete && onDelete(event._id)}
                                className="p-1.5 rounded-lg text-label-secondary hover:text-destructive hover:bg-canvas transition-colors cursor-pointer"
                                title="Delete Event"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}

                          {/* Student RSVP */}
                          {!isAdmin && (
                            <button
                              onClick={() => setEnrollEvent(event)}
                              disabled={isEnrolled}
                              className={
                                isEnrolled
                                  ? 'btn-secondary text-xs py-1 px-3 opacity-90 cursor-default'
                                  : 'btn-primary text-xs py-1 px-3.5'
                              }
                            >
                              {isEnrolled ? 'Enrolled' : 'Enroll'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
