import "./globals.css";
import type { Metadata } from "next";
import { Geist_Mono, Roboto, Vazirmatn } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { LocaleUiProvider } from "@/providers/locale-ui-provider";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleUiProvider>
          <AppProviders>{children}</AppProviders>
        </LocaleUiProvider>
      </body>
    </html>
  );
}
