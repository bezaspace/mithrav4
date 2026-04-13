import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'neuro_rehab.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS patient (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      surgery_type TEXT,
      surgery_date TEXT,
      discharge_date TEXT,
      recovery_stage INTEGER DEFAULT 1,
      target_recovery_days INTEGER DEFAULT 90,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS diet_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fats INTEGER,
      hydration_ml INTEGER,
      adherence_score REAL,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medication_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      medication_name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      time_of_day TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      schedule_id INTEGER,
      date TEXT NOT NULL,
      time_taken TEXT,
      taken INTEGER DEFAULT 0,
      FOREIGN KEY (patient_id) REFERENCES patient(id),
      FOREIGN KEY (schedule_id) REFERENCES medication_schedule(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS physio_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      date TEXT NOT NULL,
      session_type TEXT,
      duration_minutes INTEGER,
      exercises_completed INTEGER,
      exercises_total INTEGER,
      pain_level INTEGER,
      mobility_score REAL,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      date TEXT NOT NULL,
      steps INTEGER DEFAULT 0,
      active_minutes INTEGER DEFAULT 0,
      rest_hours REAL DEFAULT 0,
      sleep_quality INTEGER,
      mood_rating INTEGER,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pain_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      date TEXT NOT NULL,
      pain_level INTEGER,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS doctor_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      visit_date TEXT NOT NULL,
      visit_type TEXT,
      doctor_name TEXT,
      notes TEXT,
      next_visit_date TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      milestone_name TEXT NOT NULL,
      target_date TEXT,
      achieved_date TEXT,
      category TEXT,
      description TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recovery_trajectory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      day TEXT NOT NULL,
      cognitive INTEGER,
      physical INTEGER,
      speech INTEGER,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS therapy_allocation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT NOT NULL,
      value INTEGER,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      expert TEXT,
      type TEXT,
      instructions TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT NOT NULL,
      value INTEGER,
      fill TEXT,
      FOREIGN KEY (patient_id) REFERENCES patient(id)
    )
  `);

  insertMockData();
}

// Patient profiles for seeding
interface PatientProfile {
  name: string;
  age: number;
  surgery_type: string;
  surgery_date: string;
  discharge_date: string;
  recovery_stage: number;
  target_recovery_days: number;
}

const patientProfiles: PatientProfile[] = [
  { name: 'Ravi Kumar', age: 58, surgery_type: 'Brain Tumor Removal', surgery_date: '2024-01-15', discharge_date: '2024-01-22', recovery_stage: 3, target_recovery_days: 90 },
  { name: 'Priya Sharma', age: 42, surgery_type: 'Stroke Recovery', surgery_date: '2024-02-01', discharge_date: '2024-02-10', recovery_stage: 2, target_recovery_days: 120 },
  { name: 'Venkat Reddy', age: 68, surgery_type: 'Aneurysm Repair', surgery_date: '2024-01-20', discharge_date: '2024-01-28', recovery_stage: 4, target_recovery_days: 60 },
  { name: 'Lakshmi Devi', age: 55, surgery_type: 'Traumatic Brain Injury', surgery_date: '2024-02-10', discharge_date: '2024-02-20', recovery_stage: 1, target_recovery_days: 180 },
  { name: 'Suresh Babu', age: 48, surgery_type: 'Spine Surgery', surgery_date: '2024-01-25', discharge_date: '2024-02-01', recovery_stage: 2, target_recovery_days: 90 },
  { name: 'Anjali Mehta', age: 35, surgery_type: 'Parkinson\'s DBS', surgery_date: '2024-02-15', discharge_date: '2024-02-18', recovery_stage: 3, target_recovery_days: 45 },
  { name: 'Rajesh Iyer', age: 62, surgery_type: 'Epilepsy Surgery', surgery_date: '2024-01-30', discharge_date: '2024-02-05', recovery_stage: 3, target_recovery_days: 75 },
  { name: 'Kavita Nair', age: 72, surgery_type: 'Hydrocephalus Shunt', surgery_date: '2024-02-05', discharge_date: '2024-02-12', recovery_stage: 2, target_recovery_days: 60 },
  { name: 'Arjun Singh', age: 28, surgery_type: 'Cerebral AVM', surgery_date: '2024-02-20', discharge_date: '2024-02-25', recovery_stage: 1, target_recovery_days: 150 },
  { name: 'Meera Krishnan', age: 50, surgery_type: 'Meningioma Removal', surgery_date: '2024-02-08', discharge_date: '2024-02-15', recovery_stage: 4, target_recovery_days: 90 },
];

function insertMockData() {
  if (!db) return;

  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patient').get() as { count: number };
  if (patientCount.count > 0) return;

  const patientStmt = db.prepare(`
    INSERT INTO patient (name, age, surgery_type, surgery_date, discharge_date, recovery_stage, target_recovery_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertedPatientIds: number[] = [];
  patientProfiles.forEach(profile => {
    const info = patientStmt.run(profile.name, profile.age, profile.surgery_type, profile.surgery_date, profile.discharge_date, profile.recovery_stage, profile.target_recovery_days);
    insertedPatientIds.push(info.lastInsertRowid as number);
  });

  const dietStmt = db.prepare(`
    INSERT INTO diet_entries (patient_id, date, meal_type, calories, protein, carbs, fats, hydration_ml, adherence_score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const medScheduleStmt = db.prepare(`
    INSERT INTO medication_schedule (patient_id, medication_name, dosage, frequency, time_of_day, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const medLogsStmt = db.prepare(`
    INSERT INTO medication_logs (patient_id, schedule_id, date, time_taken, taken)
    VALUES (?, ?, ?, ?, ?)
  `);

  const physioStmt = db.prepare(`
    INSERT INTO physio_sessions (patient_id, date, session_type, duration_minutes, exercises_completed, exercises_total, pain_level, mobility_score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const activityStmt = db.prepare(`
    INSERT INTO activity_logs (patient_id, date, steps, active_minutes, rest_hours, sleep_quality, mood_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const painStmt = db.prepare(`
    INSERT INTO pain_logs (patient_id, date, pain_level, notes)
    VALUES (?, ?, ?, ?)
  `);

  const visitsStmt = db.prepare(`
    INSERT INTO doctor_visits (patient_id, visit_date, visit_type, doctor_name, notes, next_visit_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const milestonesStmt = db.prepare(`
    INSERT INTO milestones (patient_id, milestone_name, target_date, achieved_date, category, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const trajectoryStmt = db.prepare(`
    INSERT INTO recovery_trajectory (patient_id, day, cognitive, physical, speech)
    VALUES (?, ?, ?, ?, ?)
  `);

  const therapyStmt = db.prepare(`
    INSERT INTO therapy_allocation (patient_id, name, value)
    VALUES (?, ?, ?)
  `);

  const scheduleStmt = db.prepare(`
    INSERT INTO schedule (patient_id, time, title, expert, type, instructions)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const scoresStmt = db.prepare(`
    INSERT INTO scores (patient_id, name, value, fill)
    VALUES (?, ?, ?, ?)
  `);

  const today = new Date();
  const doctors = ['Dr. Sharma', 'Dr. Patel', 'Dr. Reddy', 'Dr. Gupta', 'Dr. Krishnan'];

  // Seed data for each patient
  insertedPatientIds.forEach((patientId, patientIdx) => {
    const profile = patientProfiles[patientIdx];
    const daysSinceDischarge = Math.floor((today.getTime() - new Date(profile.discharge_date).getTime()) / (1000 * 60 * 60 * 24));
    const dataDays = Math.min(30, Math.max(7, daysSinceDischarge));

    // Diet entries
    for (let i = dataDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const baseCalories = 1800 + (profile.age * 5);
      dietStmt.run(patientId, dateStr, 'Breakfast', Math.floor(baseCalories * 0.25), 25, 55, 15, 500, Math.random() > 0.15 ? 1 : 0.5, 'Oatmeal with fruits');
      dietStmt.run(patientId, dateStr, 'Lunch', Math.floor(baseCalories * 0.35), 35, 70, 22, 750, Math.random() > 0.1 ? 1 : 0.75, 'Rice, dal, vegetables');
      dietStmt.run(patientId, dateStr, 'Dinner', Math.floor(baseCalories * 0.30), 30, 60, 18, 400, Math.random() > 0.2 ? 1 : 0.5, 'Roti, curry, salad');
      dietStmt.run(patientId, dateStr, 'Snacks', Math.floor(baseCalories * 0.10), 8, 25, 8, 300, Math.random() > 0.25 ? 1 : 0, 'Fruits, nuts');
    }

    // Medication schedules based on surgery type
    const medications = getMedicationsForSurgery(profile.surgery_type);
    medications.forEach(med => {
      medScheduleStmt.run(patientId, med.name, med.dosage, med.frequency, med.timeOfDay, 1);
    });

    // Medication logs
    const schedules = db!.prepare('SELECT id, frequency FROM medication_schedule WHERE patient_id = ?').all(patientId) as { id: number; frequency: string }[];
    for (let i = dataDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      schedules.forEach(schedule => {
        if (schedule.frequency === 'Twice daily') {
          medLogsStmt.run(patientId, schedule.id, dateStr, '08:00', Math.random() > 0.1 ? 1 : 0);
          medLogsStmt.run(patientId, schedule.id, dateStr, '20:00', Math.random() > 0.15 ? 1 : 0);
        } else {
          medLogsStmt.run(patientId, schedule.id, dateStr, '08:00', Math.random() > 0.1 ? 1 : 0);
        }
      });
    }

    // Physio sessions
    const sessionTypes = ['Range of Motion', 'Strengthening', 'Balance Training', 'Walking Practice', 'Cognitive Exercises'];
    for (let i = dataDays; i >= 0; i--) {
      if (Math.random() > 0.3) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
        const duration = 30 + Math.floor(Math.random() * 30);
        const completed = Math.floor(Math.random() * 5) + 3;
        const total = completed + Math.floor(Math.random() * 2);
        
        physioStmt.run(
          patientId,
          dateStr,
          sessionType,
          duration,
          completed,
          total,
          Math.floor(Math.random() * 4) + 1,
          60 + Math.floor(Math.random() * 30),
          'Good progress'
        );
      }
    }

    // Activity logs
    for (let i = dataDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const baseSteps = profile.recovery_stage >= 3 ? 3000 : profile.recovery_stage >= 2 ? 2000 : 1000;
      activityStmt.run(
        patientId,
        dateStr,
        baseSteps + Math.floor(Math.random() * 3000),
        30 + Math.floor(Math.random() * 90),
        8 + Math.random() * 3,
        Math.floor(Math.random() * 3) + 3,
        Math.floor(Math.random() * 3) + 3
      );
    }

    // Pain logs
    for (let i = dataDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const basePain = Math.max(2, 9 - Math.floor(i / 4));
      const painLevel = basePain + Math.floor(Math.random() * 3) - 1;
      
      painStmt.run(
        patientId,
        dateStr,
        Math.max(1, Math.min(10, painLevel)),
        i < 7 ? 'Recent post-surgery discomfort' : i < 21 ? 'Mild soreness during therapy' : 'Minimal pain, good progress'
      );
    }

    // Doctor visits
    const doctor = doctors[patientIdx % doctors.length];
    visitsStmt.run(patientId, profile.surgery_date, 'Surgery', doctor, `${profile.surgery_type} successfully performed`, profile.discharge_date);
    visitsStmt.run(patientId, profile.discharge_date, 'Discharge Checkup', doctor, 'Patient recovering well, discharged', new Date(new Date(profile.discharge_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Milestones
    milestonesStmt.run(patientId, 'Sit up independently', new Date(new Date(profile.discharge_date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], new Date(new Date(profile.discharge_date).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'Mobility', 'Sit without support for 5 minutes');
    milestonesStmt.run(patientId, 'Walk with assistance', new Date(new Date(profile.discharge_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], new Date(new Date(profile.discharge_date).getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'Mobility', 'Walk 10 meters with walker');
    milestonesStmt.run(patientId, 'Dress independently', new Date(new Date(profile.discharge_date).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], null, 'ADL', 'Dress without help');
    milestonesStmt.run(patientId, 'Full recovery', new Date(new Date(profile.surgery_date).getTime() + profile.target_recovery_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0], null, 'Recovery', 'Complete normal activities');

    // Recovery trajectory
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseCognitive = 50 + (profile.recovery_stage * 10);
    const basePhysical = 30 + (profile.recovery_stage * 10);
    days.forEach((day, idx) => {
      trajectoryStmt.run(patientId, day, baseCognitive + idx * 3 + Math.floor(Math.random() * 5), basePhysical + idx * 4 + Math.floor(Math.random() * 5), 50 + idx * 2);
    });

    // Therapy allocation
    const therapies = [
      { name: 'Physiotherapy', value: 40 + Math.floor(Math.random() * 15) },
      { name: 'Speech Therapy', value: 15 + Math.floor(Math.random() * 15) },
      { name: 'Cognitive Games', value: 15 + Math.floor(Math.random() * 15) },
      { name: 'Rest & Recovery', value: 10 + Math.floor(Math.random() * 10) }
    ];
    therapies.forEach(t => therapyStmt.run(patientId, t.name, t.value));

    // Schedule
    const scheduleItems = [
      { time: '08:00 AM', title: 'Morning Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take prescribed medications with a full glass of water.' },
      { time: '09:00 AM', title: 'Physiotherapy Session', expert: 'Dr. Chen', type: 'Physical', instructions: 'Focus on mobility and strengthening exercises.' },
      { time: '11:00 AM', title: 'Home Therapy: Stretching', expert: 'Self-Guided', type: 'Home Therapy', instructions: 'Gentle stretching exercises for 15 minutes.' },
      { time: '01:00 PM', title: 'Nutritious Lunch', expert: 'Nutritionist', type: 'Diet', instructions: 'Balanced meal with proteins and vegetables.' },
      { time: '03:00 PM', title: 'Cognitive Exercises', expert: 'Self-Guided', type: 'Cognitive', instructions: 'Memory and focus exercises for 20 minutes.' },
      { time: '04:30 PM', title: 'AI Companion Chat', expert: 'Mithra AI', type: 'Support', instructions: 'Discuss progress and any concerns.' },
      { time: '08:00 PM', title: 'Evening Medication', expert: 'Self-Administered', type: 'Medication', instructions: 'Take evening medications as prescribed.' }
    ];
    scheduleItems.forEach(item => scheduleStmt.run(patientId, item.time, item.title, item.expert, item.type, item.instructions));

    // Scores
    const scores = [
      { name: 'Cognitive', value: 60 + profile.recovery_stage * 8 + Math.floor(Math.random() * 10), fill: '#8b5cf6' },
      { name: 'Physical', value: 40 + profile.recovery_stage * 10 + Math.floor(Math.random() * 10), fill: '#3b82f6' },
      { name: 'Diet', value: 75 + Math.floor(Math.random() * 20), fill: '#10b981' },
      { name: 'Medication', value: 85 + Math.floor(Math.random() * 15), fill: '#f59e0b' },
      { name: 'Sleep', value: 65 + Math.floor(Math.random() * 20), fill: '#ec4899' }
    ];
    scores.forEach(s => scoresStmt.run(patientId, s.name, s.value, s.fill));
  });
}

function getMedicationsForSurgery(surgeryType: string): Array<{ name: string; dosage: string; frequency: string; timeOfDay: string }> {
  const commonMeds = [
    { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', timeOfDay: 'Morning' },
    { name: 'Vitamin B12', dosage: '1000mcg', frequency: 'Once daily', timeOfDay: 'Morning' },
    { name: 'Calcium + D3', dosage: '1 tablet', frequency: 'Once daily', timeOfDay: 'Evening' }
  ];

  const specificMeds: Record<string, Array<{ name: string; dosage: string; frequency: string; timeOfDay: string }>> = {
    'Brain Tumor Removal': [
      { name: 'Levetiracetam', dosage: '500mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Dexamethasone', dosage: '4mg', frequency: 'Once daily', timeOfDay: 'Morning' }
    ],
    'Stroke Recovery': [
      { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', timeOfDay: 'Morning' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', timeOfDay: 'Evening' }
    ],
    'Aneurysm Repair': [
      { name: 'Nimodipine', dosage: '60mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', timeOfDay: 'Morning' }
    ],
    'Traumatic Brain Injury': [
      { name: 'Levetiracetam', dosage: '500mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily', timeOfDay: 'Morning, Afternoon, Evening' }
    ],
    'Spine Surgery': [
      { name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily', timeOfDay: 'Morning, Afternoon, Evening' },
      { name: 'Muscle Relaxant', dosage: '10mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' }
    ],
    'Parkinson\'s DBS': [
      { name: 'Levodopa/Carbidopa', dosage: '25/100mg', frequency: 'Three times daily', timeOfDay: 'Morning, Afternoon, Evening' },
      { name: 'Entacapone', dosage: '200mg', frequency: 'With each levodopa dose', timeOfDay: 'Morning, Afternoon, Evening' }
    ],
    'Epilepsy Surgery': [
      { name: 'Levetiracetam', dosage: '500mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Lamotrigine', dosage: '100mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' }
    ],
    'Hydrocephalus Shunt': [
      { name: 'Acetazolamide', dosage: '250mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Antibiotic Prophylactic', dosage: '500mg', frequency: 'Once daily', timeOfDay: 'Morning' }
    ],
    'Cerebral AVM': [
      { name: 'Levetiracetam', dosage: '500mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' },
      { name: 'Nimodipine', dosage: '60mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' }
    ],
    'Meningioma Removal': [
      { name: 'Dexamethasone', dosage: '4mg', frequency: 'Once daily', timeOfDay: 'Morning' },
      { name: 'Levetiracetam', dosage: '500mg', frequency: 'Twice daily', timeOfDay: 'Morning, Evening' }
    ]
  };

  return [...(specificMeds[surgeryType] || []), ...commonMeds];
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
