import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "PCET Hostel Attendance Management System",
    template: "%s | PCET Hostel Attendance",
  },
  description:
    "Secure QR-based hostel attendance, realtime dashboards, analytics, and reports for PARK COLLEGE OF ENGINEERING AND TECHNOLOGY.",
  openGraph: {
    title: "PCET Hostel Attendance Management System",
    description:
      "Role-based attendance dashboards with dynamic QR verification and Supabase-ready security.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PCET Hostel Attendance Management System",
    description:
      "Secure QR-based hostel attendance, dashboards, analytics, and reports.",
    images: ["/opengraph-image"],
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
