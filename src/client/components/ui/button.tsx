import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-ink shadow-hard-sm hover:bg-primary/90 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-ink shadow-hard-sm hover:bg-secondary/80 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline:
          "border-2 border-ink bg-background shadow-hard-sm hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
