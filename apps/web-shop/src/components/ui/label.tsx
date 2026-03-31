import { type LabelHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("text-sm font-medium text-foreground leading-none", className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";
