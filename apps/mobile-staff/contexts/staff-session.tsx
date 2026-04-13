import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { resolveStaffSession, type StaffSession } from "../lib/auth";

type StaffSessionContextValue = {
  session: StaffSession | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clearSession: () => void;
};

const StaffSessionContext = createContext<StaffSessionContextValue>({
  session: null,
  isLoading: true,
  refresh: async () => {},
  clearSession: () => {},
});

export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession() {
    setIsLoading(true);
    const resolved = await resolveStaffSession(supabase);
    setSession(resolved);
    setIsLoading(false);
  }

  function clearSession() {
    setSession(null);
  }

  useEffect(() => {
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) {
        setSession(null);
        setIsLoading(false);
      } else {
        loadSession();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <StaffSessionContext.Provider
      value={{ session, isLoading, refresh: loadSession, clearSession }}
    >
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  return useContext(StaffSessionContext);
}
