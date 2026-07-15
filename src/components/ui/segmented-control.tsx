import Link from "next/link";
import { cn } from "@/lib/cn";

export type SegmentedItem = {
  label: string;
  href: string;
  active: boolean;
};

export function SegmentedControl({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: SegmentedItem[];
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex rounded-pill border border-hairline bg-canvas p-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "rounded-pill px-4 py-1.5 font-sans text-body font-bold transition-colors",
            item.active
              ? "bg-primary text-on-primary"
              : "text-ink hover:bg-canvas-lavender",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function filterChipClass({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "rounded-pill px-4 py-2 font-sans text-body font-bold transition-colors",
    active
      ? "bg-primary text-on-primary"
      : "bg-canvas text-ink border border-hairline hover:bg-canvas-lavender",
    className,
  );
}
