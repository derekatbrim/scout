import type { Metadata } from 'next'
import { Bricolage_Grotesque, Libre_Franklin } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '../components/ui/toast'
import { GlobalSearch } from '../components/global-search'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scout - Brand Intelligence for Creators',
  description: 'Discover, pitch, and manage brand partnerships',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${libreFranklin.variable}`}>
      <body className="font-body">
        {children}
        <ToastContainer />
        <GlobalSearch />
      </body>
    </html>
  )
}