"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@barberpro/notifications";

const QUERY_KEY = "shop-notifications";
const PAGE_SIZE = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function fetchNotifications(): Promise<NotificationRow[]> {
  const supabase = createBrowserSupabaseClient() as AnyClient;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

/**
 * Provides notifications for the current staff user, with live Realtime updates.
 * Exposes helpers to mark notifications read.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  });

  // Realtime: invalidate when the current user receives a new notification.
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel("shop-notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createBrowserSupabaseClient() as AnyClient;
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const supabase = createBrowserSupabaseClient() as AnyClient;
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.is_read).length;

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    markRead: (ids: string[]) => markRead.mutate(ids),
    markAllRead: () => markAllRead.mutate(),
  };
}
