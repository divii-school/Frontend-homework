import type { Metadata } from "next";
import localFont from "next/font/local";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "@/styles/globals.scss";
import { AppProviders } from "@/providers/AppProviders";

// Pretendard (OFL-1.1), the font used throughout the Talking Club Figma.
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Talking Club Admin",
  description: "Talking Club admin: shopping management (HW3)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={pretendard.variable}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
