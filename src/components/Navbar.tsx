'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Brain, User } from 'lucide-react';
import { usePatient } from '@/context/PatientContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedPatient, patients, setSelectedPatient } = usePatient();

  const navItems = [
    { href: '/', label: 'AI Companion', icon: MessageSquare },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === parseInt(patientId));
    if (patient) {
      setSelectedPatient(patient);
      // Set cookie synchronously before navigation
      document.cookie = `selectedPatientId=${patient.id}; path=/; max-age=31536000`;
      // Navigate to dashboard with new patient ID
      router.push('/dashboard');
    }
  };

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

          {/* Patient Selector */}
          {selectedPatient && (
            <div className="hidden md:flex items-center gap-3 bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <User className="text-blue-400 w-4 h-4" />
              </div>
              <select
                value={selectedPatient.id}
                onChange={(e) => handlePatientChange(e.target.value)}
                className="bg-transparent text-neutral-200 text-sm font-medium focus:outline-none cursor-pointer"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id} className="bg-zinc-900 text-neutral-200">
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
