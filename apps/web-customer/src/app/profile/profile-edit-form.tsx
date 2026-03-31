"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { updateProfileAction } from "./actions";

interface Props {
  initialName: string;
  initialPhone: string;
}

export function ProfileEditForm({ initialName, initialPhone }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setSaved(false);
    setError("");
    setEditing(true);
  }

  function handleCancel() {
    setName(initialName);
    setPhone(initialPhone);
    setError("");
    setEditing(false);
  }

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateProfileAction({ full_name: name, phone });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setEditing(false);
    });
  }

  const inputClass =
    "block w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  if (editing) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmad bin Ali"
              autoFocus
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60 12-345 6789"
              type="tel"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs text-primary">
          <Check className="h-3.5 w-3.5" />
          Profile updated successfully
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Name</span>
        <span className="font-medium">{name || "—"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Phone</span>
        <span className="font-medium">{phone || "—"}</span>
      </div>
      <div className="pt-1">
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Pencil className="h-3 w-3" />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
