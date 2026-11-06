import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Calendar, MapPin, Archive, Wand2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { HeroUISelect } from '../components/ui/HeroUIComponents';
import { EventDocumentationHub, EventReportForm } from '../components/events/documentation';
import { EmilButton, EmilCard } from '../components/ui/emil-ui';
import api from '../lib/axios';

export const EventDocumentationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'generator' | 'hub'>(
    searchParams.get('tab') === 'archive' ? 'hub' : 'generator'
  );
  const [eventData, setEventData] = useState<any | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(id || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api
        .get(`/events/${id}`)
        .then((res) => {
          const ev = res.data.data || res.data.event || res.data;
          setEventData(ev);
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
          if (list.length > 0 && selectedEventId === 'all') {
            setSelectedEventId(list[0]._id);
          }
        })
        .catch((err) => {
          console.error('Failed to load events for documentation selector:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const activeEvent = id ? eventData : allEvents.find((e) => e._id === selectedEventId);

  const handleTabChange = (tab: 'generator' | 'hub') => {
    setActiveTab(tab);
    setSearchParams(tab === 'hub' ? { tab: 'archive' } : {});
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          {id ? (
            <Button
              variant="flat"
              size="sm"
              onPress={() => navigate('/events')}
              className="gap-1.5 cursor-pointer rounded-xl font-medium"
            >
              <ArrowLeft size={14} />
              <span>Events</span>
            </Button>
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
              Bannari Amman Institute of Technology &bull; Event Documentation &amp; Client-Side PDF Engine
            </p>
          </div>
        </div>

        {/* Event Selector & Meta Information */}
        <div className="flex flex-wrap items-center gap-3">
          {!id && allEvents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-label-secondary shrink-0">Select Event:</span>
              <HeroUISelect
                value={selectedEventId}
                onChange={setSelectedEventId}
                placeholder="Choose event..."
                options={allEvents.map((ev) => ({
                  value: ev._id,
                  label: ev.title,
                }))}
                size="sm"
                isSearchable
                className="w-56 sm:w-64"
                placement="bottom-end"
              />
            </div>
          )}

          {activeEvent && (
            <div className="hidden md:flex items-center gap-3 text-xs text-label-secondary pl-2 border-l border-separator">
              {activeEvent.date && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(activeEvent.date).toLocaleDateString()}
                </span>
              )}
              {activeEvent.venueOrLink && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  <span className="truncate max-w-[150px]">{activeEvent.venueOrLink}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Mode Switcher: Report Generator vs Document Archive */}
      <div className="flex items-center gap-2 p-1.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/5 dark:border-white/5 w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-xs'
              : 'text-label-secondary hover:text-label-primary'
          }`}
        >
          <Wand2 size={15} />
          <span>Official BIT Report Generator</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'hub'
              ? 'bg-white dark:bg-white/15 text-primary dark:text-white shadow-xs'
              : 'text-label-secondary hover:text-label-primary'
          }`}
        >
          <Archive size={15} />
          <span>Documentation Records &amp; Reviews</span>
        </button>
      </div>

      {/* Content Body */}
      {activeTab === 'generator' ? (
        <EventReportForm
          eventId={selectedEventId !== 'all' ? selectedEventId : (allEvents[0]?._id || id)}
          eventsList={allEvents}
        />
      ) : (
        <EventDocumentationHub
          eventId={selectedEventId !== 'all' ? selectedEventId : undefined}
          eventTitle={activeEvent?.title}
          eventsList={allEvents}
        />
      )}
    </div>
  );
};

export default EventDocumentationPage;
