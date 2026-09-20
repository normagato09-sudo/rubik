import Link from "next/link";
import type { Route } from "next";
import { ChevronRightIcon } from "@/components/ui/icons";

export function QuickLinkCard({
  href,
  title,
  description,
}: {
  href: Route;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent/30 hover:bg-surface-2"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-sm text-muted">{description}</span>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
    </Link>
  );
}
