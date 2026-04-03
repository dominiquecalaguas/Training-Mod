export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-900">
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        {children}
      </div>
    </div>
  );
}
