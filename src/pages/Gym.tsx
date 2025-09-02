import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { WorkoutSession, Exercise } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbOperations, subscribeToRealtime } from '../utils/supabase';
import { 
  Play, 
  Square, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Dumbbell, 
  Target,
  Zap,
  Sparkles,
  Timer,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const Gym: React.FC = () => {
  const { user: authUser } = useAuth();
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 1,
    reps: 10,
    weight: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restore local active workout if present (persists across logout)
    const local = localStorage.getItem('activeWorkout');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.startTime) {
          setIsWorkoutActive(true);
          setWorkoutStartTime(new Date(parsed.startTime));
          setNotes(parsed.notes || '');
          setCurrentWorkout(parsed);
        }
      } catch {}
    }

    if (authUser) {
      // Check if there's an active workout in DB
      checkActiveWorkout();
      
      // Subscribe to real-time updates
      const workoutSubscription = subscribeToRealtime('workout_sessions', (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          checkActiveWorkout();
        }
      });

      const exerciseSubscription = subscribeToRealtime('exercises', (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          if (currentWorkout) {
            loadExercises(currentWorkout.id);
          }
        }
      });

      return () => {
        workoutSubscription.unsubscribe();
        exerciseSubscription.unsubscribe();
      };
    }
  }, [authUser, currentWorkout]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        // keep UI responsive; we still store minutes at stop
        const now = new Date();
        const duration = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000 / 60);
        setWorkoutDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  const checkActiveWorkout = async () => {
    if (!authUser) return;
    
    try {
      const workouts = await dbOperations.getWorkoutSessions(authUser.id);
      const activeWorkout = workouts.find(w => !w.endTime);
      
      if (activeWorkout) {
        setCurrentWorkout(activeWorkout);
        setIsWorkoutActive(true);
        setWorkoutStartTime(new Date(activeWorkout.startTime));
        setNotes(activeWorkout.notes || '');
        setWorkoutDuration(activeWorkout.duration || 0);
        loadExercises(activeWorkout.id);
      } else {
        setIsWorkoutActive(false);
        setCurrentWorkout(null);
        setWorkoutStartTime(null);
        setWorkoutDuration(0);
        setNotes('');
        setExercises([]);
      }
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error checking active workout:', { message, details, error });
    }
  };

  const loadExercises = async (workoutId: string) => {
    try {
      const workout = await dbOperations.getWorkoutSessions(authUser!.id);
      const currentWorkoutData = workout.find(w => w.id === workoutId);
      if (currentWorkoutData && currentWorkoutData.exercises) {
        setExercises(currentWorkoutData.exercises);
      }
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error loading exercises:', { message, details, error });
    }
  };

  const startWorkout = async () => {
    if (!authUser) {
      const start = new Date();
      const localSession: any = { id: 'local', startTime: start.toISOString(), notes: '' };
      localStorage.setItem('activeWorkout', JSON.stringify(localSession));
      setCurrentWorkout(localSession);
      setIsWorkoutActive(true);
      setWorkoutStartTime(start);
      setWorkoutDuration(0);
      setNotes('');
      setExercises([]);
      return;
    }
    
    try {
      setLoading(true);
      const workoutData = await dbOperations.createWorkoutSession({
        userId: authUser.id,
        startTime: new Date().toISOString(),
        notes: '',
        duration: 0,
      });
      
      setCurrentWorkout(workoutData);
      // Persist active workout so timer continues after logout
      localStorage.setItem('activeWorkout', JSON.stringify({ id: workoutData.id, startTime: workoutData.startTime, notes: workoutData.notes }));
      setIsWorkoutActive(true);
      setWorkoutStartTime(new Date());
      setWorkoutDuration(0);
      setNotes('');
      setExercises([]);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error starting workout:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const stopWorkout = async () => {
    if (!currentWorkout) return;
    // Clear local active workout
    localStorage.removeItem('activeWorkout');

    if (!authUser || currentWorkout.id === 'local') {
      setIsWorkoutActive(false);
      setCurrentWorkout(null);
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      setNotes('');
      setExercises([]);
      return;
    }
    
    try {
      setLoading(true);
      await dbOperations.updateWorkoutSession(currentWorkout.id, {
        endTime: new Date().toISOString(),
        duration: workoutDuration,
        notes: notes,
      });
      
      setIsWorkoutActive(false);
      setCurrentWorkout(null);
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      setNotes('');
      setExercises([]);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error stopping workout:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async () => {
    if (!currentWorkout || !authUser || !newExercise.name.trim()) return;
    
    try {
      setLoading(true);
      await dbOperations.createExercise({
        workoutSessionId: currentWorkout.id,
        name: newExercise.name,
        sets: newExercise.sets,
        reps: newExercise.reps,
        weight: newExercise.weight,
        notes: newExercise.notes,
      });
      
      setNewExercise({
        name: '',
        sets: 1,
        reps: 10,
        weight: 0,
        notes: '',
      });
      setIsAddExerciseOpen(false);
      
      // Reload exercises
      loadExercises(currentWorkout.id);
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error adding exercise:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const editExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight || 0,
      notes: exercise.notes || '',
    });
    setIsAddExerciseOpen(true);
  };

  const updateExercise = async () => {
    if (!editingExercise || !authUser || !newExercise.name.trim()) return;
    
    try {
      setLoading(true);
      await dbOperations.updateExercise(editingExercise.id, {
        name: newExercise.name,
        sets: newExercise.sets,
        reps: newExercise.reps,
        weight: newExercise.weight,
        notes: newExercise.notes,
      });
      
      setEditingExercise(null);
      setNewExercise({
        name: '',
        sets: 1,
        reps: 10,
        weight: 0,
        notes: '',
      });
      setIsAddExerciseOpen(false);
      
      // Reload exercises
      if (currentWorkout) {
        loadExercises(currentWorkout.id);
      }
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error updating exercise:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const deleteExercise = async (id: string) => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      await dbOperations.deleteExercise(id);
      
      // Reload exercises
      if (currentWorkout) {
        loadExercises(currentWorkout.id);
      }
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error deleting exercise:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const updateWorkoutNotes = async () => {
    if (!currentWorkout || !authUser) return;
    
    try {
      await dbOperations.updateWorkoutSession(currentWorkout.id, {
        notes: notes,
      });
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error updating workout notes:', { message, details, error });
    }
  };

  const formatElapsed = () => {
    if (isWorkoutActive && workoutStartTime) {
      const totalSeconds = Math.max(0, Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    // Fallback to stored minutes when not active
    const hrs = Math.floor(workoutDuration / 60);
    const mins = workoutDuration % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  if (loading && !isWorkoutActive) {
    return (
      <div className="min-h-screen bg-amoled-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 border-t-accent-emerald rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-accent-blue rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="space-y-2">
            <p className="text-white/80 text-xl font-semibold">Loading gym data...</p>
            <p className="text-white/50 text-sm">Preparing your workout environment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative pb-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Header */}
        <div className="p-6 pt-8">
          <motion.div variants={itemVariants}>
            <div className="flex items-center space-x-3 mb-2">
              <Dumbbell className="w-8 h-8 text-accent-emerald" />
              <h1 className="text-4xl font-bold text-white">Gym</h1>
            </div>
            <p className="text-white/60 text-lg">Track your workout sessions and exercises</p>
          </motion.div>

          {/* Workout Control */}
          <motion.div variants={itemVariants}>
            <Card className="mb-8 text-center relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10">
              <div className="absolute inset-0 pointer-events-none rounded-3xl"></div>
              
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border border-white/10 ${
                      isWorkoutActive 
                        ? 'bg-white/10 text-white/80' 
                        : 'bg-white/5 text-white/60'
                    }`}>
                      {isWorkoutActive ? (
                        <Square className="w-10 h-10" />
                      ) : (
                        <Play className="w-10 h-10 ml-1" />
                      )}
                    </div>
                    {/* removed twinkling indicator for clean UI */}
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {isWorkoutActive ? 'Workout Active' : 'Ready to Start'}
                    </h2>
                    {isWorkoutActive && (
                      <div className="text-5xl font-bold text-white/80 mb-2 font-mono">
                        {formatElapsed()}
                      </div>
                    )}
                    <p className="text-white/50">
                      {isWorkoutActive ? 'Keep pushing! You\'re doing great!' : 'Start your fitness journey'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    {!isWorkoutActive ? (
                      <Button
                        onClick={startWorkout}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="px-8 py-4 text-lg font-semibold bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Start Workout
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={stopWorkout}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="px-8 py-4 text-lg font-semibold bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Ending...
                          </>
                        ) : (
                          <>
                            <Square className="w-5 h-5 mr-2" />
                            End Workout
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Workout Notes */}
          {isWorkoutActive && (
            <motion.div variants={itemVariants}>
              <Card className="mb-8 relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10">
                <div className="absolute inset-0 pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-white/10">
                      <Edit3 className="w-6 h-6 text-white/70" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Workout Notes</CardTitle>
                      <CardDescription>Track your thoughts and observations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={updateWorkoutNotes}
                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 resize-none"
                    rows={3}
                    placeholder="Add your workout notes here..."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Exercises */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10">
              <div className="absolute inset-0 pointer-events-none rounded-3xl"></div>
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-white/10">
                      <Target className="w-6 h-6 text-white/70" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Exercises</CardTitle>
                      <CardDescription>Track your workout exercises and sets</CardDescription>
                    </div>
                  </div>
                  {isWorkoutActive && (
                    <Button
                      onClick={() => setIsAddExerciseOpen(true)}
                      variant="outline"
                      size="sm"
                      className="text-white/60 hover:text-white border-white/20 hover:border-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exercise
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>

                <AnimatePresence>
                  {exercises.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-10 h-10 text-white/70" />
                      </div>
                      <h3 className="text-white/80 text-xl font-semibold mb-2">No exercises added yet</h3>
                      {isWorkoutActive && (
                        <p className="text-white/50 text-sm mb-6">Start adding exercises to track your workout progress</p>
                      )}
                      {isWorkoutActive && (
                        <Button
                          onClick={() => setIsAddExerciseOpen(true)}
                          variant="outline"
                          className="px-6"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Exercise
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {exercises.map((exercise, index) => (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                                {exercise.name}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs bg-white/10 border-white/10">
                                  {exercise.sets} sets
                                </Badge>
                                <Badge variant="secondary" className="text-xs bg-white/10 border-white/10">
                                  {exercise.reps} reps
                                </Badge>
                                {(exercise.weight ?? 0) > 0 && (
                                  <Badge variant="info" className="text-xs bg-white/10 border-white/10">
                                    {exercise.weight ?? 0} kg
                                  </Badge>
                                )}
                              </div>
                              {exercise.notes && (
                                <div className="text-sm text-white/50 mt-2">{exercise.notes}</div>
                              )}
                            </div>
                            {isWorkoutActive && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => editExercise(exercise)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => deleteExercise(exercise.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Add/Edit Exercise Dialog */}
      <AnimatePresence>
        {isAddExerciseOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-amoled-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-emerald/20 to-accent-blue/20">
                      <Target className="w-6 h-6 text-accent-emerald" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
                      </CardTitle>
                      <CardDescription>
                        {editingExercise ? 'Update your exercise details' : 'Add a new exercise to your workout'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Exercise Name</label>
                    <Input
                      type="text"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      placeholder="e.g., Bench Press"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/90">Sets</label>
                      <Input
                        type="number"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/90">Reps</label>
                      <Input
                        type="number"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 10 })}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Weight (kg)</label>
                    <Input
                      type="number"
                      value={newExercise.weight}
                      onChange={(e) => setNewExercise({ ...newExercise, weight: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Notes</label>
                    <textarea
                      value={newExercise.notes}
                      onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 resize-none"
                      rows={2}
                      placeholder="Any additional notes..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      onClick={() => {
                        setIsAddExerciseOpen(false);
                        setEditingExercise(null);
                        setNewExercise({
                          name: '',
                          sets: 1,
                          reps: 10,
                          weight: 0,
                          notes: '',
                        });
                      }}
                      variant="outline"
                      className="text-white/60 hover:text-white border-white/20 hover:border-white/30"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingExercise ? updateExercise : addExercise}
                      disabled={!newExercise.name.trim() || loading}
                      variant="gradient"
                      className="px-6"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          {editingExercise ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          {editingExercise ? (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Update
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gym;
