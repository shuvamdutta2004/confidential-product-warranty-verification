import type { Metadata } from "next";
import "../app/globals.css";
import ClientLayout from "../app/ClientLayout";

export const metadata: Metadata = {
  title: "CPWV — Confidential Product Warranty Verification | Midnight Network",
  description: "Privacy-preserving zero-knowledge product warranty verification dApp on Midnight Network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
