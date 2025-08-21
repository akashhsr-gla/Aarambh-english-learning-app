import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aarambh - Learn English & Soft Skills',
  description: 'Revolutionary mobile application dedicated to empowering individuals with essential English language skills and soft skills. Affordable, accessible, and effective learning for everyone.',
  keywords: 'English learning, soft skills, language app, education, affordable learning, mobile app',
  authors: [{ name: 'Omprakash Prajapati' }],
  creator: 'Omprakash Prajapati',
  openGraph: {
    title: 'Aarambh - Learn English & Soft Skills',
    description: 'Revolutionary mobile application dedicated to empowering individuals with essential English language skills and soft skills.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 