import { getDatabase } from "@/lib/db";

export async function executeGetPatientProfile() {
  const db = getDatabase();

  const patient = db
    .prepare(
      `
    SELECT 
      name, age, surgery_type, surgery_date, discharge_date,
      recovery_stage, target_recovery_days
    FROM patient
    LIMIT 1
  `
    )
    .get() as {
    name: string;
    age: number;
    surgery_type: string;
    surgery_date: string;
    discharge_date: string;
    recovery_stage: number;
    target_recovery_days: number;
  };

  return {
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
    }
  };
}

export async function executeGetRecoveryTrajectory() {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT day, cognitive, physical, speech
    FROM recovery_trajectory
    ORDER BY id ASC
  `
    )
    .all() as {
    day: string;
    cognitive: number;
    physical: number;
    speech: number;
  }[];

  return {
    recoveryTrajectory: data
  };
}

export async function executeGetTherapyAllocation() {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT name, value
    FROM therapy_allocation
    ORDER BY id ASC
  `
    )
    .all() as {
    name: string;
    value: number;
  }[];

  return {
    therapyAllocation: data
  };
}

export async function executeGetRecoveryScores() {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT name, value, fill
    FROM scores
    ORDER BY id ASC
  `
    )
    .all() as {
    name: string;
    value: number;
    fill: string;
  }[];

  return {
    scores: data
  };
}

export async function executeGetDailySchedule() {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT time, title, expert, type, instructions
    FROM schedule
    ORDER BY id ASC
  `
    )
    .all() as {
    time: string;
    title: string;
    expert: string;
    type: string;
    instructions: string;
  }[];

  return {
    schedule: data
  };
}
