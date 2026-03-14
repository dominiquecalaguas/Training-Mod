import { getPageSession } from "@/auth/lucia";
import { LoginForm } from "@/components/LoginForm";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const { user } = await getPageSession();
  if (user) redirect("/");
  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-900">
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
