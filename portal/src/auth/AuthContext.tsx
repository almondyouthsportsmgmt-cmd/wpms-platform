import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem("wpms-demo-user");
      if (saved) setDemoUser(JSON.parse(saved) as User);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const user = {
        id: "demo-owner",
        app_metadata: {},
        user_metadata: { first_name: "Lisa", role: "Owner" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email,
      } as User;
      localStorage.setItem("wpms-demo-user", JSON.stringify(user));
      setDemoUser(user);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem("wpms-demo-user");
      setDemoUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    user: session?.user ?? demoUser,
    session,
    loading,
    isDemo: !isSupabaseConfigured,
    signIn,
    signOut,
  }), [session, demoUser, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
