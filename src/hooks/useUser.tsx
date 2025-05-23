
"use client";

import { useEffect, useState, createContext, useContext } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types'; // Your custom user profile type

type AuthUserContextType = {
  user: (User & { profile: UserProfile | null }) | null;
  isLoading: boolean;
  error: any | null;
};

const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<(User & { profile: UserProfile | null }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserSessionAndProfile = async () => {
      setIsLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching user:", userError);
        setError(userError);
        setIsLoading(false);
        return;
      }

      if (user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
          console.error('Error fetching user profile in hook:', profileError);
          // Potentially set user without profile or handle error
          setUser({ ...user, profile: null });
          setError(profileError);
        } else {
          setUser({ ...user, profile: userProfile as UserProfile | null });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    fetchUserSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (session?.user) {
        setIsLoading(true); // Start loading when session changes
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching user profile on auth change:', profileError);
          setUser({ ...session.user, profile: null });
           setError(profileError);
        } else {
          setUser({ ...session.user, profile: userProfile as UserProfile | null });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthUserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthUserProvider');
  }
  return context;
}

// You would wrap your RootLayout or a specific part of your app with <AuthUserProvider>
// For example, in app/layout.tsx:
// import { AuthUserProvider } from '@/hooks/useUser';
// ...
// <AuthUserProvider>
//   {children}
// </AuthUserProvider>
    