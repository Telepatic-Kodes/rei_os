import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/client-layout";
import { BrutalistToaster } from "@/components/brutalist-toaster";
import { DashboardHeader } from "@/components/dashboard-header";
import { AlertBanner } from "@/components/alert-banner";
import { ProjectProvider } from "@/contexts/project-context";
import { Suspense } from "react";
import { CommandPalette } from "@/components/command-palette";
import { QuickActions } from "@/components/quick-actions";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AIAIAI Consulting — Dashboard",
  description: "Monitoreo de proyectos, tokens y calidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-[family-name:var(--font-jetbrains)]`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectProvider>
            <KeyboardShortcutsProvider>
              <ClientLayout
                alertBanner={<AlertBanner />}
                header={<DashboardHeader />}
              >
                {children}
              </ClientLayout>
              <BrutalistToaster />
              <CommandPalette />
              <QuickActions />
              <KeyboardShortcutsHelp />
            </KeyboardShortcutsProvider>
          </ProjectProvider>
        </Suspense>
      </body>
    </html>
  );
}
