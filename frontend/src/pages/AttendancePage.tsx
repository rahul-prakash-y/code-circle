import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import AttendanceRecordsView from '../components/admin/AttendanceRecordsView';
import AttendanceHistory from '../components/dashboard/AttendanceHistory';
import MissedEventRequestModal from '../components/events/MissedEventRequestModal';
import AdminMissedEventRequestsModal from '../components/admin/AdminMissedEventRequestsModal';
import { Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@heroui/react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [isMissedRequestOpen, setIsMissedRequestOpen] = useState(false);
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = useState(false);

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const isFaculty = profile?.role === 'Faculty';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-separator">
        <div>
          <p className="meta-editorial mb-1 text-label-secondary">Verification</p>
          <h1 className="display-headline text-label-primary">Attendance</h1>
          <p className="text-[13px] sm:text-[14px] text-label-secondary mt-1">
            {isAdmin || isFaculty
              ? 'Manage session attendance, generate secure OTPs, and review verification records.'
              : 'Enter session OTPs to verify your presence and track historical event attendance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Apply for Missed Event Request */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={() => setIsMissedRequestOpen(true)}
            className="w-full sm:w-auto min-h-[40px] text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            <Clock size={15} className="text-indigo-400 shrink-0" />
            <span>Apply for Missed Event</span>
          </Button>

          {/* Admin Review Missed Requests */}
          {(isAdmin || isFaculty) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => setIsAdminRequestsOpen(true)}
              className="w-full sm:w-auto min-h-[40px] text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <ShieldAlert size={15} className="shrink-0" />
              <span>Review Missed Requests</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isAdmin || isFaculty ? <AttendanceRecordsView /> : <AttendanceHistory />}

      {/* Student Missed Event Request Modal */}
      <MissedEventRequestModal
        isOpen={isMissedRequestOpen}
        onClose={() => setIsMissedRequestOpen(false)}
      />

      {/* Admin Missed Event Requests Modal */}
      {(isAdmin || isFaculty) && (
        <AdminMissedEventRequestsModal
          isOpen={isAdminRequestsOpen}
          onClose={() => setIsAdminRequestsOpen(false)}
        />
      )}
    </div>
  );
};

export default AttendancePage;
