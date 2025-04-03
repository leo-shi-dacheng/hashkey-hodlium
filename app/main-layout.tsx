'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectKitButton } from 'connectkit';
import { Sora } from 'next/font/google';
import { usePathname } from 'next/navigation';

// Initialize Sora font
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    // {
    //   name: 'Home',
    //   path: '/',
    // },
    {
      name: 'User Stakes',
      path: '/portfolio',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${sora.variable} font-sora bg-gradient-to-b from-slate-900 to-slate-800`}>
      {/* Fixed header on top */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/60">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* Left: Logo and menu */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-lg font-medium text-primary/80">Hodlium</span>
            </Link>
            
            {/* Navigation menu */}
            <nav className="hidden md:flex items-center space-x-6">
              {menuItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`text-white hover:text-primary/80 transition-colors ${
                    pathname === item.path ? 'text-primary/80 font-medium' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Right: Wallet connection button */}
        </div>
      </header>
      
      {/* Mobile navigation bar */}
      <div className="md:hidden fixed bottom-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/60">
        <div className="flex justify-around py-3">
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path} 
              className={`flex flex-col items-center ${
                pathname === item.path 
                  ? 'text-primary/80' 
                  : 'text-slate-400 hover:text-primary/80'
              } transition-colors`}
            >
              {item.path === '/' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {item.path === '/portfolio' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Page content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}