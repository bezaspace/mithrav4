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

  // Calculate days since surgery
  const surgeryDate = new Date(patient.surgery_date);
  const today = new Date();
  const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const dischargeDate = new Date(patient.discharge_date);
  const daysSinceDischarge = Math.floor((today.getTime() - dischargeDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const progressPercent = Math.min(100, (daysSinceSurgery / patient.target_recovery_days) * 100);

  // Get diet data (last 30 days, aggregated by date)
  const dietRaw = db.prepare(`
    SELECT 
      date,
      SUM(calories) as calories,
      SUM(hydration_ml) as hydration,
      AVG(adherence_score) as adherence
    FROM diet_entries
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all() as Array<{ date: string; calories: number; hydration: number; adherence: number }>;

  // Get medication adherence
  const medicationRaw = db.prepare(`
    SELECT 
      date,
      SUM(taken) as taken,
      COUNT(*) as total,
      CAST(SUM(taken) AS FLOAT) / COUNT(*) * 100 as adherence
    FROM medication_logs
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all() as Array<{ date: string; taken: number; total: number; adherence: number }>;

  // Get physio data
  const physioRaw = db.prepare(`
    SELECT 
      date,
      AVG(mobility_score) as mobility_score,
      SUM(duration_minutes) as duration,
      AVG(pain_level) as pain_level
    FROM physio_sessions
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all() as Array<{ date: string; mobility_score: number; duration: number; pain_level: number }>;

  // Get activity data
  const activityRaw = db.prepare(`
    SELECT 
      date,
      steps,
      active_minutes,
      sleep_quality,
      mood_rating
    FROM activity_logs
    WHERE date >= date('now', '-30 days')
    ORDER BY date ASC
  `).all() as Array<{ date: string; steps: number; active_minutes: number; sleep_quality: number; mood_rating: number }>;

  // Get doctor visits
  const doctorVisits = db.prepare(`
    SELECT 
      visit_date,
      visit_type,
      doctor_name,
      notes
    FROM doctor_visits
    ORDER BY visit_date ASC
  `).all() as Array<{ visit_date: string; visit_type: string; doctor_name: string; notes: string }>;

  // Get milestones
  const milestones = db.prepare(`
    SELECT 
      milestone_name,
      target_date,
      achieved_date,
      category,
      description
    FROM milestones
    ORDER BY achieved_date DESC, target_date ASC
  `).all() as Array<{ milestone_name: string; target_date: string; achieved_date: string | null; category: string; description: string }>;

  // Calculate metrics
  const dietAdherence = db.prepare(`
    SELECT AVG(adherence_score) * 100 as avg
    FROM diet_entries
    WHERE date >= date('now', '-30 days')
  `).get() as { avg: number };

  const medicationAdherence = db.prepare(`
    SELECT CAST(SUM(taken) AS FLOAT) / COUNT(*) * 100 as avg
    FROM medication_logs
    WHERE date >= date('now', '-30 days')
  `).get() as { avg: number };

  const physioSessions = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(duration_minutes) as total_minutes,
      AVG(mobility_score) as avg_mobility
    FROM physio_sessions
    WHERE date >= date('now', '-30 days')
  `).get() as { count: number; total_minutes: number; avg_mobility: number };

  const avgSteps = db.prepare(`
    SELECT AVG(steps) as avg
    FROM activity_logs
    WHERE date >= date('now', '-30 days')
  `).get() as { avg: number };

  closeDatabase();

  const dashboardData = {
    patient: {
      name: patient.name,
      age: patient.age,
      surgeryType: patient.surgery_type,
      surgeryDate: patient.surgery_date,
      dischargeDate: patient.discharge_date,
      recoveryStage: patient.recovery_stage,
      targetRecoveryDays: patient.target_recovery_days,
      daysSinceSurgery,
      daysSinceDischarge,
      progressPercent
    },
    dietData: dietRaw.map(d => ({
      date: d.date,
      calories: d.calories,
      hydration: d.hydration,
      adherence: Math.round(d.adherence * 100)
    })),
    medicationData: medicationRaw.map(m => ({
      date: m.date,
      taken: m.taken,
      total: m.total,
      adherence: Math.round(m.adherence)
    })),
    physioData: physioRaw.map(p => ({
      date: p.date,
      mobilityScore: Math.round(p.mobility_score),
      duration: p.duration,
      painLevel: Math.round(p.pain_level * 10) / 10
    })),
    activityData: activityRaw.map(a => ({
      date: a.date,
      steps: a.steps,
      activeMinutes: a.active_minutes,
      sleepQuality: a.sleep_quality,
      moodRating: a.mood_rating
    })),
    doctorVisits: doctorVisits.map(v => ({
      visitDate: v.visit_date,
      visitType: v.visit_type,
      doctorName: v.doctor_name,
      notes: v.notes
    })),
    milestones: milestones.map(m => ({
      milestoneName: m.milestone_name,
      targetDate: m.target_date,
      achievedDate: m.achieved_date,
      category: m.category,
      description: m.description
    })),
    metrics: {
      dietAdherence: Math.round(dietAdherence.avg || 0),
      medicationAdherence: Math.round(medicationAdherence.avg || 0),
      physioSessionsCompleted: physioSessions.count || 0,
      avgMobilityScore: Math.round(physioSessions.avg_mobility || 0),
      avgSteps: Math.round(avgSteps.avg || 0),
      totalPhysioHours: (physioSessions.total_minutes || 0) / 60
    }
  };

  return <DashboardPage data={dashboardData} />;
}
