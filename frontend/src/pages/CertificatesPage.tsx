import React from 'react';
import MyCertificates from '../components/dashboard/MyCertificates';

export const CertificatesPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <MyCertificates />
    </div>
  );
};

export default CertificatesPage;
