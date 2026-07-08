import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Metadata } from "next";
import { Toaster } from "sonner";

const siteUrl = "https://memo3bld.com";

export const metadata: Metadata = {
  title: "Memo 3BLD",
  description: "Memo Generator for 3x3 blindfolded",
  icons: {
    icon: "/icons/eyemask.png",
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Memo 3BLD",
    description: "Memo Generator for 3x3 blindfolded",
    url: siteUrl,
    siteName: "Memo 3BLD",
    images: [
      {
        url: "/icons/eyemask.png",
        alt: "Memo 3BLD Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memo 3BLD",
    description: "Memo Generator for 3x3 blindfolded",
    images: [`${siteUrl}/icons/eyemask.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Tăng height và padding cho header */}
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
              <span className="text-xl font-semibold sm:text-2xl">
                BLD Trainer
              </span>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Bao children trong container để nội dung cân giữa và thoáng hơn */}
          <main className="container mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-16">
            {children}
          </main>
          
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}