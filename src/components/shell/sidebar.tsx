"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarRange,
  FileBarChart,
  Handshake,
  LayoutDashboard,
  Landmark,
  Receipt,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { Logo, LogoTextOnly } from "@/components/brand/logo";
import { useLogo } from "@/lib/logo-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavRule = (role: Role | null | undefined) => boolean;

const visibleToAll: NavRule = () => true;
const gestorOnly: NavRule = (r) => r === "GESTOR";

const NAV_PRINCIPAL: { href: string; label: string; icon: React.ElementType; color: string; visible: NavRule }[] = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard, color: "#3b82f6", visible: visibleToAll }, // Azul
  { href: "/lancamentos", label: "Lançamentos",  icon: Receipt,         color: "#10b981", visible: visibleToAll }, // Verde
  { href: "/acordos",     label: "Acordos",      icon: Handshake,       color: "#f59e0b", visible: visibleToAll }, // Âmbar
  { href: "/relatorios",  label: "Relatórios",   icon: FileBarChart,    color: "#ef4444", visible: visibleToAll }, // Vermelho
  { href: "/orgaos",      label: "Órgãos",       icon: Building2,       color: "#8b5cf6", visible: visibleToAll }, // Roxo
  { href: "/exercicios",  label: "Exercícios",   icon: CalendarRange,   color: "#ec4899", visible: visibleToAll }, // Rosa
  { href: "/usuarios",    label: "Usuários",     icon: Users,           color: "#06b6d4", visible: gestorOnly   }, // Ciano
];

const NAV_INSTITUCIONAL: { href: string; label: string; icon: React.ElementType; color: string; visible: NavRule }[] = [
  { href: "/rpps", label: "Informações do RPPS", icon: Landmark, color: "#14b8a6", visible: gestorOnly }, // Teal
];

function NavItem({
  href,
  label,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" style={{ color }} />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);
  const { logoSrc } = useLogo();

  const close = () => setOpenMobile(false);

  const navPrincipal = NAV_PRINCIPAL.filter((i) => i.visible(role));
  const navInstitucional = NAV_INSTITUCIONAL.filter((i) => i.visible(role));

  return (
    <>
      {/* Mobile trigger */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-40 lg:hidden"
        onClick={() => setOpenMobile(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay mobile */}
      {openMobile ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out",
          openMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt="Santana Previdência"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <Logo variant="mark" className="h-10" />
            )}
            <LogoTextOnly />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={close}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu principal">
          {/* Principal */}
          <div className="space-y-0.5">
            {navPrincipal.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                color={item.color}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onClick={close}
              />
            ))}
          </div>

          {/* Seção Institucional (só aparece se houver itens visíveis) */}
          {navInstitucional.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-3 bg-sidebar-border" />
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                Institucional
              </p>
              <div className="space-y-0.5">
                {navInstitucional.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    color={item.color}
                    active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    onClick={close}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <span className="block font-semibold uppercase tracking-wide text-primary">
              Santana Previdência
            </span>
            Divisão de Arrecadação · RPPS
          </div>
        </div>
      </aside>
    </>
  );
}
