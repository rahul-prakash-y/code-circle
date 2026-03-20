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
    <div className="space-y-12 max-w-5xl mx-auto py-10">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="stellar-glass p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative group">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border border-white/10 p-1 group-hover:border-blue-500/50 transition-all duration-500 cursor-pointer shadow-2xl" onClick={() => setIsModalOpen(true)}>
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
              <img 
                src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=6366f1&color=fff&size=200`} 
                alt="Profile" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-[2.5rem] backdrop-blur-[2px]">
              <Camera className="text-white" size={32} />
            </div>
          </div>
          {profileLoading && (
            <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          )}
        </div>

        <div className="text-center md:text-left flex-1 space-y-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{profile.name}</h1>
              <span className="inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                {profile.role}
              </span>
            </div>
            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 text-sm font-bold uppercase tracking-widest">
              <Building2 size={16} className="text-blue-500" /> Bannari Amman Institute
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
               Roll: <span className="text-white ml-1">{profile.rollNo}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Basic Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="stellar-glass p-8 space-y-8"
        >
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            Identity
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="stellar-label">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="stellar-input"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="stellar-label">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="stellar-input"
                  placeholder="e.g. AI & DS"
                />
              </div>
              <div>
                <label className="stellar-label">Status</label>
                <input
                  type="text"
                  value="Tier 1 Member"
                  disabled
                  className="stellar-input opacity-50 cursor-not-allowed bg-white/5"
                />
              </div>
            </div>

            <div>
              <label className="stellar-label">Registered Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="stellar-input opacity-50 cursor-not-allowed bg-white/5"
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
          className="stellar-glass p-8 space-y-8"
        >
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Github size={16} />
            </div>
            Connectivity
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="stellar-label">GitHub URL</label>
              <input
                type="url"
                name="socialLinks.github"
                value={formData.socialLinks.github}
                onChange={handleChange}
                className="stellar-input"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="stellar-label">LinkedIn Profile</label>
              <input
                type="url"
                name="socialLinks.linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                className="stellar-input"
                placeholder="https://linkedin.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="stellar-label">LeetCode</label>
                <input
                  type="text"
                  name="socialLinks.leetcode"
                  value={formData.socialLinks.leetcode}
                  onChange={handleChange}
                  className="stellar-input"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="stellar-label">HackerRank</label>
                <input
                  type="text"
                  name="socialLinks.hackerrank"
                  value={formData.socialLinks.hackerrank}
                  onChange={handleChange}
                  className="stellar-input"
                  placeholder="Username"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 stellar-glass p-8 space-y-8"
        >
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Code2 size={16} />
            </div>
            Tech Stack
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="stellar-label">Add Experience Tags</label>
              <div className="relative group">
                <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="stellar-input pl-14"
                  placeholder="Type skill & press Enter"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {formData.skills.map((skill, index) => (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={index}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 text-white border border-white/5 text-xs font-black uppercase tracking-widest hover:border-blue-500/30 hover:bg-white/10 transition-all cursor-default"
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="p-1 hover:bg-pink-500/20 rounded-lg text-slate-500 hover:text-pink-400 transition-colors"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </motion.span>
              ))}
              {formData.skills.length === 0 && (
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-20 ml-2">No tags added</p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="md:col-span-2 flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="stellar-btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={profileLoading}
            className="stellar-btn min-w-[180px] flex items-center justify-center gap-3 group"
          >
            {profileLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={20} className="group-hover:rotate-12 transition-transform" />
                <span>Synchronize</span>
              </>
            )}
          </button>
        </div>
      </form>

      <ImageUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Profile;
