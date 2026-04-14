'use client';

import { useState, useEffect } from 'react';
import { PatientProvider, usePatient } from '@/context/PatientContext';
import { User, Brain, Loader2 } from 'lucide-react';
import ApiKeyInput, { getApiKey } from '@/components/ApiKeyInput';

interface Patient {
  id: number;
  name: string;
  age: number;
  surgery_type: string;
  recovery_stage: number;
}

function PatientSelectionScreen() {
  const { patients, setSelectedPatient } = usePatient();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20 mx-auto mb-4">
            <Brain className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">Welcome to NeuroCompanion</h1>
          <p className="text-neutral-500 mb-4">Select a patient to begin the session</p>
          <div className="flex justify-center">
            <ApiKeyInput />
          </div>
        </div>

        <div className="space-y-3">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="w-full bg-neutral-900/50 hover:bg-neutral-800/50 border border-neutral-800 hover:border-blue-500/50 p-4 rounded-2xl flex items-center gap-4 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                <User className="text-blue-400 w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-neutral-200">{patient.name}</p>
                <p className="text-xs text-neutral-500">{patient.surgery_type} • Age: {patient.age}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}

export default function PatientSelectionWrapper({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch('/api/patients');
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <PatientProvider initialPatients={patients}>
      <PatientSelectionWrapperContent>{children}</PatientSelectionWrapperContent>
    </PatientProvider>
  );
}

function PatientSelectionWrapperContent({ children }: { children: React.ReactNode }) {
  const { selectedPatientId, isLoading } = usePatient();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!selectedPatientId) {
    return <PatientSelectionScreen />;
  }

  return <>{children}</>;
}
