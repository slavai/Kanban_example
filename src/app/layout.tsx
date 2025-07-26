import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/layout/ToastProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban Board - Modern Task Management",
  description: "A beautiful and functional Kanban board application built with Next.js, React, and TypeScript. Manage your tasks with drag-and-drop functionality.",
  keywords: ["kanban", "task management", "productivity", "project management", "react", "nextjs"],
  authors: [{ name: "Kanban Board Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
