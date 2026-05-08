"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

const navItems = [
  { label: "개요", href: "/dashboard" },
  { label: "PCF", href: "/dashboard/pcf" },
  { label: "활동 데이터", href: "/dashboard/activity-data" },
  { label: "배출 계수", href: "/dashboard/emission-factor" },
] as const;

export type DashboardTopBarProps = {
  title: string;
  description: string;
};

export function DashboardTopBar({ title, description }: DashboardTopBarProps) {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          PCF
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <nav
        className="flex flex-wrap items-center gap-2"
        aria-label="대시보드 섹션"
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className={
                active
                  ? "ring-1 ring-violet-500/25 dark:ring-violet-400/20"
                  : "text-muted-foreground"
              }
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>
      <Separator className="sm:hidden" />
    </header>
  );
}
