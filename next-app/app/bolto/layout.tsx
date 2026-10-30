import { DraftProvider } from "./draft-provider";
import type { Metadata } from "next";
import styles from "./review.module.css";
import tokens from "./tokens.module.css";

export const metadata: Metadata = {
  title: "Review & send | Bolto",
  description: "Review a fictional offer and preview the letter in the Bolto prototype.",
  robots: { index: false, follow: false },
};

export default function BoltoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${tokens.scope} ${styles.root}`}><DraftProvider>{children}</DraftProvider></div>;
}
