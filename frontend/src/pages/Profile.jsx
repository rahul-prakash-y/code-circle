import React, { useState, useEffect } from 'react';
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
      toast.success('Profile updated successfully');
    } else {
      toast.error(res.error);
    }
  };

  if (!profile) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
      {/* Identity Header Card */}
      <div className="surface rounded-[18px] p-8 border border-separator shadow-card relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-separator bg-surface-elevated">
              <img 
                src={profile.profilePicUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=1D1D1F&color=fff&size=200`} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <Camera className="text-white" size={22} />
            </div>
            {profileLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={22} />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {profile.name}
              </h1>
              {profile.role && (
                <span className="inline-flex self-center sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-accent/10 text-accent border border-accent/20 uppercase">
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted flex items-center justify-center sm:justify-start gap-2">
              <Building2 size={14} className="opacity-70" />
              <span>Bannari Amman Institute of Technology</span>
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-text-muted">
              {profile.rollNo && (
                <span className="font-mono bg-canvas px-2.5 py-1 rounded-md border border-separator text-text-secondary">
                  Roll: {profile.rollNo}
                </span>
              )}
              {profile.department && (
                <span className="bg-canvas px-2.5 py-1 rounded-md border border-separator text-text-secondary">
                  {profile.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Basic Information */}
          <div className="surface rounded-[18px] p-6 sm:p-8 border border-separator shadow-card space-y-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Personal Details</h2>
              <p className="text-xs text-text-muted mt-0.5">Manage your student profile information</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Department</label>
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
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. 7376222AL101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Registered Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-field opacity-60 cursor-not-allowed bg-canvas"
                />
              </div>
            </div>
          </div>

          {/* Social & Coding Profiles */}
          <div className="surface rounded-[18px] p-6 sm:p-8 border border-separator shadow-card space-y-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Profiles & Handles</h2>
              <p className="text-xs text-text-muted mt-0.5">Connect your external developer platforms</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">GitHub Username or URL</label>
                <input
                  type="text"
                  name="socialLinks.github"
                  value={formData.socialLinks.github}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="github.com/username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn Profile</label>
                <input
                  type="text"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="linkedin.com/in/username"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">LeetCode</label>
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
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">HackerRank</label>
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
          </div>

        </div>

        {/* Skills & Technologies */}
        <div className="surface rounded-[18px] p-6 sm:p-8 border border-separator shadow-card space-y-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Skills & Technologies</h2>
            <p className="text-xs text-text-muted mt-0.5">Highlight your core competencies and frameworks</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                className="input-field pl-10"
                placeholder="Type skill & press Enter (e.g. React, PyTorch, Go)"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated text-text-primary border border-separator text-xs font-medium"
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="p-0.5 hover:bg-destructive/10 rounded text-text-muted hover:text-destructive transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {formData.skills.length === 0 && (
                <p className="text-text-muted text-xs">No skills listed yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-destructive hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out of session</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary py-2.5 px-5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 cursor-pointer"
            >
              {profileLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
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

