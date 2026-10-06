import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
        secondary: "border-transparent bg-white/10 text-zinc-300 hover:bg-white/15",
        destructive: "border-transparent bg-rose-500/20 text-rose-300 border-rose-500/30",
        outline: "text-zinc-300 border-white/20",
        gold: "border-amber-500/30 bg-amber-500/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
