"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { bookAppointmentAction } from "./actions";

type Props = {
  tenantId: string;
  slug: string;
  services: { id: string; name: string; price: number; duration_min: number }[];
  staff: { id: string; name: string }[];
  branches: { id: string; name: string }[];
};

export function BookingForm({ tenantId, slug, services, staff, branches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const service = services.find((s) => s.id === selectedService);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await bookAppointmentAction({
        tenantId,
        branchId: formData.get("branch") as string,
        serviceId: formData.get("service") as string,
        staffId: (formData.get("barber") as string) || null,
        date: formData.get("date") as string,
        time: formData.get("time") as string,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/shop/${slug}?booked=true`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {branches.length > 1 && (
        <div>
          <label htmlFor="branch" className="block text-sm font-medium">Branch</label>
          <select
            id="branch"
            name="branch"
            required
            defaultValue={branches[0]?.id}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      {branches.length === 1 && (
        <input type="hidden" name="branch" value={branches[0]!.id} />
      )}

      <div>
        <label htmlFor="service" className="block text-sm font-medium">Service</label>
        <select
          id="service"
          name="service"
          required
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — RM {Number(s.price).toFixed(2)} ({s.duration_min} min)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="barber" className="block text-sm font-medium">
          Barber <span className="text-muted-foreground">(optional)</span>
        </label>
        <select
          id="barber"
          name="barber"
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">Any available</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">Time</label>
          <input
            id="time"
            name="time"
            type="time"
            required
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {service && (
        <div className="rounded-md bg-accent/5 p-4 text-sm">
          <p className="font-medium">{service.name}</p>
          <p className="text-muted-foreground">
            RM {Number(service.price).toFixed(2)} &middot; {service.duration_min} min
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !selectedService}
        className="w-full rounded-md bg-accent py-2.5 font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
      >
        {isPending ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
}
