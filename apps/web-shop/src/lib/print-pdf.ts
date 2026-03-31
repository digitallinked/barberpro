/**
 * Opens a print dialog so the user can save as PDF (browser "Save as PDF").
 * Same pattern as queue ticket print — no server-side PDF dependency.
 */
export function openPrintableDocument(html: string, title = "Document"): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>`
  );
  win.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
