import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthResult {
  error?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: "google" | "github") => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const DEMO_KEY = "genko.demoUser";

const AuthContext = createContext<AuthContextValue | null>(null);

function readDemoUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(readDemoUser());
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user) {
        setUser({
          id: s.user.id,
          email: s.user.email ?? "",
          name: (s.user.user_metadata?.name as string | undefined) ?? undefined,
        });
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? "",
              name:
                (session.user.user_metadata?.name as string | undefined) ??
                undefined,
            }
          : null,
      );
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const demoMode = !isSupabaseConfigured;

    async function signIn(email: string, password: string) {
      if (demoMode || !supabase) {
        if (!email || password.length < 4)
          return { error: "Credenciales inválidas (demo)." };
        const u = { id: "demo-user", email };
        localStorage.setItem(DEMO_KEY, JSON.stringify(u));
        setUser(u);
        return {};
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message };
    }

    async function signUp(email: string, password: string) {
      if (demoMode || !supabase) {
        if (!email || password.length < 4)
          return { error: "Usa un email y una contraseña de 4+ caracteres." };
        const u = { id: "demo-user", email };
        localStorage.setItem(DEMO_KEY, JSON.stringify(u));
        setUser(u);
        return {};
      }
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message };
    }

    async function signInWithOAuth(provider: "google" | "github") {
      if (demoMode || !supabase) {
        const u = { id: "demo-user", email: `demo@${provider}.com` };
        localStorage.setItem(DEMO_KEY, JSON.stringify(u));
        setUser(u);
        return {};
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      return { error: error?.message };
    }

    async function signOut() {
      if (demoMode || !supabase) {
        localStorage.removeItem(DEMO_KEY);
        setUser(null);
        return;
      }
      await supabase.auth.signOut();
    }

    return {
      user,
      loading,
      demoMode,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
