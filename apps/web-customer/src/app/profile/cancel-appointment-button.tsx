"use client";

import { useTransition, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cancelAppointmentAction } from "./actions";

type Props = {
  appointmentId: string;
};

export function CancelAppointmentButton({ appointmentId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  if (cancelled) return null;

  function handleCancel() {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId);
      if (!result.success) {
        setError(result.error);
      } else {
        setCancelled(true);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
        title="Cancel appointment"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Cancel
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
