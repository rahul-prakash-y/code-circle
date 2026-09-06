import React, { useEffect, useState } from 'react';
import useStudentStore from '../store/useStudentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Shield, ShieldAlert, 
  Trash2, LogOut, KeyRound, Check, X,
  AlertTriangle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentManagement = () => {
  const { 
    students, fetchStudents, updatePassword, 
    toggleBlock, deleteStudent, forceLogout,
    loading 
  } = useStudentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleBlock = async (student) => {
    const action = student.isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} ${student.name}?`)) {
      const res = await toggleBlock(student._id, !student.isBlocked);
      if (res.success) toast.success(`Student ${action}ed successfully`);
      else toast.error(res.error);
    }
  };

  const handleDelete = async (student) => {
    if (window.confirm(`CRITICAL: Are you sure you want to delete ${student.name}? This cannot be undone.`)) {
      const res = await deleteStudent(student._id);
      if (res.success) toast.success('Student deleted successfully');
      else toast.error(res.error);
    }
  };

  const handleForceLogout = async (student) => {
    if (window.confirm(`Force logout ${student.name}?`)) {
      const res = await forceLogout(student._id);
      if (res.success) toast.success('Forced logout successfully');
      else toast.error(res.error);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword) return toast.error('Password is required');
    const res = await updatePassword(selectedStudent._id, newPassword);
    if (res.success) {
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
    } else {
      toast.error(res.error);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-text-muted font-medium font-mono animate-pulse">Initializing Student Directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
              <Users className="w-8 h-8 text-accent-muted" />
            </div>
            Student Directory
          </h1>
          <p className="text-text-muted mt-2 font-medium">Manage student access and account credentials.</p>
        </div>

        <div className="relative group max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-muted group-focus-within:text-accent-muted transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            className="w-full bg-surface-elevated/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all backdrop-blur-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="glass overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-[0.2em]">Student Info</th>
                <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-[0.2em]">Department</th>
                <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-xs font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-border flex items-center justify-center text-accent-muted font-black text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-text-primary tracking-wide">{student.name}</div>
                        <div className="text-xs font-bold text-text-muted mt-1 uppercase tracking-wider font-mono">{student.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-text-secondary">
                    {student.department || 'Unassigned'}
                  </td>
                  <td className="px-6 py-5">
                    {student.isBlocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        <ShieldAlert className="w-3 h-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        <Shield className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => { setSelectedStudent(student); setShowPasswordModal(true); }}
                        className="p-2.5 rounded-xl bg-surface-elevated text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleForceLogout(student)}
                        className="p-2.5 rounded-xl bg-surface-elevated text-amber-400/70 hover:text-amber-400 hover:bg-surface-elevated transition-all"
                        title="Force Logout"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleBlock(student)}
                        className={`p-2.5 rounded-xl bg-surface-elevated ${student.isBlocked ? 'text-emerald-400' : 'text-red-400/70 hover:text-red-400'} hover:bg-surface-elevated transition-all`}
                        title={student.isBlocked ? "Unblock Access" : "Block Access"}
                      >
                        {student.isBlocked ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(student)}
                        className="p-2.5 rounded-xl bg-surface-elevated text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-text-muted" />
                      </div>
                      <p className="text-text-muted font-bold">No students found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 border-accent/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <KeyRound className="w-6 h-6 text-accent-muted" />
                  </div>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">Reset Password</h3>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-surface-elevated rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 block">New Password for {selectedStudent?.name}</label>
                  <input
                    type="password"
                    placeholder="Enter secure password"
                    className="w-full bg-surface border border-border rounded-xl py-3.5 px-4 text-text-primary placeholder-slate-700 focus:outline-none focus:border-accent/50 transition-all font-mono"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-4 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-500/80 leading-relaxed">
                    This will immediately update the student's password. They will need to use the new credentials for their next login.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-4 px-6 rounded-2xl bg-surface-elevated text-text-muted text-xs font-black uppercase tracking-widest hover:bg-surface-elevated transition-all border border-border"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePasswordReset}
                    className="flex-1 py-4 px-6 rounded-2xl bg-accent text-text-primary text-xs font-black uppercase tracking-widest hover:bg-accent-muted shadow-lg shadow-accent/20 transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement;
