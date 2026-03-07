import { BRAND_NAME } from "@barberpro/ui";

export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/25 text-primary">
        <span className="text-xs font-bold">BP</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{BRAND_NAME}</p>
        <p className="text-xs text-muted-foreground">Super Admin</p>
      </div>
    </div>
  );
}
