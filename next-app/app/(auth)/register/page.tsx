import { getPageSession } from "@/auth/lucia";
import { RegisterForm } from "@/components/RegisterForm";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const { user } = await getPageSession();
  if (user) redirect("/");
  return <RegisterForm />;
}
