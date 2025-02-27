import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HashKey Chain Staking',
  description: '质押您的HSK代币并获得奖励',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="mytheme">
      <body className={inter.className}>
        <div className='bg-gradient-to-b from-slate-900 to-slate-800'>
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}