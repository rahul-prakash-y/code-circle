import { create } from 'zustand';
import api from '../lib/axios';

const useProfileStore = create((set, get) => ({
  profile: null,
  profileLoading: false,
  profileError: null,

  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      const response = await api.get('/users/me');
      set({ profile: response.data, profileLoading: false });
    } catch (error) {
      set({ 
        profileError: error.response?.data?.error || 'Failed to fetch profile', 
        profileLoading: false 
      });
    }
  },

  updateProfile: async (updates) => {
    set({ profileLoading: true, profileError: null });
    try {
      console.log('Sending updates to backend:', updates);
      const response = await api.put('/users/me', updates);
      console.log('Backend response:', response.data);
      set({ profile: response.data, profileLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      set({ profileError: errorMessage, profileLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  uploadProfilePic: async (file) => {
    set({ profileLoading: true, profileError: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url } = uploadRes.data;
      
      // Update the profile with the new URL
      const updateRes = await get().updateProfile({ profilePicUrl: url });
      
      if (updateRes.success) {
        set({ profileLoading: false });
        return { success: true, url };
      } else {
        throw new Error(updateRes.error);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
      set({ profileError: errorMessage, profileLoading: false });
      return { success: false, error: errorMessage };
    }
  }
}));

export default useProfileStore;
