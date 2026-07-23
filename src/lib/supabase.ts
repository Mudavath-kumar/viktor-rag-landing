// Supabase client stub — auth is now handled by our FastAPI backend.
// This file is kept as a stub to avoid breaking any remaining imports.
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
};
