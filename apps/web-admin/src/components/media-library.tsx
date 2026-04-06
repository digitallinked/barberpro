"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Upload,
  X,
  Check,
  Trash2,
  Copy,
  Image as ImageIcon,
  Search,
  RefreshCw,
  FileImage,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

export type MediaFile = {
  name: string;
  id: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when the user clicks "Insert" or "Use as cover" */
  onSelect: (file: MediaFile) => void;
  /** Label for the select button, e.g. "Insert into Editor" or "Use as Cover Image" */
  selectLabel?: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MediaLibrary({ open, onClose, onSelect, selectLabel = "Insert" }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; done: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const json = await res.json() as { files?: MediaFile[]; error?: string };
      if (json.files) setFiles(json.files);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(null);
      fetchFiles();
    }
  }, [open, fetchFiles]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;

    setUploadError(null);
    setUploading(true);
    setUploadProgress(arr.map((f) => ({ name: f.name, done: false })));

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string; name?: string; size?: number; mimeType?: string };

      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed");
      } else {
        setUploadProgress((p) => p.map((x, idx) => idx === i ? { ...x, done: true } : x));
      }
    }

    setUploading(false);
    setUploadProgress([]);
    await fetchFiles();
  }, [fetchFiles]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  async function handleDelete(file: MediaFile) {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    setDeleting(file.name);
    await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name }),
    });
    setDeleting(null);
    if (selected?.name === file.name) setSelected(null);
    startTransition(() => { fetchFiles(); });
  }

  async function handleCopyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-bold">Media Library</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                  Upload, browse, and manage blog images
                </Dialog.Description>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left panel — upload + grid */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  {/* Search */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by filename…"
                      className="h-8 w-full rounded-md border border-border bg-input pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{filtered.length} files</span>
                    <button
                      type="button"
                      onClick={fetchFiles}
                      disabled={loading}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Upload error */}
                {uploadError && (
                  <div className="flex shrink-0 items-center gap-2 border-b border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {uploadError}
                    <button type="button" onClick={() => setUploadError(null)} className="ml-auto">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Upload progress */}
                {uploadProgress.length > 0 && (
                  <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-2">
                    {uploadProgress.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 text-xs">
                        {f.done ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        )}
                        <span className="truncate text-muted-foreground">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone + grid */}
                <div
                  ref={dropZoneRef}
                  className={`relative flex-1 overflow-y-auto p-4 transition-colors ${dragOver ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {/* Drag overlay */}
                  {dragOver && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10">
                      <div className="text-center">
                        <Upload className="mx-auto h-10 w-10 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-primary">Drop images here</p>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <FileImage className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {search ? "No files match your search" : "No images yet"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {search ? "Try a different search term." : "Upload images or drag & drop them here."}
                        </p>
                      </div>
                      {!search && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Upload your first image
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                      {filtered.map((file) => (
                        <MediaTile
                          key={file.name}
                          file={file}
                          isSelected={selected?.name === file.name}
                          isDeleting={deleting === file.name}
                          onClick={() => setSelected((s) => s?.name === file.name ? null : file)}
                          onDelete={() => handleDelete(file)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel — detail */}
              <div className="hidden w-72 shrink-0 flex-col border-l border-border bg-card md:flex">
                {selected ? (
                  <FileDetail
                    file={selected}
                    selectLabel={selectLabel}
                    copied={copied}
                    onSelect={() => { onSelect(selected); onClose(); }}
                    onCopyUrl={() => handleCopyUrl(selected.url)}
                    onDelete={() => handleDelete(selected)}
                    deleting={deleting === selected.name}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Select an image to see details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile bottom bar */}
            {selected && (
              <div className="flex shrink-0 items-center justify-between border-t border-border bg-card p-3 md:hidden">
                <p className="truncate text-xs text-muted-foreground">{selected.name}</p>
                <button
                  type="button"
                  onClick={() => { onSelect(selected); onClose(); }}
                  className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {selectLabel}
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MediaTile({
  file,
  isSelected,
  isDeleting,
  onClick,
  onDelete,
}: {
  file: MediaFile;
  isSelected: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
        isSelected
          ? "border-primary shadow-md shadow-primary/20"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted/50">
        <img
          src={file.url}
          alt={file.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Delete button */}
      {!isDeleting ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute left-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-md bg-red-500/80 text-white backdrop-blur-sm transition hover:bg-red-600 group-hover:flex"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : (
        <div className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-muted/80 backdrop-blur-sm">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Filename */}
      <div className="bg-card/90 px-2 py-1 backdrop-blur-sm">
        <p className="truncate text-[10px] text-muted-foreground">{file.name.replace(/^\d+-/, "")}</p>
      </div>
    </div>
  );
}

function FileDetail({
  file,
  selectLabel,
  copied,
  onSelect,
  onCopyUrl,
  onDelete,
  deleting,
}: {
  file: MediaFile;
  selectLabel: string;
  copied: boolean;
  onSelect: () => void;
  onCopyUrl: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Preview */}
      <div className="flex aspect-square shrink-0 items-center justify-center bg-muted/30 p-3">
        <img
          src={file.url}
          alt={file.name}
          className="max-h-full max-w-full rounded-md object-contain shadow-md"
        />
      </div>

      {/* Metadata */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filename</p>
          <p className="mt-1 break-all text-sm text-foreground">{file.name.replace(/^\d+-/, "")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size</p>
            <p className="mt-1 text-sm">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</p>
            <p className="mt-1 text-sm">{file.mimeType.replace("image/", "").toUpperCase()}</p>
          </div>
        </div>
        {file.createdAt && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uploaded</p>
            <p className="mt-1 text-sm">{formatDate(file.createdAt)}</p>
          </div>
        )}

        {/* URL */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</p>
          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-border bg-input px-2 py-1.5">
            <p className="flex-1 truncate text-xs text-muted-foreground">{file.url}</p>
            <button
              type="button"
              onClick={onCopyUrl}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <button
          type="button"
          onClick={onSelect}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {selectLabel}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="w-full rounded-md bg-red-500/10 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * A compact button that opens the media library.
 * Useful inline inside forms.
 */
export function MediaPickerButton({
  onSelect,
  label = "Choose from Media Library",
  className,
}: {
  onSelect: (file: MediaFile) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className ?? ""}`}
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className="h-3 w-3" />
      </button>
      <MediaLibrary
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(f) => { onSelect(f); setOpen(false); }}
        selectLabel="Use Image"
      />
    </>
  );
}
