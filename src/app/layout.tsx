import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider, type Theme } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Santana Previdência — Gestão de Arrecadação Previdenciária",
  description:
    "Sistema de Gestão de Arrecadação Previdenciária da Santana Previdência",
  icons: { icon: "/logo-sanprev-mark.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Lê o tema do cookie no servidor — evita FOUC sem precisar de <script> JSX
  const cookieStore = await cookies();
  const initialTheme: Theme =
    cookieStore.get("sanprev_theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${initialTheme} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{ duration: 4000 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
