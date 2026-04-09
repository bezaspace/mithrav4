'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Brain } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'AI Companion', icon: MessageSquare },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <nav className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block text-neutral-100">NeuroCompanion</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
