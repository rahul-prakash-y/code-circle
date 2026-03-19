import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  Github, 
  Linkedin, 
  Code2, 
  Trophy, 
  Building2, 
  Save, 
  Plus, 
  X,
  Camera,
  Loader2,
  LogOut
} from 'lucide-react';
import useProfileStore from '../store/useProfileStore';
import useAuthStore from '../store/useAuthStore';
import { auth as firebaseAuth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ImageUploadModal from '../components/profile/ImageUploadModal';

const Profile = () => {
  const { profile, updateProfile, profileLoading } = useProfileStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    rollNo: '',
    socialLinks: {
      github: '',
      linkedin: '',
      leetcode: '',
      hackerrank: ''
    },
    skills: []
  });
  const [skillInput, setSkillInput] = useState('');

  // Synchronize local form state only when profile from store changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        department: profile.department || '',
        rollNo: profile.rollNo || '',
        socialLinks: {
          github: profile.socialLinks?.github || '',
          linkedin: profile.socialLinks?.linkedin || '',
          leetcode: profile.socialLinks?.leetcode || '',
          hackerrank: profile.socialLinks?.hackerrank || ''
        },
        skills: profile.skills || []
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()]
        }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add pending skill if any
    let finalFormData = { ...formData };
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      finalFormData.skills = [...formData.skills, skillInput.trim()];
      setFormData(finalFormData);
      setSkillInput('');
    }

    const res = await updateProfile(finalFormData);
    if (res.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(res.error);
    }
  };

  if (!profile) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
                Code Circle
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 border-r border-slate-800 pr-6">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Profile
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/20 shadow-xl group-hover:border-indigo-500/40 transition-all cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <img 
                  src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=6366f1&color=fff&size=200`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              {profileLoading && (
                <div className="absolute inset-0 bg-slate-950/60 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              )}
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  {profile.role}
                </span>
              </div>
              <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mb-1">
                <Building2 size={16} /> Bannari Amman Institute of Technology
              </p>
              <p className="text-slate-500 text-sm">Roll No: {profile.rollNo}</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Basic Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <UserIcon size={20} className="text-indigo-500" /> Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Roll Number</label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      disabled
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="e.g. CSE"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <Github size={20} className="text-indigo-500" /> Social Links
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">GitHub Profile</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="url"
                      name="socialLinks.github"
                      value={formData.socialLinks.github}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">LinkedIn Profile</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="url"
                      name="socialLinks.linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">LeetCode</label>
                    <div className="relative">
                      <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="url"
                        name="socialLinks.leetcode"
                        value={formData.socialLinks.leetcode}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                        placeholder="Username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">HackerRank</label>
                    <div className="relative">
                      <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="url"
                        name="socialLinks.hackerrank"
                        value={formData.socialLinks.hackerrank}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                        placeholder="Username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <Code2 size={20} className="text-indigo-500" /> Professional Skills
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Add Skills (Press Enter)</label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="e.g. React, Node.js, Python"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  {formData.skills.map((skill, index) => (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => removeSkill(skill)}
                        className="p-0.5 hover:bg-indigo-500/30 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                  {formData.skills.length === 0 && (
                    <p className="text-slate-500 text-sm italic">No skills added yet.</p>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {profileLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Save Changes
              </button>
            </div>
          </form>

          <ImageUploadModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
