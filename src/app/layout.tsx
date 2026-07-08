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
        url: "/icons/eyemask.png", // Recommended: create a specific Open Graph image (e.g., 1200x630px) and use its path here.
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
    images: [`${siteUrl}/icons/eyemask.png`], // Recommended: use a specific Twitter card image.
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
          defaultTheme="system" // Or "dark" / "light" if you prefer a non-system default
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <span className="text-lg font-semibold sm:text-xl">
                BLD Trainer
              </span>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
