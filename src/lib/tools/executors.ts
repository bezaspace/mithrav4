import { getDatabase } from "@/lib/db";

export async function executeGetPatientProfile(patientId?: number) {
  const db = getDatabase();

  const patient = db
    .prepare(
      `
    SELECT 
      name, age, surgery_type, surgery_date, discharge_date,
      recovery_stage, target_recovery_days
    FROM patient
    WHERE id = ?
  `
    )
    .get(patientId || 1) as {
    name: string;
    age: number;
    surgery_type: string;
    surgery_date: string;
    discharge_date: string;
    recovery_stage: number;
    target_recovery_days: number;
  };

  // Calculate days since surgery
  const surgeryDate = new Date(patient.surgery_date);
  const today = new Date();
  const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.floor((daysSinceSurgery / patient.target_recovery_days) * 100));

  return {
    name: patient.name,
    id: `#NEURO-${1000 + (patientId || 1)}`,
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
    recoveryStage: patient.recovery_stage,
    targetRecoveryDays: patient.target_recovery_days,
    daysSinceSurgery
  };
}

export async function executeGetRecoveryTrajectory(patientId?: number) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT day, cognitive, physical, speech
    FROM recovery_trajectory
    WHERE patient_id = ?
    ORDER BY id ASC
  `
    )
    .all(patientId || 1) as {
    day: string;
    cognitive: number;
    physical: number;
    speech: number;
  }[];

  return {
    recoveryTrajectory: data
  };
}

export async function executeGetTherapyAllocation(patientId?: number) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT name, value
    FROM therapy_allocation
    WHERE patient_id = ?
    ORDER BY id ASC
  `
    )
    .all(patientId || 1) as {
    name: string;
    value: number;
  }[];

  return {
    therapyAllocation: data
  };
}

export async function executeGetRecoveryScores(patientId?: number) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT name, value, fill
    FROM scores
    WHERE patient_id = ?
    ORDER BY id ASC
  `
    )
    .all(patientId || 1) as {
    name: string;
    value: number;
    fill: string;
  }[];

  return {
    scores: data
  };
}

export async function executeGetDailySchedule(patientId?: number) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT time, title, expert, type, instructions
    FROM schedule
    WHERE patient_id = ?
    ORDER BY id ASC
  `
    )
    .all(patientId || 1) as {
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

export async function executeGetPainIndex(patientId?: number) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT date, pain_level
    FROM pain_logs
    WHERE patient_id = ?
    ORDER BY id ASC
  `
    )
    .all(patientId || 1) as {
    date: string;
    pain_level: number;
  }[];

  return {
    painIndex: data
  };
}
