import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
          <header className="bg-gray-800 shadow-lg">
            <nav className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-white">
                  <Link href="/" className="hover:text-gray-300 transition-colors duration-200">DropDomain Analyzer</Link>
                </div>
                <div className="flex space-x-6">
                  <Link href="/" className="text-gray-300 hover:text-gray-100 transition-colors duration-200">Home</Link>
                  <Link href="/reports" className="text-gray-300 hover:text-gray-100 transition-colors duration-200">Reports</Link>
                </div>
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
        {/* Фиксированная версия в правом нижнем углу */}
        <div className="fixed bottom-4 right-4 bg-gray-800 px-3 py-1 rounded-md shadow-lg z-50">
          <span className="font-bold text-yellow-400">v0.2</span>
        </div>
      </body>
    </html>
  );
}
