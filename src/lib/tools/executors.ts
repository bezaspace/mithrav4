import { getDatabase } from "@/lib/db";

interface PhysioSession {
  date: string;
  session_type: string;
  duration_minutes: number;
  exercises_completed: number;
  exercises_total: number;
  pain_level: number;
  mobility_score: number;
  notes: string;
}

interface MedicationLog {
  date: string;
  medication_name: string;
  dosage: string;
  taken: number;
  time_taken: string | null;
}

interface DietEntry {
  date: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydration_ml: number;
  adherence_score: number;
}

interface ActivityLog {
  date: string;
  steps: number;
  active_minutes: number;
  rest_hours: number;
  sleep_quality: number;
  mood_rating: number;
}

interface Milestone {
  milestone_name: string;
  target_date: string;
  achieved_date: string | null;
  category: string;
  description: string;
}

export async function executeGetPatientOverview() {
  const db = getDatabase();

  const patient = db
    .prepare(
      `
    SELECT 
      name, age, surgery_type, surgery_date, discharge_date,
      recovery_stage, target_recovery_days,
      CAST(julianday('now') - julianday(surgery_date) AS INTEGER) as days_since_surgery,
      CAST(julianday('now') - julianday(discharge_date) AS INTEGER) as days_since_discharge
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
    days_since_surgery: number;
    days_since_discharge: number;
  };

  // Calculate progress percentage
  const progressPercent = Math.min(
    100,
    (patient.days_since_surgery / patient.target_recovery_days) * 100
  );

  return {
    ...patient,
    progressPercent: Math.round(progressPercent),
    daysRemaining: Math.max(0, patient.target_recovery_days - patient.days_since_surgery),
  };
}

export async function executeGetPhysiotherapyProgress(days: number = 30) {
  const db = getDatabase();

  const data = db
    .prepare(
      `
    SELECT 
      date,
      session_type,
      duration_minutes,
      exercises_completed,
      exercises_total,
      pain_level,
      mobility_score,
      notes
    FROM physio_sessions
    WHERE date >= date('now', '-${days} days')
    ORDER BY date ASC
  `
    )
    .all() as PhysioSession[];

  if (data.length === 0) {
    return {
      data: [],
      summary: {
        avgMobilityScore: 0,
        avgPainLevel: 0,
        totalSessions: 0,
        totalHours: 0,
        trend: "no_data",
      },
    };
  }

  // Calculate summary statistics
  const avgMobility =
    data.reduce((acc, row) => acc + row.mobility_score, 0) / data.length;
  const avgPain =
    data.reduce((acc, row) => acc + row.pain_level, 0) / data.length;
  const totalSessions = data.length;
  const totalHours = data.reduce((acc, row) => acc + row.duration_minutes, 0) / 60;

  // Determine trend (compare first half vs second half)
  const halfIndex = Math.floor(data.length / 2);
  const firstHalfAvg =
    data.slice(0, halfIndex).reduce((acc, row) => acc + row.mobility_score, 0) /
    halfIndex;
  const secondHalfAvg =
    data.slice(halfIndex).reduce((acc, row) => acc + row.mobility_score, 0) /
    (data.length - halfIndex);
  const trend = secondHalfAvg > firstHalfAvg ? "improving" : "stable";

  return {
    data,
    summary: {
      avgMobilityScore: Math.round(avgMobility * 10) / 10,
      avgPainLevel: Math.round(avgPain * 10) / 10,
      totalSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      trend,
    },
  };
}

export async function executeGetMedicationAdherence(days: number = 30) {
  const db = getDatabase();

  // Get medication logs joined with schedule
  const logs = db
    .prepare(
      `
    SELECT 
      ml.date,
      ms.medication_name,
      ms.dosage,
      ml.taken,
      ml.time_taken
    FROM medication_logs ml
    JOIN medication_schedule ms ON ml.schedule_id = ms.id
    WHERE ml.date >= date('now', '-${days} days')
    ORDER BY ml.date DESC
  `
    )
    .all() as MedicationLog[];

  if (logs.length === 0) {
    return {
      adherencePercent: 0,
      totalDoses: 0,
      takenDoses: 0,
      missedDoses: 0,
      data: [],
    };
  }

  const totalDoses = logs.length;
  const takenDoses = logs.filter((log) => log.taken === 1).length;
  const adherencePercent = Math.round((takenDoses / totalDoses) * 100);

  // Group by date for chart data
  const dateGroups = new Map<string, { taken: number; total: number }>();
  logs.forEach((log) => {
    const current = dateGroups.get(log.date) || { taken: 0, total: 0 };
    current.total++;
    if (log.taken === 1) current.taken++;
    dateGroups.set(log.date, current);
  });

  const chartData = Array.from(dateGroups.entries()).map(([date, stats]) => ({
    date,
    taken: stats.taken,
    total: stats.total,
    adherence: Math.round((stats.taken / stats.total) * 100),
  }));

  return {
    adherencePercent,
    totalDoses,
    takenDoses,
    missedDoses: totalDoses - takenDoses,
    data: chartData,
  };
}

export async function executeGetDietAdherence(days: number = 30) {
  const db = getDatabase();

  // Aggregate daily diet data
  const entries = db
    .prepare(
      `
    SELECT 
      date,
      SUM(calories) as calories,
      SUM(hydration_ml) as hydration,
      AVG(adherence_score) as adherence
    FROM diet_entries
    WHERE date >= date('now', '-${days} days')
    GROUP BY date
    ORDER BY date ASC
  `
    )
    .all() as {
    date: string;
    calories: number;
    hydration: number;
    adherence: number;
  }[];

  if (entries.length === 0) {
    return {
      avgCalories: 0,
      avgHydration: 0,
      avgAdherence: 0,
      data: [],
    };
  }

  const avgCalories = Math.round(
    entries.reduce((acc, row) => acc + row.calories, 0) / entries.length
  );
  const avgHydration = Math.round(
    entries.reduce((acc, row) => acc + row.hydration, 0) / entries.length
  );
  const avgAdherence = Math.round(
    (entries.reduce((acc, row) => acc + row.adherence, 0) / entries.length) * 100
  );

  return {
    avgCalories,
    avgHydration,
    avgAdherence,
    data: entries.map((e) => ({
      ...e,
      adherence: Math.round(e.adherence * 100),
    })),
  };
}

export async function executeGetActivityProgress(days: number = 30) {
  const db = getDatabase();

  const entries = db
    .prepare(
      `
    SELECT 
      date,
      steps,
      active_minutes,
      rest_hours,
      sleep_quality,
      mood_rating
    FROM activity_logs
    WHERE date >= date('now', '-${days} days')
    ORDER BY date ASC
  `
    )
    .all() as ActivityLog[];

  if (entries.length === 0) {
    return {
      avgSteps: 0,
      avgActiveMinutes: 0,
      avgSleepQuality: 0,
      data: [],
    };
  }

  const avgSteps = Math.round(
    entries.reduce((acc, row) => acc + row.steps, 0) / entries.length
  );
  const avgActiveMinutes = Math.round(
    entries.reduce((acc, row) => acc + row.active_minutes, 0) / entries.length
  );
  const avgSleepQuality = Math.round(
    entries.reduce((acc, row) => acc + row.sleep_quality, 0) / entries.length
  );

  return {
    avgSteps,
    avgActiveMinutes,
    avgSleepQuality,
    data: entries,
  };
}

export async function executeGetRecoveryMilestones(
  category: string = "All"
) {
  const db = getDatabase();

  let query = `
    SELECT 
      milestone_name,
      target_date,
      achieved_date,
      category,
      description
    FROM milestones
  `;

  if (category !== "All") {
    query += ` WHERE category = '${category}'`;
  }

  query += ` ORDER BY 
    CASE WHEN achieved_date IS NOT NULL THEN 0 ELSE 1 END,
    target_date ASC`;

  const milestones = db.prepare(query).all() as Milestone[];

  const completed = milestones.filter((m) => m.achieved_date !== null).length;
  const pending = milestones.filter((m) => m.achieved_date === null).length;
  const completionPercent =
    milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  return {
    milestones,
    summary: {
      completed,
      pending,
      completionPercent,
    },
  };
}
