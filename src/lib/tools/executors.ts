// Mock data for Vercel deployment (SQLite doesn't work in serverless)

export async function executeGetPatientProfile(patientId?: number) {
  const id = patientId || 1;
  const mockPatients: Record<number, { name: string; age: number; surgery_type: string; surgery_date: string; discharge_date: string; recovery_stage: number; target_recovery_days: number }> = {
    1: { name: 'Ravi Kumar', age: 52, surgery_type: 'Post Lumbar Spine Fixation', surgery_date: '2024-01-15', discharge_date: '2024-01-25', recovery_stage: 3, target_recovery_days: 90 },
    2: { name: 'Priya Sharma', age: 58, surgery_type: 'Post Lumbar Spine Fixation', surgery_date: '2024-02-01', discharge_date: '2024-02-10', recovery_stage: 2, target_recovery_days: 90 },
    3: { name: 'Venkat Reddy', age: 62, surgery_type: 'Post Cervical Fixation', surgery_date: '2024-01-20', discharge_date: '2024-01-30', recovery_stage: 4, target_recovery_days: 120 },
    4: { name: 'Lakshmi Devi', age: 55, surgery_type: 'Post Cervical Fixation', surgery_date: '2024-02-10', discharge_date: '2024-02-20', recovery_stage: 1, target_recovery_days: 120 },
    5: { name: 'Suresh Babu', age: 48, surgery_type: 'Post Tumor Resection', surgery_date: '2024-01-25', discharge_date: '2024-02-05', recovery_stage: 2, target_recovery_days: 150 },
    6: { name: 'Anjali Mehta', age: 65, surgery_type: 'Post Tumor Resection', surgery_date: '2024-02-15', discharge_date: '2024-02-22', recovery_stage: 3, target_recovery_days: 180 },
    7: { name: 'Rajesh Iyer', age: 35, surgery_type: 'Post Accident Trauma', surgery_date: '2024-01-30', discharge_date: '2024-02-15', recovery_stage: 1, target_recovery_days: 180 },
    8: { name: 'Kavita Nair', age: 42, surgery_type: 'Post Accident Trauma', surgery_date: '2024-02-05', discharge_date: '2024-02-18', recovery_stage: 2, target_recovery_days: 150 },
    9: { name: 'Arjun Singh', age: 45, surgery_type: 'Head Surgery - Craniotomy', surgery_date: '2024-02-20', discharge_date: '2024-02-28', recovery_stage: 1, target_recovery_days: 120 },
    10: { name: 'Meera Krishnan', age: 58, surgery_type: 'Head Surgery - Craniotomy', surgery_date: '2024-02-08', discharge_date: '2024-02-16', recovery_stage: 3, target_recovery_days: 90 },
  };

  const patient = mockPatients[id] || mockPatients[1];

  // Calculate days since surgery
  const surgeryDate = new Date(patient.surgery_date);
  const today = new Date();
  const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate progress percentage
  const progressPercent = Math.min(100, Math.floor((daysSinceSurgery / patient.target_recovery_days) * 100));

  return {
    name: patient.name,
    id: `#NEURO-${1000 + id}`,
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
  const id = patientId || 1;
  const mockTrajectory = [
    { day: 'Mon', cognitive: 50 + (id * 3), physical: 30 + (id * 3), speech: 50 },
    { day: 'Tue', cognitive: 53 + (id * 3), physical: 34 + (id * 3), speech: 52 },
    { day: 'Wed', cognitive: 56 + (id * 3), physical: 38 + (id * 3), speech: 54 },
    { day: 'Thu', cognitive: 59 + (id * 3), physical: 42 + (id * 3), speech: 56 },
    { day: 'Fri', cognitive: 62 + (id * 3), physical: 46 + (id * 3), speech: 58 },
    { day: 'Sat', cognitive: 65 + (id * 3), physical: 50 + (id * 3), speech: 60 },
    { day: 'Sun', cognitive: 68 + (id * 3), physical: 54 + (id * 3), speech: 62 },
  ];

  return {
    recoveryTrajectory: mockTrajectory
  };
}

export async function executeGetTherapyAllocation(patientId?: number) {
  const id = patientId || 1;
  const mockTherapy = [
    { name: 'Physiotherapy', value: 40 + (id % 3) * 5 },
    { name: 'Speech Therapy', value: 15 + (id % 2) * 5 },
    { name: 'Cognitive Games', value: 15 + (id % 4) * 5 },
    { name: 'Rest & Recovery', value: 10 + (id % 2) * 5 }
  ];

  return {
    therapyAllocation: mockTherapy
  };
}

export async function executeGetRecoveryScores(patientId?: number) {
  const id = patientId || 1;
  const mockScores = [
    { name: 'Cognitive', value: 60 + (id * 5) % 30, fill: '#8b5cf6' },
    { name: 'Physical', value: 40 + (id * 7) % 40, fill: '#3b82f6' },
    { name: 'Diet', value: 75 + (id * 3) % 20, fill: '#10b981' },
    { name: 'Medication', value: 85 + (id * 2) % 15, fill: '#f59e0b' },
    { name: 'Sleep', value: 65 + (id * 4) % 25, fill: '#ec4899' }
  ];

  return {
    scores: mockScores
  };
}

export async function executeGetDailySchedule(patientId?: number) {
  const mockSchedule = [
    { time: '08:00 AM', title: 'Morning Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take prescribed medications with a full glass of water.' },
    { time: '09:00 AM', title: 'Physiotherapy Session', expert: 'Dr. Chen', type: 'Physical', instructions: 'Focus on mobility and strengthening exercises.' },
    { time: '11:00 AM', title: 'Home Therapy: Stretching', expert: 'Self-Guided', type: 'Home Therapy', instructions: 'Gentle stretching exercises for 15 minutes.' },
    { time: '01:00 PM', title: 'Nutritious Lunch', expert: 'Nutritionist', type: 'Diet', instructions: 'Balanced meal with proteins and vegetables.' },
    { time: '03:00 PM', title: 'Cognitive Exercises', expert: 'Self-Guided', type: 'Cognitive', instructions: 'Memory and focus exercises for 20 minutes.' },
    { time: '04:30 PM', title: 'AI Companion Chat', expert: 'Mithra AI', type: 'Support', instructions: 'Discuss progress and any concerns.' },
    { time: '08:00 PM', title: 'Evening Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take evening medications as prescribed.' }
  ];

  return {
    schedule: mockSchedule
  };
}

export async function executeGetPainIndex(patientId?: number) {
  const today = new Date();
  const mockPainIndex = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    mockPainIndex.push({
      date: date.toISOString().split('T')[0],
      pain_level: Math.max(1, Math.min(10, Math.floor(Math.random() * 5) + 2))
    });
  }

  return {
    painIndex: mockPainIndex
  };
}
