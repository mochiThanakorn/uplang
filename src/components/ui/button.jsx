import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "hover:bg-muted",
      },
      size: { default: "h-11 px-4", icon: "size-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, type = "button", ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
