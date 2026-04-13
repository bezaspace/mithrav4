import DashboardPage from './DashboardPage';
import { getDatabase, closeDatabase } from '@/lib/db';
import { cookies } from 'next/headers';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ patientId?: string }> }) {
  const db = getDatabase();
  const cookieStore = await cookies();

  // Await searchParams as it's a Promise in Next.js 15+
  const params = await searchParams;

  // Get all patients
  const patients = db.prepare(`
    SELECT id, name, age, surgery_type, recovery_stage
    FROM patient
    ORDER BY id ASC
  `).all() as Array<{ id: number; name: string; age: number; surgery_type: string; recovery_stage: number }>;

  // Get selected patient ID from cookie, URL params, or default to first patient
  const cookiePatientId = cookieStore.get('selectedPatientId')?.value;
  const selectedPatientId = cookiePatientId
    ? parseInt(cookiePatientId)
    : params.patientId
    ? parseInt(params.patientId)
    : patients[0]?.id || 1;

  // Get patient info
  const patient = db.prepare(`
    SELECT * FROM patient WHERE id = ?
  `).get(selectedPatientId) as {
    name: string;
    age: number;
    surgery_type: string;
    surgery_date: string;
    discharge_date: string;
    recovery_stage: number;
    target_recovery_days: number;
  };

  // Get recovery trajectory for selected patient
  const recoveryTrajectory = db.prepare(`
    SELECT day, cognitive, physical, speech
    FROM recovery_trajectory
    WHERE patient_id = ?
    ORDER BY id ASC
  `).all(selectedPatientId) as Array<{ day: string; cognitive: number; physical: number; speech: number }>;

  // Get therapy allocation for selected patient
  const therapyAllocation = db.prepare(`
    SELECT name, value
    FROM therapy_allocation
    WHERE patient_id = ?
    ORDER BY id ASC
  `).all(selectedPatientId) as Array<{ name: string; value: number }>;

  // Get schedule for selected patient
  const schedule = db.prepare(`
    SELECT time, title, expert, type, instructions
    FROM schedule
    WHERE patient_id = ?
    ORDER BY id ASC
  `).all(selectedPatientId) as Array<{ time: string; title: string; expert: string; type: string; instructions: string }>;

  // Get scores for selected patient
  const scores = db.prepare(`
    SELECT name, value, fill
    FROM scores
    WHERE patient_id = ?
    ORDER BY id ASC
  `).all(selectedPatientId) as Array<{ name: string; value: number; fill: string }>;

  // Get pain index for selected patient
  const painIndex = db.prepare(`
    SELECT date, pain_level
    FROM pain_logs
    WHERE patient_id = ?
    ORDER BY id ASC
  `).all(selectedPatientId) as Array<{ date: string; pain_level: number }>;

  closeDatabase();

  // Calculate days since surgery
  const surgeryDate = new Date(patient.surgery_date);
  const today = new Date();
  const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.floor((daysSinceSurgery / patient.target_recovery_days) * 100));

  const dashboardData = {
    name: patient.name,
    id: `#NEURO-${1000 + selectedPatientId}`,
    diagnosis: patient.surgery_type,
    surgeon: 'Dr. Sarah Mitchell (Chief of Neurosurgery)',
    rehabPlan: `Intensive Neuro-Plasticity (${patient.target_recovery_days} Days, Stage ${patient.recovery_stage} of 4)`,
    nextAssessment: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' (Full Cognitive Battery)',
    stats: {
      cognitiveScore: `${60 + patient.recovery_stage * 8}%`,
      mobilityIndex: `${40 + patient.recovery_stage * 10}/100`,
      heartRateAvg: '72 bpm',
      dailyGoal: `${progressPercent}%`,
      weeklyImprovement: `${patient.recovery_stage * 5}% in cognitive scores`
    },
    recoveryTrajectory: recoveryTrajectory,
    therapyAllocation: therapyAllocation,
    schedule: schedule,
    scores: scores,
    painIndex: painIndex
  };

  return <DashboardPage data={dashboardData} patients={patients} selectedPatientId={selectedPatientId} />;
}
