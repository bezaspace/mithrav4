import DashboardPage from './DashboardPage';
import { getDatabase, closeDatabase } from '@/lib/db';

export default async function Dashboard() {
  const db = getDatabase();

  // Get patient info
  const patient = db.prepare(`
    SELECT * FROM patient LIMIT 1
  `).get() as {
    name: string;
    age: number;
    surgery_type: string;
    surgery_date: string;
    discharge_date: string;
    recovery_stage: number;
    target_recovery_days: number;
  };

  // Get recovery trajectory
  const recoveryTrajectory = db.prepare(`
    SELECT day, cognitive, physical, speech
    FROM recovery_trajectory
    ORDER BY id ASC
  `).all() as Array<{ day: string; cognitive: number; physical: number; speech: number }>;

  // Get therapy allocation
  const therapyAllocation = db.prepare(`
    SELECT name, value
    FROM therapy_allocation
    ORDER BY id ASC
  `).all() as Array<{ name: string; value: number }>;

  // Get schedule
  const schedule = db.prepare(`
    SELECT time, title, expert, type, instructions
    FROM schedule
    ORDER BY id ASC
  `).all() as Array<{ time: string; title: string; expert: string; type: string; instructions: string }>;

  // Get scores
  const scores = db.prepare(`
    SELECT name, value, fill
    FROM scores
    ORDER BY id ASC
  `).all() as Array<{ name: string; value: number; fill: string }>;

  closeDatabase();

  const dashboardData = {
    name: patient.name,
    id: '#NEURO-8821',
    diagnosis: patient.surgery_type,
    surgeon: 'Dr. Sarah Mitchell (Chief of Neurosurgery)',
    rehabPlan: 'Intensive Neuro-Plasticity (12 Weeks, currently in Week 4)',
    nextAssessment: 'April 15, 2026 (Full Cognitive Battery)',
    stats: {
      cognitiveScore: '82%',
      mobilityIndex: '58/100',
      heartRateAvg: '72 bpm',
      dailyGoal: '85%',
      weeklyImprovement: '15% in cognitive scores'
    },
    recoveryTrajectory: recoveryTrajectory,
    therapyAllocation: therapyAllocation,
    schedule: schedule,
    scores: scores
  };

  return <DashboardPage data={dashboardData} />;
}
