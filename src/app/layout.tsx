import type { Metadata } from "next";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "@/styles/globals.scss";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "Talking Club Admin",
  description: "Talking Club admin: shopping management (HW3)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
