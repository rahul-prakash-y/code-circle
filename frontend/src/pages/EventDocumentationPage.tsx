import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Calendar, MapPin, Filter } from 'lucide-react';
import { EventDocumentationHub } from '../components/events/documentation';
import { EmilButton, EmilCard } from '../components/ui/emil-ui';
import api from '../lib/axios';

export const EventDocumentationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<any | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(id || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api
        .get(`/events/${id}`)
        .then((res) => {
          setEventData(res.data.data || res.data.event || res.data);
          setSelectedEventId(id);
        })
        .catch((err) => {
          console.error('Failed to load event for documentation:', err);
        })
        .finally(() => setLoading(false));
    } else {
      // General Documentation view from sidebar: load all events
      api
        .get('/events')
        .then((res) => {
          const list = res.data.data || res.data.events || [];
          setAllEvents(list);
        })
        .catch((err) => {
          console.error('Failed to load events for documentation selector:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const activeEvent = id ? eventData : allEvents.find((e) => e._id === selectedEventId);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          {id ? (
            <EmilButton
              variant="flat"
              size="sm"
              onClick={() => navigate('/events')}
              className="gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Events</span>
            </EmilButton>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold tracking-tight text-label-primary">
              {id ? (eventData?.title ? `${eventData.title} • Documentation` : 'Event Documentation') : 'Documentation Center'}
            </h1>
            <p className="text-xs text-label-secondary">
              Institutional event documentation, administrative reviews, and client-side PDF records
            </p>
          </div>
        </div>

        {/* Event Selector when opened generally from the sidebar */}
        {!id && allEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-label-secondary">Filter Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-separator bg-surface text-label-primary focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All Events</option>
              {allEvents.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {eventData && id && (
          <div className="flex items-center gap-3 text-xs text-label-secondary">
            {eventData.date && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(eventData.date).toLocaleDateString()}
              </span>
            )}
            {eventData.venueOrLink && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                <span className="truncate max-w-[150px]">{eventData.venueOrLink}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Documentation Hub */}
      <EventDocumentationHub
        eventId={selectedEventId !== 'all' ? selectedEventId : undefined}
        eventTitle={activeEvent?.title}
        eventsList={allEvents}
      />
    </div>
  );
};

export default EventDocumentationPage;
