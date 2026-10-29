import React from 'react';
import { motion } from 'framer-motion';
import StudentTrackingTable from '@/components/admin/tracking/StudentTrackingTable';

export const StudentTrackingPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-7xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8"
    >
      <StudentTrackingTable />
    </motion.div>
  );
};

export default StudentTrackingPage;
