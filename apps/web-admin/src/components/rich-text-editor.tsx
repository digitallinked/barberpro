"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Undo,
  Redo,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Minus,
  LinkIcon,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MediaLibrary, type MediaFile } from "./media-library";

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  className?: string;
};

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "pointer-events-none opacity-30"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <span className="mx-0.5 h-4 w-px bg-border" />;
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

// ─── Heading Select ───────────────────────────────────────────────────────────
function HeadingSelect({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const options = [
    { label: "Paragraph", action: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
    { label: "Heading 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { label: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
  ];

  const current = options.find((o) => o.active) ?? options[0];

  return (
    <select
      value={current.label}
      onChange={(e) => {
        const opt = options.find((o) => o.label === e.target.value);
        opt?.action();
      }}
      className="h-7 rounded border border-border bg-input px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.label} value={o.label}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Link Popover ─────────────────────────────────────────────────────────────
function LinkPopover({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  if (!editor) return null;

  function apply() {
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
    setOpen(false);
    setUrl("");
  }

  function openPopover() {
    setUrl(editor.getAttributes("link").href as string ?? "");
    setOpen(true);
  }

  return (
    <div className="relative">
      <ToolbarButton
        onClick={openPopover}
        active={editor.isActive("link")}
        title="Insert link"
      >
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-20 flex items-center gap-1 rounded-lg border border-border bg-card p-2 shadow-xl">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") apply(); if (e.key === "Escape") setOpen(false); }}
              placeholder="https://example.com"
              className="h-7 w-56 bg-transparent px-1 text-xs focus:outline-none"
            />
            <button type="button" onClick={apply} className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              Apply
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetLink().run(); setOpen(false); }}
                className="rounded p-1 text-muted-foreground hover:text-red-400"
                title="Remove link"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── YouTube Popover ──────────────────────────────────────────────────────────
function YoutubeButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  if (!editor) return null;

  function insert() {
    if (url.trim()) {
      editor.chain().focus().setYoutubeVideo({ src: url.trim(), width: 640, height: 360 }).run();
    }
    setOpen(false);
    setUrl("");
  }

  return (
    <div className="relative">
      <ToolbarButton onClick={() => setOpen(true)} active={false} title="Embed YouTube video">
        <YoutubeIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-20 flex items-center gap-1 rounded-lg border border-border bg-card p-2 shadow-xl">
            <YoutubeIcon className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") insert(); if (e.key === "Escape") setOpen(false); }}
              placeholder="https://youtube.com/watch?v=…"
              className="h-7 w-64 bg-transparent px-1 text-xs focus:outline-none"
            />
            <button type="button" onClick={insert} className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              Embed
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table Button ─────────────────────────────────────────────────────────────
function TableButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!editor) return null;

  function insert() {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
  }

  return (
    <div className="relative">
      <ToolbarButton onClick={() => setOpen(!open)} active={editor.isActive("table")} title="Insert table">
        <TableIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-20 space-y-2 rounded-lg border border-border bg-card p-3 shadow-xl">
            <p className="text-xs font-semibold text-foreground">Insert Table</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows</span>
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="h-7 w-14 rounded border border-border bg-input px-2 text-center text-xs focus:outline-none"
              />
              <span>Cols</span>
              <input
                type="number"
                min={1}
                max={10}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="h-7 w-14 rounded border border-border bg-input px-2 text-center text-xs focus:outline-none"
              />
            </div>
            <button type="button" onClick={insert} className="w-full rounded bg-primary py-1 text-xs font-medium text-primary-foreground">
              Insert
            </button>
            {editor.isActive("table") && (
              <div className="flex flex-wrap gap-1 border-t border-border pt-2">
                {[
                  { label: "+Col", action: () => editor.chain().focus().addColumnAfter().run() },
                  { label: "-Col", action: () => editor.chain().focus().deleteColumn().run() },
                  { label: "+Row", action: () => editor.chain().focus().addRowAfter().run() },
                  { label: "-Row", action: () => editor.chain().focus().deleteRow().run() },
                  { label: "Del Table", action: () => editor.chain().focus().deleteTable().run() },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => { b.action(); setOpen(false); }}
                    className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export function RichTextEditor({ name, defaultValue = "", className }: RichTextEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaInsertMode, setMediaInsertMode] = useState<"editor" | "cover">("editor");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-xl shadow-md my-4" },
        allowBase64: false,
      }),
      Youtube.configure({
        HTMLAttributes: { class: "w-full aspect-video rounded-xl overflow-hidden my-4" },
        nocookie: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Placeholder.configure({ placeholder: "Start writing your article…" }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[480px] px-5 py-4 focus:outline-none text-sm leading-relaxed " +
          "prose-headings:text-foreground prose-headings:font-bold " +
          "prose-p:text-muted-foreground prose-p:leading-8 " +
          "prose-a:text-primary prose-a:no-underline " +
          "prose-strong:text-foreground " +
          "prose-code:text-primary prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:text-[0.85em] " +
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl " +
          "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground " +
          "prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2 prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted",
      },
    },
  });

  const handleMediaSelect = useCallback(
    (file: MediaFile) => {
      if (!editor || mediaInsertMode !== "editor") return;
      editor.chain().focus().setImage({ src: file.url, alt: file.name.replace(/^\d+-/, "") }).run();
    },
    [editor, mediaInsertMode]
  );

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const charCount = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-3 py-2">

        {/* Heading select */}
        <HeadingSelect editor={editor} />
        <ToolbarSep />

        {/* Inline formatting */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (⌘B)">
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (⌘I)">
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (⌘U)">
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSep />

        {/* Alignment */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSep />

        {/* Lists + block */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
            <Code className="h-3.5 w-3.5 opacity-70" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal rule">
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSep />

        {/* Sub/Superscript */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
            <SubscriptIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
            <SuperscriptIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSep />

        {/* Insert */}
        <ToolbarGroup>
          <LinkPopover editor={editor} />
          <ToolbarButton
            onClick={() => { setMediaInsertMode("editor"); setMediaOpen(true); }}
            active={false}
            title="Insert image from Media Library"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <YoutubeButton editor={editor} />
          <TableButton editor={editor} />
        </ToolbarGroup>
        <ToolbarSep />

        {/* History */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            active={false}
            title="Undo (⌘Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            active={false}
            title="Redo (⌘⇧Z)"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* ── Editor content ── */}
      <EditorContent editor={editor} />

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
        <span>{wordCount} words · {charCount} characters</span>
        <span className="text-[10px]">Ctrl+B Bold · Ctrl+I Italic · Ctrl+K Link</span>
      </div>

      {/* Hidden input to carry HTML to form */}
      <input type="hidden" name={name} value={editor.getHTML()} />

      {/* Media library modal */}
      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleMediaSelect}
        selectLabel="Insert into Editor"
      />
    </div>
  );
}
