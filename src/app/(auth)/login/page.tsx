import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata = { title: "Entrar — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const rpps = await prisma.institutoRpps.findFirst();
  const hasCustomLogo = !!(rpps?.logoPath);
  const nomeInstituto = rpps?.nomeInstituto ?? "Santana Previdência";

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-10 dark:from-primary/10 dark:via-background dark:to-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          {hasCustomLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${rpps!.logoPath}?t=${Date.now()}`}
              alt={nomeInstituto}
              className="h-20 w-auto sm:h-24 object-contain"
            />
          ) : (
            <Logo variant="full" priority className="h-20 sm:h-24" />
          )}
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            {rpps?.nomeDepartamento ?? "Divisão de Arrecadação"} · RPPS
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Acesso ao sistema</CardTitle>
            <CardDescription>
              Informe suas credenciais institucionais para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Santana Previdência. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
