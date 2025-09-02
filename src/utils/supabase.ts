import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://llnjfrvnwuekdjudpnzv.supabase.co';
// CRA uses process.env.REACT_APP_*, guard against missing env during dev
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  // Help developers diagnose 401 quickly when the key is missing
  // eslint-disable-next-line no-console
  console.error('Supabase anon key is missing. Set REACT_APP_SUPABASE_ANON_KEY in your environment.');
}

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
      .insert({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        streak_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
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
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStreakCount(userId: string) {
    // Get current user data
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const lastLogin = user.updated_at ? new Date(user.updated_at) : null;
    
    let newStreakCount = user.streak_count || 0;
    
    if (lastLogin) {
      const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day login - increment streak
        newStreakCount += 1;
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1 (today's login)
        newStreakCount = 1;
      }
      // If daysDiff === 0, it's the same day, keep current streak
    } else {
      // First login
      newStreakCount = 1;
    }

    // Update user with new streak count and timestamp
    return await this.updateUser(userId, {
      streak_count: newStreakCount,
      updated_at: now.toISOString()
    });
  },

  async resetStreakCount(userId: string) {
    // Reset streak count to 0 (useful for testing)
    return await this.updateUser(userId, {
      streak_count: 0
    });
  },

  // Workout operations
  async createWorkoutSession(workoutData: any) {
    // Translate camelCase to snake_case for DB
    const payload = {
      user_id: workoutData.userId ?? workoutData.user_id,
      start_time: workoutData.startTime ?? workoutData.start_time,
      end_time: workoutData.endTime ?? workoutData.end_time ?? null,
      duration: workoutData.duration ?? 0,
      notes: workoutData.notes ?? ''
    };
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    // Map DB row to camelCase model
    return {
      id: data.id,
      userId: data.user_id,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      exercises: data.exercises ?? [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getWorkoutSessions(userId: string) {
    // Fetch sessions first without nested relations to avoid 400 when FK relationship isn't inferred
    const { data: sessions, error: sessionsError } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .select(
        `id, user_id, start_time, end_time, duration, notes, created_at, updated_at`
      )
      .eq('user_id', userId)
      .order('start_time', { ascending: false });
    if (sessionsError) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch workout sessions:', sessionsError.message, sessionsError);
      throw sessionsError;
    }

    const sessionRows = sessions || [];
    const sessionIds = sessionRows.map((s: any) => s.id);

    // Fetch exercises for all sessions in one query
    let exercisesBySessionId: Record<string, any[]> = {};
    if (sessionIds.length > 0) {
      const { data: exercises, error: exercisesError } = await supabase
        .from(TABLES.EXERCISES)
        .select('id, workout_session_id, name, sets, reps, weight, notes')
        .in('workout_session_id', sessionIds as any);
      if (exercisesError) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch exercises:', exercisesError.message, exercisesError);
        throw exercisesError;
      }
      exercisesBySessionId = (exercises || []).reduce((acc: Record<string, any[]>, ex: any) => {
        const key = ex.workout_session_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(ex);
        return acc;
      }, {});
    }

    // Map to camelCase model and attach exercises
    return sessionRows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      notes: row.notes,
      exercises: (exercisesBySessionId[row.id] || []).map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: ex.notes,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async updateWorkoutSession(sessionId: string, updates: any) {
    // Translate camelCase to snake_case
    const payload: any = {};
    if (updates.startTime !== undefined || updates.start_time !== undefined) payload.start_time = updates.startTime ?? updates.start_time;
    if (updates.endTime !== undefined || updates.end_time !== undefined) payload.end_time = updates.endTime ?? updates.end_time;
    if (updates.duration !== undefined) payload.duration = updates.duration;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .update(payload)
      .eq('id', sessionId)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Exercise operations
  async createExercise(exerciseData: any) {
    const payload = {
      workout_session_id: exerciseData.workoutSessionId ?? exerciseData.workout_session_id,
      name: exerciseData.name,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      weight: exerciseData.weight,
      notes: exerciseData.notes,
    };
    const { data, error } = await supabase
      .from(TABLES.EXERCISES)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      notes: data.notes,
    };
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
