import React, { useState } from 'react';
import {
  Send,
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import useNotificationStore, {
  NotificationType,
  NotificationTargetRole,
} from '../../store/useNotificationStore';
import ResponsiveModal from '../ui/ResponsiveModal';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNotification, actionLoading } = useNotificationStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [targetRole, setTargetRole] = useState<NotificationTargetRole>('All');
  const [link, setLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const success = await createNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      targetRole,
      link: link.trim() || undefined,
    });

    if (success) {
      setTitle('');
      setMessage('');
      setType('info');
      setTargetRole('All');
      setLink('');
      onClose();
    }
  };

  const typeOptions: {
    value: NotificationType;
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    bg: string;
  }[] = [
    {
      value: 'info',
      label: 'Info',
      icon: Info,
      color: '#0071E3',
      bg: 'rgba(0, 113, 227, 0.12)',
    },
    {
      value: 'success',
      label: 'Success',
      icon: CheckCircle2,
      color: '#34C759',
      bg: 'rgba(52, 199, 89, 0.12)',
    },
    {
      value: 'warning',
      label: 'Reminder',
      icon: AlertTriangle,
      color: '#FF9F0A',
      bg: 'rgba(255, 159, 10, 0.12)',
    },
    {
      value: 'urgent',
      label: 'Urgent',
      icon: AlertCircle,
      color: '#FF3B30',
      bg: 'rgba(255, 59, 48, 0.12)',
    },
  ];

  const targetOptions: {
    value: NotificationTargetRole;
    label: string;
    icon: React.ComponentType<any>;
  }[] = [
    { value: 'All', label: 'Everyone', icon: Users },
    { value: 'Student', label: 'Students', icon: GraduationCap },
    { value: 'Faculty', label: 'Faculty', icon: Briefcase },
    { value: 'Admin', label: 'Admins', icon: ShieldAlert },
  ];

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.2) 0%, rgba(94, 92, 230, 0.2) 100%)',
              color: 'var(--accent)',
            }}
          >
            <Bell size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-label-primary tracking-tight">
              Broadcast Notification
            </h2>
            <p className="text-[12px] text-label-secondary font-normal">
              Create and send live notifications to club members
            </p>
          </div>
        </div>
      }
      dialogClassName="sm:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Type selector */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-label-secondary mb-2">
            Notification Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[12px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                      : 'border-separator bg-canvas/60 text-label-secondary hover:text-label-primary hover:bg-canvas'
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    style={{ color: isSelected ? 'var(--accent)' : opt.color }}
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-label-secondary mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {targetOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = targetRole === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTargetRole(opt.value)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[12px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                      : 'border-separator bg-canvas/60 text-label-secondary hover:text-label-primary hover:bg-canvas'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.8} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-label-secondary mb-1.5">
            Headline / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Nebula Hackathon Registrations Open"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-separator text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-accent text-[14px] transition-colors"
          />
        </div>

        {/* Message Body */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-label-secondary mb-1.5">
            Detailed Message <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            maxLength={500}
            placeholder="Write the full announcement details here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-separator text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-accent text-[14px] transition-colors resize-none"
          />
          <div className="flex justify-end text-[11px] text-label-tertiary mt-1">
            {message.length} / 500
          </div>
        </div>

        {/* Optional Pathway Link */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-label-secondary mb-1.5">
            Action Link <span className="text-label-tertiary font-normal">(Optional route or URL)</span>
          </label>
          <div className="relative">
            <LinkIcon
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary"
            />
            <input
              type="text"
              placeholder="e.g. /events or /assessments"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-canvas border border-separator text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-accent text-[13px] transition-colors"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="btn-secondary px-4 py-2 text-[13px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading || !title.trim() || !message.trim()}
            className="btn-primary px-5 py-2 text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send size={14} strokeWidth={2} />
                <span>Send Announcement</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default CreateNotificationModal;
