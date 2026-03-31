"use client";

import { useActionState, useState } from "react";
import { CalendarCheck, Clock, Scissors, User, AlertCircle } from "lucide-react";

import {
  bookAppointmentAction,
  type BookAppointmentState,
} from "./actions";

type Props = {
  slug: string;
  services: { id: string; name: string; price: number; duration_min: number }[];
  staff: { id: string; name: string }[];
  branches: { id: string; name: string }[];
};

export function BookingForm({ slug, services, staff, branches }: Props) {
  const [state, formAction, isPending] = useActionState(
    bookAppointmentAction,
    null as BookAppointmentState
  );

  const [selectedService, setSelectedService] = useState("");

  const service = services.find((s) => s.id === selectedService);

  const today = new Date().toISOString().split("T")[0]!;

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="slug" value={slug} />

      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Branch select */}
      {branches.length > 1 && (
        <div>
          <label htmlFor="branch" className="mb-1.5 block text-sm font-medium">
            Branch
          </label>
          <select
            id="branch"
            name="branch"
            required
            defaultValue={branches[0]?.id}
            className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {branches.length === 1 && (
        <input type="hidden" name="branch" value={branches[0]!.id} />
      )}

      {/* Service select */}
      <div>
        <label htmlFor="service" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
          <Scissors className="h-3.5 w-3.5 text-primary" /> Service
        </label>
        <select
          id="service"
          name="service"
          required
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Choose a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — RM {Number(s.price).toFixed(2)} ({s.duration_min} min)
            </option>
          ))}
        </select>
      </div>

      {/* Barber select */}
      <div>
        <label htmlFor="barber" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
          <User className="h-3.5 w-3.5 text-primary" /> Barber{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <select
          id="barber"
          name="barber"
          className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Any available barber</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={today}
            className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="time" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" /> Time
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Service summary */}
      {service && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold text-primary">{service.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            RM {Number(service.price).toFixed(2)} &middot; {service.duration_min} min
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !selectedService}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Confirming Booking…" : "Confirm Booking"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Your booking will be confirmed instantly. Check your profile for details.
      </p>
    </form>
  );
}
