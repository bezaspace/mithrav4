import { NextResponse } from 'next/server';

// Mock patient data for Vercel deployment (SQLite doesn't work in serverless)
const mockPatients = [
  { id: 1, name: 'Ravi Kumar', age: 52, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 3 },
  { id: 2, name: 'Priya Sharma', age: 58, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 2 },
  { id: 3, name: 'Venkat Reddy', age: 62, surgery_type: 'Post Cervical Fixation', recovery_stage: 4 },
  { id: 4, name: 'Lakshmi Devi', age: 55, surgery_type: 'Post Cervical Fixation', recovery_stage: 1 },
  { id: 5, name: 'Suresh Babu', age: 48, surgery_type: 'Post Tumor Resection', recovery_stage: 2 },
  { id: 6, name: 'Anjali Mehta', age: 65, surgery_type: 'Post Tumor Resection', recovery_stage: 3 },
  { id: 7, name: 'Rajesh Iyer', age: 35, surgery_type: 'Post Accident Trauma', recovery_stage: 1 },
  { id: 8, name: 'Kavita Nair', age: 42, surgery_type: 'Post Accident Trauma', recovery_stage: 2 },
  { id: 9, name: 'Arjun Singh', age: 45, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 1 },
  { id: 10, name: 'Meera Krishnan', age: 58, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 3 },
];

export async function GET() {
  return NextResponse.json(mockPatients);
}
