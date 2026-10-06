import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 hover:shadow-emerald-500/40",
        destructive:
          "bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-500",
        outline:
          "border border-white/10 bg-white/5 backdrop-blur-xl text-zinc-100 hover:bg-white/10 hover:border-emerald-500/40",
        secondary:
          "bg-white/10 text-zinc-100 hover:bg-white/15 backdrop-blur-md",
        ghost:
          "text-zinc-300 hover:bg-white/5 hover:text-white",
        glass:
          "bg-zinc-900/40 backdrop-blur-xl border border-white/10 text-white hover:border-emerald-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
