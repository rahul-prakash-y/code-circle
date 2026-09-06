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
import GlassCard from '../components/ui/GlassCard';

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
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-8">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative group">
            <div 
              className="w-36 h-36 rounded-3xl overflow-hidden border border-border p-1 group-hover:border-accent/50 transition-all duration-500 cursor-pointer shadow-lg" 
              onClick={() => setIsModalOpen(true)}
            >
              <div className="w-full h-full rounded-[1.3rem] overflow-hidden">
                <img 
                  src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=7c3aed&color=fff&size=200`} 
                  alt="Profile" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-3xl backdrop-blur-[2px]">
                <Camera className="text-text-primary" size={28} />
              </div>
            </div>
            {profileLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-accent" size={28} />
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1 space-y-3">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight font-heading">{profile.name}</h1>
                <span className="inline-flex px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                  {profile.role}
                </span>
              </div>
              <p className="text-text-muted flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                <Building2 size={15} className="text-accent" /> Bannari Amman Institute
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <div className="px-3 py-1.5 bg-surface-elevated border border-border rounded-xl text-[11px] font-semibold text-text-muted">
                 Roll: <span className="text-text-primary ml-1">{profile.rollNo}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Basic Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="space-y-6">
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-3 font-heading">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <UserIcon size={16} className="text-accent" />
              </div>
              Basic Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. AI & DS"
                  />
                </div>
                <div>
                  <label className="input-label">Status</label>
                  <input
                    type="text"
                    value="Tier 1 Member"
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Registered Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Social Links */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="space-y-6">
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-3 font-heading">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Code2 size={16} className="text-accent" />
              </div>
              Social & Coding Profiles
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="input-label">GitHub URL</label>
                <input
                  type="url"
                  name="socialLinks.github"
                  value={formData.socialLinks.github}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="input-label">LinkedIn Profile</label>
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://linkedin.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">LeetCode</label>
                  <input
                    type="text"
                    name="socialLinks.leetcode"
                    value={formData.socialLinks.leetcode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="input-label">HackerRank</label>
                  <input
                    type="text"
                    name="socialLinks.hackerrank"
                    value={formData.socialLinks.hackerrank}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Username"
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Skills Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <GlassCard className="space-y-6">
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-3 font-heading">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Code2 size={16} className="text-accent" />
              </div>
              Skills & Technologies
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="input-label">Add Experience Tags</label>
                <div className="relative group">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="input-field pl-12"
                    placeholder="Type skill & press Enter"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated text-text-primary border border-border text-xs font-semibold hover:border-accent/30 hover:bg-accent/5 transition-all cursor-default"
                  >
                    {skill}
                    <button 
                      type="button" 
                      onClick={() => removeSkill(skill)}
                      className="p-0.5 hover:bg-destructive/10 rounded-md text-text-muted hover:text-destructive transition-colors"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </motion.span>
                ))}
                {formData.skills.length === 0 && (
                  <p className="text-text-muted text-xs font-medium opacity-50 ml-1">No tags added</p>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary py-3 px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={profileLoading}
            className="btn-primary min-w-[160px] flex items-center justify-center gap-2 group py-3 cursor-pointer"
          >
            {profileLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} className="group-hover:rotate-12 transition-transform" />
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
