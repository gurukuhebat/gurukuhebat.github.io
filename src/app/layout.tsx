import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guruku Hebat — Jurnal & Nilai Siswa",
  description:
    "Platform ringan untuk membantu Bapak/Ibu guru mengelola jurnal pembelajaran dan rekap nilai siswa — lengkap dengan cetak PDF resmi dan tanda tangan digital.",
  keywords: [
    "guruku hebat",
    "jurnal mengajar",
    "jurnal pembelajaran",
    "rekap nilai siswa",
    "guru",
    "pendidikan indonesia",
  ],
  authors: [{ name: "Nugraha Nastya" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Guruku Hebat — Jurnal & Nilai Siswa",
    description:
      "Memudahkan guru mengelola jurnal pembelajaran dan rekap nilai siswa.",
    url: "https://gurukuhebat.github.io",
    siteName: "Guruku Hebat",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guruku Hebat",
    description:
      "Memudahkan guru mengelola jurnal pembelajaran dan rekap nilai siswa.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Sonner position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
