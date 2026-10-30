import type { Metadata } from "next";
import { CompensationScreen } from "./screen";

export const metadata: Metadata = { title: "Compensation | Bolto" };

export default function CompensationPage() {
  return <CompensationScreen />;
}
