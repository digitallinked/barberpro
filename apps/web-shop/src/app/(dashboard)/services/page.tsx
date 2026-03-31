"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Scissors, Trash2 } from "lucide-react";

import { createService, createServiceCategory, deleteService } from "@/actions/catalog";
import { useServiceCategories, useServices } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export default function ServicesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: servicesResult, isLoading } = useServices();
  const { data: categoriesResult } = useServiceCategories();

  const services = servicesResult?.data ?? [];
  const categories = categoriesResult?.data?.filter((c) => c.is_active) ?? [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryPending, setCategoryPending] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  async function handleCreateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createService(formData);
    setPending(false);

    if (result.success) {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setSuccess(t.common.success);
      return;
    }

    setError(result.error ?? t.common.error);
  }

  async function handleDeactivateService(id: string) {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await deleteService(id);
    setPending(false);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setSuccess(t.common.success);
      return;
    }

    setError(result.error ?? t.common.error);
  }

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCategoryError(null);
    setCategorySuccess(null);
    setCategoryPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createServiceCategory(formData);
    setCategoryPending(false);

    if (result.success) {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      setCategorySuccess(t.common.success);
      return;
    }

    setCategoryError(result.error ?? t.common.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t.services.title}</h2>
        <p className="mt-1 text-sm text-gray-400">{t.services.subtitle}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-lg font-bold text-white">{t.services.addService}</h3>
          </div>

          <form onSubmit={handleCreateService} className="space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}
            {success && (
              <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{success}</div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">{t.services.serviceName}</label>
              <input
                name="name"
                required
                placeholder="Haircut"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.services.duration} (min)</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  name="duration_min"
                  defaultValue={30}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.services.price} (RM)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  name="price"
                  defaultValue={0}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">{t.services.category} ({t.queue.optional})</label>
                <select
                name="category_id"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="">—</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
            >
              {pending ? `${t.common.save}...` : t.services.addService}
            </button>
          </form>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-lg font-bold text-white">{t.services.category}</h3>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {categoryError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{categoryError}</div>
              )}
              {categorySuccess && (
                <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                  {categorySuccess}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.services.category}</label>
                <input
                  name="name"
                  required
                  placeholder="Hair"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                disabled={categoryPending}
                className="w-full rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-2.5 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:opacity-50"
              >
                {categoryPending ? `${t.common.save}...` : `+ ${t.services.category}`}
              </button>
            </form>
          </Card>
        </div>

        <Card className="p-6 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-lg font-bold text-white">{t.services.title}</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-[#111] px-4 py-8 text-center text-sm text-gray-400">
              {t.services.noServices}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#111] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{service.name}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {service.duration_min} min • RM {service.price} • {categoryMap.get(service.category_id ?? "") ?? "No category"}
                    </p>
                    <p className="mt-1 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          service.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {service.is_active ? t.services.active : t.services.inactive}
                      </span>
                    </p>
                  </div>
                  {service.is_active ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDeactivateService(service.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      {t.common.delete}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
