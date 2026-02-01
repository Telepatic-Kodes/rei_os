import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardHeader } from "@/components/dashboard-header";
import { AlertBanner } from "@/components/alert-banner";
import { ProjectProvider } from "@/contexts/project-context";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectProvider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8">
                <AlertBanner />
                <DashboardHeader />
                {children}
              </main>
            </div>
            <Toaster />
          </ProjectProvider>
        </Suspense>
      </body>
    </html>
  );
}
