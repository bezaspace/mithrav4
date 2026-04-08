'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DietData {
  date: string;
  calories: number;
  hydration: number;
  adherence: number;
}

interface MedicationData {
  date: string;
  taken: number;
  total: number;
  adherence: number;
}

interface PhysioData {
  date: string;
  mobilityScore: number;
  duration: number;
  painLevel: number;
}

interface ActivityData {
  date: string;
  steps: number;
  activeMinutes: number;
  sleepQuality: number;
  moodRating: number;
}

interface DoctorVisit {
  visitDate: string;
  visitType: string;
  doctorName: string;
  notes: string;
}

interface Milestone {
  milestoneName: string;
  targetDate: string;
  achievedDate: string | null;
  category: string;
  description: string;
}

interface Patient {
  name: string;
  age: number;
  surgeryType: string;
  surgeryDate: string;
  dischargeDate: string;
  recoveryStage: number;
  targetRecoveryDays: number;
  daysSinceSurgery: number;
  daysSinceDischarge: number;
  progressPercent: number;
}

interface DashboardData {
  patient: Patient;
  dietData: DietData[];
  medicationData: MedicationData[];
  physioData: PhysioData[];
  activityData: ActivityData[];
  doctorVisits: DoctorVisit[];
  milestones: Milestone[];
  metrics: {
    dietAdherence: number;
    medicationAdherence: number;
    physioSessionsCompleted: number;
    avgMobilityScore: number;
    avgSteps: number;
    totalPhysioHours: number;
  };
}

export default function DashboardPage({ data }: { data: DashboardData }) {
  const { patient, dietData, medicationData, physioData, activityData, doctorVisits, milestones, metrics } = data;

  const COLORS = {
    primary: '#0891B2',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-[#ededed] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Neuro Rehabilitation Dashboard</h1>
        <p className="text-zinc-400">Track your recovery journey and daily progress</p>
      </div>

      {/* Patient Overview */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Patient</p>
            <p className="text-xl font-semibold">{patient.name}</p>
            <p className="text-sm text-zinc-400">{patient.age} years old</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Surgery</p>
            <p className="text-lg font-semibold">{patient.surgeryType}</p>
            <p className="text-sm text-zinc-400">{patient.surgeryDate}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Recovery Stage</p>
            <p className="text-2xl font-bold text-[#0891B2]">Stage {patient.recoveryStage}</p>
            <p className="text-sm text-zinc-400">{patient.daysSinceDischarge} days since discharge</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Overall Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0891B2] to-[#10B981] rounded-full transition-all duration-500"
                    style={{ width: `${patient.progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold">{patient.progressPercent.toFixed(0)}%</span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">{patient.targetRecoveryDays - patient.daysSinceSurgery} days remaining</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Diet Adherence</p>
          <p className="text-3xl font-bold text-[#10B981]">{metrics.dietAdherence.toFixed(0)}%</p>
          <p className="text-xs text-zinc-400 mt-1">30 day average</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Medication Adherence</p>
          <p className="text-3xl font-bold text-[#0891B2]">{metrics.medicationAdherence.toFixed(0)}%</p>
          <p className="text-xs text-zinc-400 mt-1">30 day average</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Physio Sessions</p>
          <p className="text-3xl font-bold text-[#8B5CF6]">{metrics.physioSessionsCompleted}</p>
          <p className="text-xs text-zinc-400 mt-1">{metrics.totalPhysioHours.toFixed(1)} total hours</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Avg Daily Steps</p>
          <p className="text-3xl font-bold text-[#EC4899]">{metrics.avgSteps.toLocaleString()}</p>
          <p className="text-xs text-zinc-400 mt-1">30 day average</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Diet Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Diet & Hydration (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dietData}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHydration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => value.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#ededed' }}
                />
                <Legend />
                <Area type="monotone" dataKey="calories" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorCalories)" name="Calories" />
                <Area type="monotone" dataKey="hydration" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorHydration)" name="Hydration (ml/10)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medication Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Medication Adherence (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => value.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#ededed' }}
                />
                <Bar dataKey="adherence" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Adherence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physiotherapy Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Physiotherapy Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={physioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => value.slice(5)} />
                <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#ededed' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="mobilityScore" stroke={COLORS.purple} strokeWidth={2} dot={{ fill: COLORS.purple }} name="Mobility Score" />
                <Line yAxisId="right" type="monotone" dataKey="painLevel" stroke={COLORS.danger} strokeWidth={2} dot={{ fill: COLORS.danger }} name="Pain Level" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Activity & Sleep</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => value.slice(5)} />
                <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#ededed' }}
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="steps" stroke={COLORS.pink} fillOpacity={1} fill="url(#colorSteps)" name="Steps" />
                <Line yAxisId="right" type="monotone" dataKey="sleepQuality" stroke={COLORS.secondary} strokeWidth={2} dot={false} name="Sleep Quality" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section - Milestones & Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recovery Milestones</h3>
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${milestone.achievedDate ? 'bg-[#10B981]/20' : 'bg-zinc-700'}`}>
                  {milestone.achievedDate ? (
                    <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm text-zinc-400">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{milestone.milestoneName}</p>
                  <p className="text-sm text-zinc-400">{milestone.description}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${milestone.achievedDate ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                    {milestone.achievedDate ? 'Completed' : 'Pending'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {milestone.achievedDate || `Target: ${milestone.targetDate}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Visits Timeline */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Doctor Visits</h3>
          <div className="space-y-4">
            {doctorVisits.map((visit, idx) => (
              <div key={idx} className="relative pl-6 pb-4 border-l-2 border-zinc-700 last:pb-0">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#0891B2]" />
                <p className="text-sm text-zinc-400">{visit.visitDate}</p>
                <p className="font-medium">{visit.visitType}</p>
                <p className="text-sm text-zinc-500">{visit.doctorName}</p>
                <p className="text-xs text-zinc-600 mt-1">{visit.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
