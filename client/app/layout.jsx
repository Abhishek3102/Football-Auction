import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Football Auction",
  description: "Live football player auction system",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navigation />
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  )
}
