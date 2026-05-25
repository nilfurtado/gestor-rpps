"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/permissions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  orgaos: "Órgãos",
  lancamentos: "Lançamentos",
  novo: "Novo",
  relatorios: "Relatórios",
  mensal: "Mensal",
  anual: "Anual",
  orgao: "Por órgão",
  patronal: "Patronal",
  segurado: "Segurado",
  inadimplencia: "Inadimplência / RPPS",
};

function humanize(segment: string) {
  return LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface TopbarProps {
  userName: string | null;
  userEmail: string | null;
  userRole: Role | null;
}

export function Topbar({ userName, userEmail, userRole }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="hidden flex-1 items-center gap-1 pl-12 text-sm text-muted-foreground sm:flex lg:pl-0"
      >
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          return (
            <span key={href} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 opacity-50" /> : null}
              {last ? (
                <span className="font-medium text-foreground">{humanize(seg)}</span>
              ) : (
                <Link
                  href={href}
                  className="rounded px-1 hover:bg-secondary hover:text-foreground"
                >
                  {humanize(seg)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" aria-label="Conta do usuário">
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden max-w-[12rem] truncate sm:inline">
                {userName ?? userEmail ?? "Usuário"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {userName ?? "Usuário"}
                </span>
                {userEmail ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                ) : null}
                {userRole ? (
                  <Badge variant="outline" className="mt-1 w-fit border-primary/30 bg-primary/10 text-primary">
                    {ROLE_LABEL[userRole]}
                  </Badge>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
