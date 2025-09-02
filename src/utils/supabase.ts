import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://llnjfrvnwuekdjudpnzv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'users',
  WORKOUT_SESSIONS: 'workout_sessions',
  EXERCISES: 'exercises',
  WEIGHT_PROGRESS: 'weight_progress',
} as const;

// Real-time subscriptions
export const subscribeToRealtime = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

// Database operations
export const dbOperations = {
  // User operations
  async createUserProfile(userData: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Workout operations
  async createWorkoutSession(workoutData: any) {
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .insert(workoutData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getWorkoutSessions(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .select(`
        *,
        exercises (*)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateWorkoutSession(sessionId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Exercise operations
  async createExercise(exerciseData: any) {
    const { data, error } = await supabase
      .from(TABLES.EXERCISES)
      .insert(exerciseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateExercise(exerciseId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.EXERCISES)
      .update(updates)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteExercise(exerciseId: string) {
    const { error } = await supabase
      .from(TABLES.EXERCISES)
      .delete()
      .eq('id', exerciseId);
    
    if (error) throw error;
  },

  // Weight progress operations
  async createWeightEntry(weightData: any) {
    const { data, error } = await supabase
      .from(TABLES.WEIGHT_PROGRESS)
      .insert(weightData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getWeightProgress(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.WEIGHT_PROGRESS)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateWeightEntry(entryId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.WEIGHT_PROGRESS)
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteWeightEntry(entryId: string) {
    const { error } = await supabase
      .from(TABLES.WEIGHT_PROGRESS)
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
  }
};
