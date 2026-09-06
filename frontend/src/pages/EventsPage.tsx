import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import EventFeed from '../components/events/EventFeed';
import EventModal from '../components/events/EventModal';

export const EventsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

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
    </div>
  );
};

export default EventsPage;
