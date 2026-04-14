import DashboardPage from './DashboardPage';
import { cookies } from 'next/headers';

// Mock data for Vercel deployment
const mockPatients = [
  { id: 1, name: 'Ravi Kumar', age: 52, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 3 },
  { id: 2, name: 'Priya Sharma', age: 58, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 2 },
  { id: 3, name: 'Venkat Reddy', age: 62, surgery_type: 'Post Cervical Fixation', recovery_stage: 4 },
  { id: 4, name: 'Lakshmi Devi', age: 55, surgery_type: 'Post Cervical Fixation', recovery_stage: 1 },
  { id: 5, name: 'Suresh Babu', age: 48, surgery_type: 'Post Tumor Resection', recovery_stage: 2 },
  { id: 6, name: 'Anjali Mehta', age: 65, surgery_type: 'Post Tumor Resection', recovery_stage: 3 },
  { id: 7, name: 'Rajesh Iyer', age: 35, surgery_type: 'Post Accident Trauma', recovery_stage: 1 },
  { id: 8, name: 'Kavita Nair', age: 42, surgery_type: 'Post Accident Trauma', recovery_stage: 2 },
  { id: 9, name: 'Arjun Singh', age: 45, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 1 },
  { id: 10, name: 'Meera Krishnan', age: 58, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 3 },
];

const mockPatientDetails: Record<number, { surgery_date: string; discharge_date: string; target_recovery_days: number }> = {
  1: { surgery_date: '2024-01-15', discharge_date: '2024-01-25', target_recovery_days: 90 },
  2: { surgery_date: '2024-02-01', discharge_date: '2024-02-10', target_recovery_days: 90 },
  3: { surgery_date: '2024-01-20', discharge_date: '2024-01-30', target_recovery_days: 120 },
  4: { surgery_date: '2024-02-10', discharge_date: '2024-02-20', target_recovery_days: 120 },
  5: { surgery_date: '2024-01-25', discharge_date: '2024-02-05', target_recovery_days: 150 },
  6: { surgery_date: '2024-02-15', discharge_date: '2024-02-22', target_recovery_days: 180 },
  7: { surgery_date: '2024-01-30', discharge_date: '2024-02-15', target_recovery_days: 180 },
  8: { surgery_date: '2024-02-05', discharge_date: '2024-02-18', target_recovery_days: 150 },
  9: { surgery_date: '2024-02-20', discharge_date: '2024-02-28', target_recovery_days: 120 },
  10: { surgery_date: '2024-02-08', discharge_date: '2024-02-16', target_recovery_days: 90 },
};

function getMockData(patientId: number) {
  const patient = mockPatients.find(p => p.id === patientId) || mockPatients[0];
  const details = mockPatientDetails[patientId] || mockPatientDetails[1];

  const surgeryDate = new Date(details.surgery_date);
  const today = new Date();
  const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.floor((daysSinceSurgery / details.target_recovery_days) * 100));

  const recoveryTrajectory = [
    { day: 'Mon', cognitive: 50 + (patientId * 3), physical: 30 + (patientId * 3), speech: 50 },
    { day: 'Tue', cognitive: 53 + (patientId * 3), physical: 34 + (patientId * 3), speech: 52 },
    { day: 'Wed', cognitive: 56 + (patientId * 3), physical: 38 + (patientId * 3), speech: 54 },
    { day: 'Thu', cognitive: 59 + (patientId * 3), physical: 42 + (patientId * 3), speech: 56 },
    { day: 'Fri', cognitive: 62 + (patientId * 3), physical: 46 + (patientId * 3), speech: 58 },
    { day: 'Sat', cognitive: 65 + (patientId * 3), physical: 50 + (patientId * 3), speech: 60 },
    { day: 'Sun', cognitive: 68 + (patientId * 3), physical: 54 + (patientId * 3), speech: 62 },
  ];

  const therapyAllocation = [
    { name: 'Physiotherapy', value: 40 + (patientId % 3) * 5 },
    { name: 'Speech Therapy', value: 15 + (patientId % 2) * 5 },
    { name: 'Cognitive Games', value: 15 + (patientId % 4) * 5 },
    { name: 'Rest & Recovery', value: 10 + (patientId % 2) * 5 }
  ];

  const schedule = [
    { time: '08:00 AM', title: 'Morning Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take prescribed medications with a full glass of water.' },
    { time: '09:00 AM', title: 'Physiotherapy Session', expert: 'Dr. Chen', type: 'Physical', instructions: 'Focus on mobility and strengthening exercises.' },
    { time: '11:00 AM', title: 'Home Therapy: Stretching', expert: 'Self-Guided', type: 'Home Therapy', instructions: 'Gentle stretching exercises for 15 minutes.' },
    { time: '01:00 PM', title: 'Nutritious Lunch', expert: 'Nutritionist', type: 'Diet', instructions: 'Balanced meal with proteins and vegetables.' },
    { time: '03:00 PM', title: 'Cognitive Exercises', expert: 'Self-Guided', type: 'Cognitive', instructions: 'Memory and focus exercises for 20 minutes.' },
    { time: '04:30 PM', title: 'AI Companion Chat', expert: 'Mithra AI', type: 'Support', instructions: 'Discuss progress and any concerns.' },
    { time: '08:00 PM', title: 'Evening Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take evening medications as prescribed.' }
  ];

  const scores = [
    { name: 'Cognitive', value: 60 + (patientId * 5) % 30, fill: '#8b5cf6' },
    { name: 'Physical', value: 40 + (patientId * 7) % 40, fill: '#3b82f6' },
    { name: 'Diet', value: 75 + (patientId * 3) % 20, fill: '#10b981' },
    { name: 'Medication', value: 85 + (patientId * 2) % 15, fill: '#f59e0b' },
    { name: 'Sleep', value: 65 + (patientId * 4) % 25, fill: '#ec4899' }
  ];

  const painIndex = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    painIndex.push({
      date: date.toISOString().split('T')[0],
      pain_level: Math.max(1, Math.min(10, Math.floor(Math.random() * 5) + 2))
    });
  }

  return {
    name: patient.name,
    id: `#NEURO-${1000 + patientId}`,
    diagnosis: patient.surgery_type,
    surgeon: 'Dr. Sarah Mitchell (Chief of Neurosurgery)',
    rehabPlan: `Intensive Neuro-Plasticity (${details.target_recovery_days} Days, Stage ${patient.recovery_stage} of 4)`,
    nextAssessment: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' (Full Cognitive Battery)',
    stats: {
      cognitiveScore: `${60 + patient.recovery_stage * 8}%`,
      mobilityIndex: `${40 + patient.recovery_stage * 10}/100`,
      heartRateAvg: '72 bpm',
      dailyGoal: `${progressPercent}%`,
      weeklyImprovement: `${patient.recovery_stage * 5}% in cognitive scores`
    },
    recoveryTrajectory,
    therapyAllocation,
    schedule,
    scores,
    painIndex
  };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ patientId?: string }> }) {
  const cookieStore = await cookies();
  const params = await searchParams;

  // Get selected patient ID from cookie, URL params, or default to first patient
  const cookiePatientId = cookieStore.get('selectedPatientId')?.value;
  const selectedPatientId = cookiePatientId
    ? parseInt(cookiePatientId)
    : params.patientId
    ? parseInt(params.patientId)
    : 1;

  const dashboardData = getMockData(selectedPatientId);

  return <DashboardPage data={dashboardData} patients={mockPatients} selectedPatientId={selectedPatientId} />;
}
