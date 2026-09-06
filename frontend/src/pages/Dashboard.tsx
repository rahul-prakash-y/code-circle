import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  Trophy,
  Target,
  Award,
  CalendarCheck,
  Medal,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';

import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import useMetricsStore from '../store/useMetricsStore';

import CountUp from '../components/ui/CountUp';
import QuickActions from '../components/admin/QuickActions';
import EventModal from '../components/events/EventModal';
import MagneticCTA from '../components/ui/MagneticCTA';

// ── Scroll-driven hero (subtle depth, max 12-16px movement) ────────────────────
const Hero = ({
  greeting,
  firstName,
  isAdmin,
  onCreateEvent,
  onBrowse,
}: {
  greeting: string;
  firstName: string;
  isAdmin: boolean;
  onCreateEvent: () => void;
  onBrowse: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headingY = useTransform(scrollY, [0, 220], [0, -10]);
  const subtextY = useTransform(scrollY, [0, 220], [0, -6]);
  const subtextOpacity = useTransform(scrollY, [0, 180], [1, 0.88]);
  const statusY = useTransform(scrollY, [0, 220], [0, -4]);
  const heroOpacity = useTransform(scrollY, [0, 260], [1, 0.25]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity: heroOpacity }}
      className="relative pt-1 pb-6 md:pb-8"
    >
      {/* Subtle ambient warmth behind hero in light mode (almost invisible depth) */}
      <div
        className="absolute -top-6 -left-8 w-[680px] h-[280px] pointer-events-none -z-10 rounded-full dark:hidden"
        style={{
          background: 'radial-gradient(ellipse at 25% 45%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.45) 50%, transparent 80%)',
        }}
      />

      {/* 1. Portal status */}
      <motion.div style={{ y: statusY }} className="inline-flex items-center gap-2 mb-3">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--success)' }}
        />
        <span className="text-[11px] font-semibold tracking-wider uppercase text-label-secondary">
          {isAdmin ? 'Admin Console · Active' : 'Portal · Online'}
        </span>
      </motion.div>

      {/* 2. Macro headline */}
      <motion.div style={{ y: headingY }} className="mb-2.5">
        <h1 className="display-headline text-label-primary">
          {greeting},
        </h1>
        <h1 className="display-headline text-accent font-bold">
          {firstName}.
        </h1>
      </motion.div>

      {/* 3. Supporting sentence */}
      <motion.p
        style={{ y: subtextY, opacity: subtextOpacity }}
        className="max-w-lg text-[15px] sm:text-[16px] text-label-secondary leading-relaxed font-normal mb-5"
      >
        {isAdmin
          ? 'Manage members, events, attendance, and assessments across Code Circle.'
          : 'Track your progress, explore events, and compete with peers.'}
      </motion.p>

      {/* 4. Primary CTA */}
      <div className="flex flex-wrap items-center gap-3">
        <MagneticCTA maxDisplacement={3}>
          <button
            onClick={onBrowse}
            className="btn-primary flex items-center gap-2 text-[14px] cursor-pointer"
          >
            Browse Events
            <ArrowUpRight size={14} strokeWidth={2} />
          </button>
        </MagneticCTA>

        {isAdmin && (
          <button
            onClick={onCreateEvent}
            className="btn-secondary flex items-center gap-2 text-[14px] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            New Event
          </button>
        )}
      </div>
    </motion.section>
  );
};

// ── Single metric spotlight card (tactile hover + zero re-render CSS spotlight) ──
const MetricCard = ({
  value,
  label,
  sublabel,
  icon: Icon,
  isPrimary = false,
}: {
  value: number;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<any>;
  isPrimary?: boolean;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`${
        isPrimary ? 'surface-primary-metric' : 'surface'
      } spotlight-card interactive-card p-5 sm:p-6 flex flex-col justify-between min-h-[162px] group cursor-default`}
    >
      {/* Top row: Label on left, quiet icon + quiet arrow on right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isPrimary && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block shrink-0" />
          )}
          <p className="meta-editorial text-label-secondary group-hover:text-label-primary transition-colors duration-200">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-canvas border border-separator flex items-center justify-center text-label-tertiary group-hover:text-accent transition-colors duration-200">
            <Icon size={14} strokeWidth={1.5} />
          </div>
          <ChevronRight
            size={13}
            strokeWidth={1.5}
            className="text-label-tertiary/60 group-hover:text-label-tertiary group-hover:translate-x-0.5 transition-all duration-200"
          />
        </div>
      </div>

      {/* Middle & Bottom: LARGE NUMBER then SUPPORTING INFORMATION */}
      <div className="mt-3">
        <div className={`${isPrimary ? 'text-[2.6rem] sm:text-[2.9rem]' : 'text-[2.3rem] sm:text-[2.6rem]'} font-bold leading-none tracking-tight text-label-primary`}>
          {isInView ? <CountUp value={value} /> : <span>0</span>}
        </div>
        {sublabel && (
          <p className="text-[12px] mt-2 font-normal text-label-secondary group-hover:text-label-primary/80 transition-colors duration-200">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Participation bar (scroll-triggered) ─────────────────────────────────────
const ParticipationBar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  return (
    <div ref={ref} className="surface p-6 sm:p-7 col-span-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <p className="meta-editorial text-label-secondary mb-1.5">Participation Rate</p>
          <div className="text-[2.8rem] sm:text-[3.2rem] font-bold leading-none tracking-tight text-label-primary">
            94.8%
          </div>
        </div>
        <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5">
          <span className="text-[12px] text-label-secondary font-medium">Target: 90%</span>
          <span className="text-[12px] font-semibold text-success">
            +4.8% above goal
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '6px', background: 'rgba(0, 0, 0, 0.06)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: '94.8%' } : { width: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
};

// ── Quick Pathway Link Card ──────────────────────────────────────────────────
const QuickPathwayCard = ({
  title,
  description,
  to,
  icon: Icon,
  badge,
}: {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<any>;
  badge?: string;
}) => (
  <Link
    to={to}
    className="surface spotlight-card interactive-card p-6 flex flex-col justify-between group cursor-pointer"
  >
    <div className="flex items-center justify-between mb-5">
      <div className="w-9 h-9 rounded-xl bg-canvas border border-separator flex items-center justify-center text-label-secondary group-hover:text-accent transition-colors duration-200">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-label-tertiary group-hover:text-accent transition-colors duration-200">
        <span>{badge || 'Open'}</span>
        <ArrowUpRight
          size={13}
          strokeWidth={2}
          className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
        />
      </div>
    </div>
    <div>
      <h3 className="text-[15px] font-semibold tracking-tight text-label-primary mb-1.5 group-hover:text-accent transition-colors duration-200">
        {title}
      </h3>
      <p className="text-[13px] text-label-secondary leading-relaxed font-normal">
        {description}
      </p>
    </div>
  </Link>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { upcomingEvents, fetchEvents } = useEventStore();
  const { metrics, fetchMetrics } = useMetricsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  // Backward compatibility: redirect any ?tab=XYZ queries to their standalone routes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    const tabRouteMap: Record<string, string> = {
      events: '/events',
      assessments: '/assessments',
      attendance: '/attendance',
      certificates: '/certificates',
      leaderboard: '/leaderboard',
      passport: '/passport',
      feedback: '/feedback',
      news: '/news',
      analytics: '/analytics',
    };
    if (tabRouteMap[tab]) {
      navigate(tabRouteMap[tab], { replace: true });
    }
  }, [searchParams, navigate]);

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';
  const isFaculty = profile?.role === 'Faculty';

  useEffect(() => {
    if (isAdmin || isFaculty) {
      fetchMetrics();
    }
    fetchEvents('upcoming');
  }, [isAdmin, isFaculty, fetchMetrics, fetchEvents]);

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const displayName = profile?.name || user?.name || 'Developer';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Metric data
  const metricsData = [
    {
      value: isAdmin ? (metrics?.totalUsers ?? 0) : (user?.enrolledEvents?.length ?? 0),
      label: isAdmin ? 'Total Members' : 'Registered Events',
      sublabel: '+12% this term',
      icon: Users,
      delay: 0,
    },
    {
      value: isAdmin ? (metrics?.activeEvents ?? 0) : 12,
      label: isAdmin ? 'Active Events' : 'Leaderboard Rank',
      sublabel: 'Live & scheduled',
      icon: Calendar,
      delay: 0.05,
    },
    {
      value: isAdmin ? (metrics?.totalEvents ?? 0) : 4,
      label: isAdmin ? 'Total Events' : 'Certificates',
      sublabel: 'All-time verified',
      icon: Trophy,
      delay: 0.1,
    },
    {
      value: metrics?.totalAssessmentLevels ?? 6,
      label: 'Skill Tracks',
      sublabel: 'Algorithmic & practical',
      icon: Target,
      delay: 0.15,
    },
  ];

  const featuredUpcoming = upcomingEvents ? upcomingEvents.slice(0, 3) : [];

  return (
    <div className="space-y-0">
      {/* Hero */}
      <Hero
        greeting={greeting}
        firstName={firstName}
        isAdmin={isAdmin}
        onCreateEvent={handleCreateEvent}
        onBrowse={() => navigate('/events')}
      />

      {/* Metrics grid — intentional 4-column desktop layout with primary metric hierarchy */}
      <section className="pb-8 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {metricsData.map((m, idx) => (
            <MetricCard key={m.label} {...m} isPrimary={idx === 0} />
          ))}
        </div>

        {/* Participation bar — full width */}
        <ParticipationBar />

        {/* Quick actions for Admin */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4"
          >
            <QuickActions
              onManageEvents={() => navigate('/events')}
              onOpenCreateEvent={handleCreateEvent}
              onManageAssessments={() => navigate('/assessments')}
            />
          </motion.div>
        )}
      </section>

      {/* Upcoming Events Spotlight */}
      <section className="py-8 border-t border-separator">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="meta-editorial text-label-secondary mb-1">Calendar</p>
            <h2 className="text-[22px] font-bold tracking-tight text-label-primary">
              Upcoming Events
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-label-secondary hover:text-label-primary transition-colors duration-150"
          >
            <span>Explore All Events</span>
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {featuredUpcoming.length === 0 ? (
          <div className="surface p-10 text-center rounded-2xl border border-separator">
            <Calendar size={28} className="mx-auto text-label-tertiary mb-3" />
            <p className="text-[15px] font-semibold text-label-primary">
              No upcoming sessions scheduled
            </p>
            <p className="text-[13px] text-label-secondary mt-1">
              Check back soon or explore past workshops in the catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredUpcoming.map((event: any) => {
              const eventDate = event.date ? new Date(event.date) : new Date();
              return (
                <div
                  key={event._id}
                  className="surface spotlight-card interactive-card p-6 flex flex-col justify-between group rounded-2xl border border-separator"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-canvas border border-separator text-label-secondary">
                        {event.type || 'Event'}
                      </span>
                      <span className="text-[12px] font-mono text-label-tertiary">
                        {event.format || 'Individual'}
                      </span>
                    </div>

                    <h3 className="text-[16px] font-bold text-label-primary tracking-tight line-clamp-1 group-hover:text-accent transition-colors duration-200 mb-2">
                      {event.title}
                    </h3>

                    <p className="text-[13px] text-label-secondary line-clamp-2 leading-relaxed mb-5 font-normal">
                      {event.description || 'Join us for this exciting technical session.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-separator/60 space-y-2">
                    <div className="flex items-center gap-2 text-[12px] text-label-secondary">
                      <Clock size={13} strokeWidth={1.75} className="text-label-tertiary shrink-0" />
                      <span>{format(eventDate, 'MMM dd, yyyy · h:mm a')}</span>
                    </div>
                    {event.venueOrLink && (
                      <div className="flex items-center gap-2 text-[12px] text-label-secondary">
                        <MapPin size={13} strokeWidth={1.75} className="text-label-tertiary shrink-0" />
                        <span className="truncate">{event.venueOrLink}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        to="/events"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
                      >
                        <span>View Details</span>
                        <ArrowUpRight size={13} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Academic & Skill Pathways */}
      <section className="py-8 border-t border-separator">
        <div className="mb-6">
          <p className="meta-editorial text-label-secondary mb-1">Navigation Hub</p>
          <h2 className="text-[22px] font-bold tracking-tight text-label-primary">
            Academic & Skill Pathways
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickPathwayCard
            title="Skill Assessments"
            description="Algorithmic problem tracks, timed coding tests, and practical tasks."
            to="/assessments"
            icon={Award}
            badge="Live"
          />
          <QuickPathwayCard
            title="Session Attendance"
            description="Verify your attendance using session OTPs and view records."
            to="/attendance"
            icon={CalendarCheck}
            badge="Verify"
          />
          <QuickPathwayCard
            title="Academic Leaderboard"
            description="View points ladder, department standings, and podium ranks."
            to="/leaderboard"
            icon={Trophy}
            badge="Ranked"
          />
          <QuickPathwayCard
            title="My Certificates"
            description="Download cryptographic credentials and participation records."
            to="/certificates"
            icon={Medal}
            badge="Credentials"
          />
        </div>
      </section>

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

export default Dashboard;
