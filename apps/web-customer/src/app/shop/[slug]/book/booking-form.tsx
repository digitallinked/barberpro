"use client";

import { useActionState, useState } from "react";
import { CalendarCheck, Clock, User, AlertCircle, CheckCircle2, Scissors, ChevronRight } from "lucide-react";

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
  const [step, setStep] = useState<"service" | "details">("service");

  const service = services.find((s) => s.id === selectedService);
  const today = new Date().toISOString().split("T")[0]!;

  if (step === "service") {
    return (
      <div className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Choose a Service</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Select the service you&apos;d like to book
        </p>

        <div className="space-y-3">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedService(s.id);
                setStep("details");
              }}
              className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm ${
                selectedService === s.id
                  ? "border-primary/60 bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {s.duration_min} min
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-primary">RM {Number(s.price).toFixed(2)}</p>
                <ChevronRight className="ml-auto mt-0.5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="service" value={selectedService} />

      {/* Selected service summary */}
      {service && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div>
            <p className="font-semibold text-primary">{service.name}</p>
            <p className="text-sm text-muted-foreground">
              RM {Number(service.price).toFixed(2)} &middot; {service.duration_min} min
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("service")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Change
          </button>
        </div>
      )}

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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Confirming Booking…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirm Booking
          </span>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Your booking will be confirmed instantly. Check your profile for details.
      </p>
    </form>
  );
}
