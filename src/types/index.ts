export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  degree?: string;
  isSharing?: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  fileURL: string;
  fileName: string;
  type: 'prescription' | 'report';
  createdAt: any; // Firestore Timestamp
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  time: string; // e.g., "09:00"
  type: 'medicine' | 'appointment' | 'generic';
  completed: boolean;
  days: string[]; // ['Mon', 'Wed']
}

export interface HealthMetric {
  id: string;
  userId: string;
  type: 'steps' | 'heartRate' | 'sleep' | 'water';
  value: number;
  unit: string;
  timestamp: any;
}
