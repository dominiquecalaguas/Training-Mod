import type { Metadata } from "next";
import { Nav } from "@//components/Nav";
import { PostHogProvider } from "@//components/PostHogProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Library",
  description: "A focused space for your courses and lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-neutral-950">
        <PostHogProvider>
          <Nav />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
