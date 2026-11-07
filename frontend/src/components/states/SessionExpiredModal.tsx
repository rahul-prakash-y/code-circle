import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@heroui/react';
import ResponsiveModal from '../ui/ResponsiveModal';
import { HeroInput } from '../ui/HeroUIComponents';
import useAuthStore from '@/store/useAuthStore';
import { UX_COPY } from '@/constants/copy';
import toast from 'react-hot-toast';

export const SessionExpiredModal: React.FC = () => {
  const { user, login, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleUnauthorized = () => {
      // Pre-fill user identifier if available
      if (user?.email || user?.rollNo) {
        setIdentifier(user.email || user.rollNo);
      }
      setErrorMessage('');
      setIsOpen(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [user]);

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Please enter both your ID and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login(identifier, password);
      if (res.success) {
        toast.success('Session restored! You can continue without losing your work.');
        setIsOpen(false);
        setPassword('');
        window.location.href = '/';
        // Dispatch session restored event so in-flight requests can retry
        window.dispatchEvent(new CustomEvent('auth:session-restored'));
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('Network error during re-authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardAndExit = async () => {
    setIsOpen(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        // Prevent accidental closing without explicit choice
        if (!open) {
          setIsOpen(true);
        }
      }}
      title={
        <div className="flex items-center gap-2 text-danger">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{UX_COPY.session.expiredTitle}</span>
        </div>
      }
      description={UX_COPY.session.expiredDescription}
    >
      <form onSubmit={handleReLogin} className="space-y-4 pt-2">
        <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-secondary flex items-center justify-between">
          <span className="font-medium text-label-primary">Work Preservation:</span>
          <span className="text-emerald-500 font-medium">{UX_COPY.session.workPreservedBadge}</span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          <HeroInput
            label="Roll Number or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            isRequired
            size="sm"
            startContent={<KeyRound size={15} className="text-label-tertiary" />}
          />

          <HeroInput
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            size="sm"
            startContent={<Lock size={15} className="text-label-tertiary" />}
          />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={handleDiscardAndExit}
            className="w-full sm:w-auto text-xs font-medium text-label-secondary hover:text-danger"
          >
            Log Out & Discard
          </Button>

          <Button
            type="submit"
            variant="solid"
            color="primary"
            size="sm"
            isDisabled={isSubmitting}
            className="w-full sm:w-auto text-xs font-semibold rounded-full px-5 h-9 shadow-sm"
            startContent={
              isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )
            }
          >
            {isSubmitting ? 'Verifying...' : UX_COPY.session.loginAction}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default SessionExpiredModal;
