"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WalkInQueueModalContextValue = {
  /** Increments whenever the user requests the New Walk-in modal (e.g. from the header). */
  openRequestId: number;
  requestOpenNewWalkIn: () => void;
};

const WalkInQueueModalContext = createContext<WalkInQueueModalContextValue | null>(null);

export function WalkInQueueModalProvider({ children }: { children: ReactNode }) {
  const [openRequestId, setOpenRequestId] = useState(0);
  const requestOpenNewWalkIn = useCallback(() => {
    setOpenRequestId((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ openRequestId, requestOpenNewWalkIn }),
    [openRequestId, requestOpenNewWalkIn]
  );

  return (
    <WalkInQueueModalContext.Provider value={value}>{children}</WalkInQueueModalContext.Provider>
  );
}

export function useWalkInQueueModal() {
  const ctx = useContext(WalkInQueueModalContext);
  if (!ctx) {
    throw new Error("useWalkInQueueModal must be used within WalkInQueueModalProvider");
  }
  return ctx;
}
