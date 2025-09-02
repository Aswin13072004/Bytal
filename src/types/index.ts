export interface User {
  id: string;
  email: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  streakCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  notes: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

export interface WeightProgress {
  id: string;
  userId: string;
  weight: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface FitnessStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  averageWorkoutDuration: number;
  totalWorkoutTime: number;
  weightChange: number;
  monthlyProgress: {
    month: string;
    workouts: number;
    weight: number;
  }[];
}

export interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}
