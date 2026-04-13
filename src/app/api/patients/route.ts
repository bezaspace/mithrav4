import { NextResponse } from 'next/server';
import { getDatabase, closeDatabase } from '@/lib/db';

export async function GET() {
  const db = getDatabase();

  try {
    const patients = db.prepare(`
      SELECT id, name, age, surgery_type, recovery_stage
      FROM patient
      ORDER BY id ASC
    `).all();

    closeDatabase();

    return NextResponse.json(patients);
  } catch (error) {
    closeDatabase();
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
