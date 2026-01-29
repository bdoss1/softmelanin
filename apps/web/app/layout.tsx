import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Soft Melanin MCP - Content Engine",
  description: "Softness Strategist Content Intelligence Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full brand-gradient" />
                  <div>
                    <h1 className="text-xl font-bold brand-text-gradient">
                      Soft Melanin MCP
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Softness Strategist Content Engine
                    </p>
                  </div>
                </div>
                <nav className="flex items-center gap-4">
                  <a
                    href="/"
                    className="text-sm font-medium hover:text-brand-primary transition-colors"
                  >
                    Generate
                  </a>
                  <a
                    href="/library"
                    className="text-sm font-medium hover:text-brand-primary transition-colors"
                  >
                    Library
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
