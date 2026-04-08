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
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fats INTEGER,
      hydration_ml INTEGER,
      adherence_score REAL,
      notes TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medication_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      time_of_day TEXT,
      active INTEGER DEFAULT 1
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER,
      date TEXT NOT NULL,
      time_taken TEXT,
      taken INTEGER DEFAULT 0,
      FOREIGN KEY (schedule_id) REFERENCES medication_schedule(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS physio_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      session_type TEXT,
      duration_minutes INTEGER,
      exercises_completed INTEGER,
      exercises_total INTEGER,
      pain_level INTEGER,
      mobility_score REAL,
      notes TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      steps INTEGER DEFAULT 0,
      active_minutes INTEGER DEFAULT 0,
      rest_hours REAL DEFAULT 0,
      sleep_quality INTEGER,
      mood_rating INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS doctor_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_date TEXT NOT NULL,
      visit_type TEXT,
      doctor_name TEXT,
      notes TEXT,
      next_visit_date TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_name TEXT NOT NULL,
      target_date TEXT,
      achieved_date TEXT,
      category TEXT,
      description TEXT
    )
  `);

  insertMockData();
}

function insertMockData() {
  if (!db) return;

  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patient').get() as { count: number };
  if (patientCount.count > 0) return;

  const patientStmt = db.prepare(`
    INSERT INTO patient (name, age, surgery_type, surgery_date, discharge_date, recovery_stage, target_recovery_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  patientStmt.run('Ravi Kumar', 58, 'Brain Tumor Removal', '2024-01-15', '2024-01-22', 3, 90);

  const dietStmt = db.prepare(`
    INSERT INTO diet_entries (date, meal_type, calories, protein, carbs, fats, hydration_ml, adherence_score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    dietStmt.run(dateStr, 'Breakfast', 450, 25, 55, 15, 500, Math.random() > 0.15 ? 1 : 0.5, 'Oatmeal with fruits');
    dietStmt.run(dateStr, 'Lunch', 650, 35, 70, 22, 750, Math.random() > 0.1 ? 1 : 0.75, 'Rice, dal, vegetables');
    dietStmt.run(dateStr, 'Dinner', 550, 30, 60, 18, 400, Math.random() > 0.2 ? 1 : 0.5, 'Roti, curry, salad');
    dietStmt.run(dateStr, 'Snacks', 200, 8, 25, 8, 300, Math.random() > 0.25 ? 1 : 0, 'Fruits, nuts');
  }

  const medScheduleStmt = db.prepare(`
    INSERT INTO medication_schedule (medication_name, dosage, frequency, time_of_day, active)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  medScheduleStmt.run('Levetiracetam', '500mg', 'Twice daily', 'Morning, Evening', 1);
  medScheduleStmt.run('Dexamethasone', '4mg', 'Once daily', 'Morning', 1);
  medScheduleStmt.run('Omeprazole', '20mg', 'Once daily', 'Morning', 1);
  medScheduleStmt.run('Vitamin B12', '1000mcg', 'Once daily', 'Morning', 1);
  medScheduleStmt.run('Calcium + D3', '1 tablet', 'Once daily', 'Evening', 1);

  const medLogsStmt = db.prepare(`
    INSERT INTO medication_logs (schedule_id, date, time_taken, taken)
    VALUES (?, ?, ?, ?)
  `);

  const schedules = db.prepare('SELECT id, frequency FROM medication_schedule').all() as { id: number; frequency: string }[];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    schedules.forEach(schedule => {
      if (schedule.frequency === 'Twice daily') {
        medLogsStmt.run(schedule.id, dateStr, '08:00', Math.random() > 0.1 ? 1 : 0);
        medLogsStmt.run(schedule.id, dateStr, '20:00', Math.random() > 0.15 ? 1 : 0);
      } else {
        medLogsStmt.run(schedule.id, dateStr, '08:00', Math.random() > 0.1 ? 1 : 0);
      }
    });
  }

  const physioStmt = db.prepare(`
    INSERT INTO physio_sessions (date, session_type, duration_minutes, exercises_completed, exercises_total, pain_level, mobility_score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sessionTypes = ['Range of Motion', 'Strengthening', 'Balance Training', 'Walking Practice', 'Cognitive Exercises'];
  
  for (let i = 29; i >= 0; i--) {
    if (Math.random() > 0.3) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
      const duration = 30 + Math.floor(Math.random() * 30);
      const completed = Math.floor(Math.random() * 5) + 3;
      const total = completed + Math.floor(Math.random() * 2);
      
      physioStmt.run(
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

  const activityStmt = db.prepare(`
    INSERT INTO activity_logs (date, steps, active_minutes, rest_hours, sleep_quality, mood_rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    activityStmt.run(
      dateStr,
      2000 + Math.floor(Math.random() * 4000),
      30 + Math.floor(Math.random() * 90),
      8 + Math.random() * 3,
      Math.floor(Math.random() * 3) + 3,
      Math.floor(Math.random() * 3) + 3
    );
  }

  const visitsStmt = db.prepare(`
    INSERT INTO doctor_visits (visit_date, visit_type, doctor_name, notes, next_visit_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  visitsStmt.run('2024-01-15', 'Surgery', 'Dr. Sharma', 'Brain tumor successfully removed', '2024-01-22');
  visitsStmt.run('2024-01-22', 'Discharge Checkup', 'Dr. Sharma', 'Patient recovering well, discharged', '2024-02-05');
  visitsStmt.run('2024-02-05', 'Follow-up', 'Dr. Sharma', 'Stitches removed, healing well', '2024-02-19');
  visitsStmt.run('2024-02-19', 'MRI Scan', 'Dr. Sharma', 'No signs of recurrence, continue medication', '2024-03-18');
  visitsStmt.run('2024-03-18', 'Follow-up', 'Dr. Sharma', 'Mobility improving, reduce steroids', '2024-04-15');

  const milestonesStmt = db.prepare(`
    INSERT INTO milestones (milestone_name, target_date, achieved_date, category, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  milestonesStmt.run('Sit up independently', '2024-01-25', '2024-01-23', 'Mobility', 'Sit without support for 5 minutes');
  milestonesStmt.run('Walk with assistance', '2024-02-10', '2024-02-08', 'Mobility', 'Walk 10 meters with walker');
  milestonesStmt.run('Climb stairs', '2024-03-01', '2024-03-05', 'Mobility', 'Climb one flight of stairs');
  milestonesStmt.run('Dress independently', '2024-02-20', '2024-02-18', 'ADL', 'Dress without help');
  milestonesStmt.run('Return home', '2024-01-25', '2024-01-22', 'Recovery', 'Discharged from hospital');
  milestonesStmt.run('Read 10 pages', '2024-02-15', '2024-02-12', 'Cognitive', 'Read without severe headache');
  milestonesStmt.run('Cook simple meal', '2024-03-15', null, 'ADL', 'Prepare breakfast independently');
  milestonesStmt.run('Drive again', '2024-06-01', null, 'Independence', 'Doctor clearance for driving');
  milestonesStmt.run('Full recovery', '2024-04-15', null, 'Recovery', 'Complete normal activities');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
