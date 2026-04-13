'use client';

import { useState } from 'react';
import { usePatient } from '@/context/PatientContext';
import { useRouter } from 'next/navigation';
import {
  StatsGrid, RecoveryTrajectory, TherapyAllocation,
  ClinicalProfile, ScheduleList, RadialScoreChart, PainIndexChart
} from '@/components/DashboardWidgets';
import { User, LayoutGrid, BarChart3, ClipboardList, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SubPage = 'overview' | 'metrics' | 'clinical' | 'schedule';

interface DashboardData {
  name: string;
  id: string;
  diagnosis: string;
  surgeon: string;
  rehabPlan: string;
  nextAssessment: string;
  stats: {
    cognitiveScore: string;
    mobilityIndex: string;
    heartRateAvg: string;
    dailyGoal: string;
    weeklyImprovement: string;
  };
  recoveryTrajectory: Array<{
    day: string;
    cognitive: number;
    physical: number;
    speech: number;
  }>;
  therapyAllocation: Array<{
    name: string;
    value: number;
  }>;
  schedule: Array<{
    time: string;
    title: string;
    expert: string;
    type: string;
    instructions: string;
  }>;
  scores: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  painIndex: Array<{
    date: string;
    pain_level: number;
  }>;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  surgery_type: string;
  recovery_stage: number;
}

export default function DashboardPage({ data, patients, selectedPatientId }: { data: DashboardData; patients: Patient[]; selectedPatientId: number }) {
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('overview');
  const { selectedPatient, setSelectedPatient } = usePatient();
  const router = useRouter();

  const subPages = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
    { id: 'clinical' as const, label: 'Clinical', icon: ClipboardList },
    { id: 'schedule' as const, label: 'Schedule', icon: CalendarDays },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100 tracking-tight">Recovery Dashboard</h1>
          <p className="text-neutral-500">{data.diagnosis} Phase 2</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Patient Info Card */}
          <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <User className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">{selectedPatient?.name || data.name}</p>
              <p className="text-xs text-neutral-500">Patient ID: {data.id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Menu */}
      <div className="flex items-center gap-2 p-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl w-fit">
        {subPages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveSubPage(page.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSubPage === page.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
            }`}
          >
            <page.icon size={16} />
            {page.label}
          </button>
        ))}
      </div>

      {/* Sub-Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubPage === 'overview' && (
            <div className="space-y-8">
              <StatsGrid data={data} />
              <div className="bg-neutral-900/40 border border-neutral-800 p-2 rounded-[32px]">
                <RecoveryTrajectory data={data} />
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 p-2 rounded-[32px]">
                <PainIndexChart data={data} />
              </div>
            </div>
          )}

          {activeSubPage === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RadialScoreChart data={data} />
              <TherapyAllocation data={data} />
            </div>
          )}

          {activeSubPage === 'clinical' && (
            <div className="max-w-3xl">
              <ClinicalProfile data={data} />
            </div>
          )}

          {activeSubPage === 'schedule' && (
            <div className="max-w-4xl">
              <ScheduleList data={data} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
