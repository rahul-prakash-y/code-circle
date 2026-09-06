import useAuthStore from './useAuthStore';

/**
 * useProfileStore acts as a synchronized adapter layer over the unified useAuthStore.
 * This guarantees 100% backward compatibility for existing profile components
 * while eliminating duplicate network requests and state desynchronization bugs.
 */
const useProfileStore = (selector) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const uploadProfilePic = useAuthStore((state) => state.uploadProfilePic);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const state = {
    profile: user,
    profileLoading: loading,
    profileError: error,
    fetchProfile: checkAuth,
    updateProfile,
    uploadProfilePic,
  };

  return selector ? selector(state) : state;
};

// Also attach getState for non-reactive direct calls
useProfileStore.getState = () => {
  const authState = useAuthStore.getState();
  return {
    profile: authState.user,
    profileLoading: authState.loading,
    profileError: authState.error,
    fetchProfile: authState.checkAuth,
    updateProfile: authState.updateProfile,
    uploadProfilePic: authState.uploadProfilePic,
  };
};

export default useProfileStore;
