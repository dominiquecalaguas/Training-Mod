import type { Metadata } from "next";
import { PostHogProvider } from "@//components/PostHogProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRISMA",
  description: "A focused space for your courses and lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-neutral-50">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
