import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return <input className={cn("h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary", className)} {...props} />;
}
