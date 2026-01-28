/**
 * Simple local-only pseudo "auth" hook
 * No actual authentication - just for UI consistency
 * All data is stored locally on device
 */

export const useAuth = () => {
  return {
    user: null,
    session: null,
    loading: false,
    signOut: async () => {},
    isAuthenticated: false,
  };
};
