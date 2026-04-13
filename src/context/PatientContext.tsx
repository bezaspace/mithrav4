'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Patient {
  id: number;
  name: string;
  age: number;
  surgery_type: string;
  recovery_stage: number;
}

interface PatientContextType {
  selectedPatientId: number | null;
  selectedPatient: Patient | null;
  patients: Patient[];
  setSelectedPatient: (patient: Patient) => void;
  isLoading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedPatientId';

export function PatientProvider({ children, initialPatients }: { children: ReactNode; initialPatients: Patient[] }) {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected patient from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedId = parseInt(stored);
      setSelectedPatientId(parsedId);
      // Set cookie for server-side access
      document.cookie = `selectedPatientId=${parsedId}; path=/; max-age=31536000`;
    }
    setIsLoading(false);
  }, []);

  // Update cookie when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      document.cookie = `selectedPatientId=${selectedPatientId}; path=/; max-age=31536000`;
      localStorage.setItem(STORAGE_KEY, selectedPatientId.toString());
    }
  }, [selectedPatientId]);

  const setSelectedPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  return (
    <PatientContext.Provider value={{ selectedPatientId, selectedPatient, patients, setSelectedPatient, isLoading }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
