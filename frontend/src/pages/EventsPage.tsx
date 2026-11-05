import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import EventFeed from '../components/events/EventFeed';
import EventModal from '../components/events/EventModal';
import TutorialButton from '../components/common/TutorialButton';
import MissedEventRequestModal from '../components/events/MissedEventRequestModal';
import AdminMissedEventRequestsModal from '../components/admin/AdminMissedEventRequestsModal';

export const EventsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [isMissedRequestOpen, setIsMissedRequestOpen] = useState(false);
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = useState(false);

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        toast.success('Event deleted');
      } catch {
        toast.error('Failed to delete event');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-separator">
        <div>
          <p className="meta-editorial mb-1 text-label-secondary">Discovery</p>
          <h1 className="display-headline text-label-primary">Events</h1>
          <p className="text-[14px] text-label-secondary mt-1">
            Explore workshops, hackathons, guest lectures, and tech roundtables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TutorialButton tutorialId="events" label="Events Guide" />

          {/* Missed Event Request Trigger for Students */}
          <button
            type="button"
            onClick={() => setIsMissedRequestOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-surface-secondary border border-separator text-label-primary hover:bg-surface-raised transition-all text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Clock size={15} className="text-indigo-400" />
            <span>Apply for Missed Event</span>
          </button>

          {/* Missed Requests Review for Admins */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminRequestsOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-all text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ShieldAlert size={15} />
              <span>Review Missed Requests</span>
            </button>
          )}

          {isAdmin && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateEvent}
              className="btn-primary flex items-center gap-2 text-[13px] self-start sm:self-auto cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} />
              <span>Create Event</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Events Feed */}
      <EventFeed
        isAdmin={isAdmin}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Event Modal for Admin */}
      {isAdmin && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={eventToEdit}
        />
      )}

      {/* Missed Event Request Modal for Students */}
      <MissedEventRequestModal
        isOpen={isMissedRequestOpen}
        onClose={() => setIsMissedRequestOpen(false)}
      />

      {/* Admin Missed Event Requests Modal */}
      {isAdmin && (
        <AdminMissedEventRequestsModal
          isOpen={isAdminRequestsOpen}
          onClose={() => setIsAdminRequestsOpen(false)}
        />
      )}
    </div>
  );
};

export default EventsPage;
