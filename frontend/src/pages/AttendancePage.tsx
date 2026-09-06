import React from 'react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import AttendanceRecordsView from '../components/admin/AttendanceRecordsView';
import AttendanceHistory from '../components/dashboard/AttendanceHistory';

export const AttendancePage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const isFaculty = profile?.role === 'Faculty';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Verification</p>
        <h1 className="display-headline text-label-primary">Attendance</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          {isAdmin || isFaculty
            ? 'Manage session attendance, generate secure OTPs, and review verification records.'
            : 'Enter session OTPs to verify your presence and track historical event attendance.'}
        </p>
      </div>

      {/* Main Content */}
      {isAdmin || isFaculty ? <AttendanceRecordsView /> : <AttendanceHistory />}
    </div>
  );
};

export default AttendancePage;
