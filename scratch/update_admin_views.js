const fs = require('fs');

// ── 1. Dashboard.tsx (Bento Grid staggered EmilCards) ──
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
  "import EventModal from '../components/events/EventModal';",
  "import EventModal from '../components/events/EventModal';\r\nimport { EmilCard, EmilButton } from '../components/ui/emil-ui';\r\nimport { EMIL_EASE_OUT, DURATION_MODAL } from '../lib/motion';"
);

// Update MetricCard to use EmilCard with variants
dash = dash.replace(
  `  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={\`\${
        isPrimary ? 'surface-primary-metric' : 'surface'
      } spotlight-card interactive-card p-4 sm:p-6 flex flex-col justify-between min-h-[148px] sm:min-h-[162px] group cursor-default\`}
    >`,
  `  return (
    <EmilCard
      ref={ref}
      isHoverable
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: DURATION_MODAL, ease: EMIL_EASE_OUT },
        },
      }}
      className={\`\${
        isPrimary ? 'surface-primary-metric' : ''
      } spotlight-card interactive-card p-4 sm:p-6 flex flex-col justify-between min-h-[148px] sm:min-h-[162px] group cursor-default\`}
    >`
);

dash = dash.replace(
  `      </div>
    </div>
  );
};

// ── Participation bar (scroll-triggered) ──`,
  `      </div>
    </EmilCard>
  );
};

// ── Participation bar (scroll-triggered) ──`
);

// Staggered grid container
dash = dash.replace(
  `        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {metricsData.map((m, idx) => (
            <MetricCard key={m.label} {...m} isPrimary={idx === 0} />
          ))}
        </div>`,
  `        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4"
        >
          {metricsData.map((m, idx) => (
            <MetricCard key={m.label} {...m} isPrimary={idx === 0} />
          ))}
        </motion.div>`
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log('Dashboard updated with staggered EmilCard Bento Grid');

// ── 2. TeamsManagement.tsx (EmilCard, origin-aware EmilDropdown, whileTap 0.992) ──
let tm = fs.readFileSync('frontend/src/pages/TeamsManagement.tsx', 'utf8');

tm = tm.replace(
  "import {",
  "import { EmilCard, EmilButton, EmilDropdownRoot, EmilDropdownTrigger, EmilDropdownMenu, EmilDropdownItem } from '../components/ui/emil-ui';\r\nimport { MoreVertical } from 'lucide-react';\r\nimport {"
);

// Wrap team cards in EmilCard with whileTap 0.992
tm = tm.replace(
  `          {filteredTeams.map((team) => {
            const isFull = team.members?.length >= (team.maxMembers || 4);

            return (
              <div
                key={team._id}
                className="surface rounded-[20px] p-5 sm:p-6 border border-separator shadow-card hover:border-text-secondary/40 transition-all flex flex-col justify-between group"
              >`,
  `          {filteredTeams.map((team) => {
            const isFull = team.members?.length >= (team.maxMembers || 4);

            return (
              <EmilCard
                key={team._id}
                isHoverable
                whileTap={{ scale: 0.992 }}
                className="rounded-[20px] p-5 sm:p-6 border border-separator shadow-card flex flex-col justify-between group"
              >`
);

// Replace plain action buttons with origin-aware EmilDropdown
const oldTeamActions = `                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(team)}
                      className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                      title="Edit Team Details"
                      aria-label="Edit Team"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-text-muted hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete Team"
                      aria-label="Delete Team"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>`;

const newTeamActions = `                  <EmilDropdownRoot origin="top right">
                    <EmilDropdownTrigger>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                        title="More Actions"
                        aria-label="More Actions"
                      >
                        <MoreVertical size={14} />
                      </motion.button>
                    </EmilDropdownTrigger>
                    <EmilDropdownMenu align="right" className="w-44">
                      <EmilDropdownItem
                        onClick={() => openEdit(team)}
                        icon={<Edit2 size={13} className="text-accent" />}
                      >
                        Edit Details
                      </EmilDropdownItem>
                      <EmilDropdownItem
                        isDestructive
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowDeleteModal(true);
                        }}
                        icon={<Trash2 size={13} />}
                      >
                        Delete Team
                      </EmilDropdownItem>
                    </EmilDropdownMenu>
                  </EmilDropdownRoot>`;

tm = tm.replace(oldTeamActions, newTeamActions);

tm = tm.replace(
  `                </div>
              </div>
            );
          })}`,
  `                </div>
              </EmilCard>
            );
          })}`
);

fs.writeFileSync('frontend/src/pages/TeamsManagement.tsx', tm, 'utf8');
console.log('TeamsManagement updated with EmilCard & origin-aware EmilDropdown');

// ── 3. EventModal.jsx (Scale 0.95 centered, backdrop-blur-md, EmilButton) ──
let em = fs.readFileSync('frontend/src/components/events/EventModal.jsx', 'utf8');
em = em.replace(
  "import useEventStore from '../../store/useEventStore';",
  "import useEventStore from '../../store/useEventStore';\r\nimport { EmilButton } from '../ui/emil-ui';"
);

em = em.replace(
  `          {/* Centered Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl glass border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-10"
          >`,
  `          {/* Centered Modal Container — Emil Kowalski physics (scale 0.95, no bounce) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-2xl bg-surface border border-separator rounded-3xl shadow-2xl overflow-hidden z-10"
          >`
);

em = em.replace(
  `<button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 cursor-pointer text-xs font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {eventToEdit ? 'Save Changes' : 'Publish Event'}
              </button>`,
  `<EmilButton
                type="submit"
                isLoading={loading}
                size="md"
                className="font-bold text-xs shadow-md cursor-pointer"
              >
                {eventToEdit ? 'Save Changes' : 'Publish Event'}
              </EmilButton>`
);

fs.writeFileSync('frontend/src/components/events/EventModal.jsx', em, 'utf8');
console.log('EventModal updated with Emil physics');

// ── 4. GenerateOtpModal.jsx (Scale 0.95 centered, backdrop-blur-md, EmilButton) ──
let gom = fs.readFileSync('frontend/src/components/admin/GenerateOtpModal.jsx', 'utf8');
gom = gom.replace(
  "import useEventStore from '../../store/useEventStore';",
  "import useEventStore from '../../store/useEventStore';\r\nimport { EmilButton } from '../ui/emil-ui';"
);

gom = gom.replace(
  `      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-[calc(100%-1.5rem)] sm:w-full max-w-xl glass border border-border p-4 sm:p-7 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[90dvh] overflow-y-auto rounded-2xl sm:rounded-3xl"
      >`,
  `      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="w-[calc(100%-1.5rem)] sm:w-full max-w-xl bg-surface border border-separator p-4 sm:p-7 relative overflow-hidden shadow-2xl max-h-[90dvh] overflow-y-auto rounded-2xl sm:rounded-3xl"
      >`
);

fs.writeFileSync('frontend/src/components/admin/GenerateOtpModal.jsx', gom, 'utf8');
console.log('GenerateOtpModal updated with Emil physics');
