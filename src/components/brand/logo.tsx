import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
}

export function Logo({ variant = "full", className, priority = false }: LogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo-sanprev-mark.svg"
        alt="Santana Previdência"
        width={140}
        height={148}
        priority={priority}
        className={cn("h-auto w-auto", className)}
      />
    );
  }
  return (
    <Image
      src="/logo-sanprev.svg"
      alt="Santana Previdência - Sistema de Gestão Previdenciária"
      width={560}
      height={148}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );
}

export function LogoTextOnly({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">
        Sistema
      </span>
      <span className="text-base font-black tracking-tight text-primary">
        Santana Previdência
      </span>
    </div>
  );
}
