import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "error";
export type BadgeSize = "sm" | "md";

const base = "inline-flex items-center rounded-full font-sans font-bold";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-hairline text-ink",
  primary: "bg-canvas-lavender text-primary",
  success: "bg-semantic-success-tint text-semantic-success",
  warning: "bg-semantic-warning-tint text-semantic-warning",
  error: "bg-semantic-error-tint text-semantic-error",
};

const SIZE: Record<BadgeSize, string> = {
  sm: "px-3 py-1 text-fine",
  md: "px-3 py-1 text-body",
};

export function badgeClass({
  tone = "neutral",
  size = "sm",
  className,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
} = {}): string {
  return cn(base, TONE[tone], SIZE[size], className);
}

export function Badge({
  tone = "neutral",
  size = "sm",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
}) {
  return <span className={badgeClass({ tone, size, className })} {...props} />;
}
