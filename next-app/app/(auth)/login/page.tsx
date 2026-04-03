import { getPageSession } from "@/auth/lucia";
import { LoginForm } from "@/components/LoginForm";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const { user } = await getPageSession();
  if (user) redirect("/");
  return <LoginForm />;
}
