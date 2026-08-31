import { IconScan } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * The mark, on its own.
 *
 * Also the shape every other mark in the system borrows — the mail on the sent
 * screen, the alert on the expired one. Same square, same radius, different
 * colour and glyph, which is why it takes children.
 */
export function Mark({
  children,
  className,
  size = "sm",
}: {
  children?: React.ReactNode;
  className?: string;
  /** `sm` sits in a header; `lg` opens a card. */
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        size === "sm" ? "size-6 rounded-lg" : "size-10 rounded-xl",
        className
      )}
    >
      {children ?? <IconScan size={size === "sm" ? 15 : 20} stroke={2} />}
    </span>
  );
}

/** The mark and the name, as they appear in the header and in the sidebar. */
export function Brand() {
  return (
    <span className="flex items-center gap-2">
      <Mark />
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        bugsniff
      </span>
    </span>
  );
}
