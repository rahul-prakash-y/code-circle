import React from 'react';
import EventPassport from '../components/profile/EventPassport';

export const PassportPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Participation</p>
        <h1 className="display-headline text-label-primary">Registrations & Passport</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          Chronological milestone log of all your registered and completed events.
        </p>
      </div>

      {/* Main Passport */}
      <EventPassport />
    </div>
  );
};

export default PassportPage;
