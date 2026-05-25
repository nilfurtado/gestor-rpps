import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoProvider } from "@/lib/logo-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, rpps] = await Promise.all([
    auth(),
    prisma.institutoRpps.findFirst(),
  ]);

  return (
    <LogoProvider initialLogoPath={rpps?.logoPath ?? null}>
      <div className="flex min-h-dvh w-full">
        <Sidebar role={session?.user?.role ?? null} />
        <div className="flex flex-1 flex-col lg:pl-64">
          <Topbar
            userName={session?.user?.name ?? null}
            userEmail={session?.user?.email ?? null}
            userRole={session?.user?.role ?? null}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </LogoProvider>
  );
}
