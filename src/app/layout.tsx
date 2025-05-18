import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drop Domain Analyzer",
  description: "Analyze and find valuable drop domains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-gray-800 shadow-md">
            <nav className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-white">
                  DropDomain Analyzer
                </div>
                {/* Future Nav Links Here */}
              </div>
            </nav>
          </header>
          <main className="flex-grow container mx-auto px-6 py-8">
            {children}
          </main>
          <footer className="bg-gray-800 text-center text-sm py-4">
            <p>&copy; {new Date().getFullYear()} DropDomain Analyzer. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

