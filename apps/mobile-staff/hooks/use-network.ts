import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { replayOfflineQueue, getPendingCount } from "../lib/offline-queue";

export type NetworkState = {
  isOnline: boolean;
  isOffline: boolean;
  pendingCount: number;
};

/**
 * Tracks network connectivity and automatically replays queued offline mutations
 * when the connection is restored. Also exposes a count of pending mutations.
 */
export function useNetwork(): NetworkState {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true); // optimistic; corrected immediately below
  const [pendingCount, setPendingCount] = useState(0);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
    // Seed accurate initial connectivity state before the first NetInfo event fires
    NetInfo.fetch().then((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        const replayed = await replayOfflineQueue();
        if (replayed > 0) {
          queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["queue-count"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }
      } else if (!online) {
        wasOfflineRef.current = true;
      }

      const count = await getPendingCount();
      setPendingCount(count);
    });

    return unsubscribe;
  }, [queryClient]);

  return { isOnline, isOffline: !isOnline, pendingCount };
}
