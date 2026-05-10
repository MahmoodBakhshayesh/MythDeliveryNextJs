import "./globals.css";
import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import { LocaleUiProvider } from "@/providers/locale-ui-provider";

export const metadata: Metadata = {
  title: "Myth Delivery",
  description: "Fleet & delivery console for MythDeliveryWebApi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <LocaleUiProvider>
          <AppProviders>{children}</AppProviders>
        </LocaleUiProvider>
      </body>
    </html>
  );
}
