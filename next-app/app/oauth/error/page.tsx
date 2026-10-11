export default function OAuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">Connection could not be completed</h1>
        <p className="mt-4 text-slate-300">Return to your MCP client and try connecting again.</p>
      </div>
    </main>
  );
}
