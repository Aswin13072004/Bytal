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
    if (authUser) {
      // Check if there's an active workout
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
    } catch (error) {
      console.error('Error checking active workout:', error);
    }
  };

  const loadExercises = async (workoutId: string) => {
    try {
      const workout = await dbOperations.getWorkoutSessions(authUser!.id);
      const currentWorkoutData = workout.find(w => w.id === workoutId);
      if (currentWorkoutData && currentWorkoutData.exercises) {
        setExercises(currentWorkoutData.exercises);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const startWorkout = async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      const workoutData = await dbOperations.createWorkoutSession({
        userId: authUser.id,
        startTime: new Date().toISOString(),
        notes: '',
        duration: 0,
      });
      
      setCurrentWorkout(workoutData);
      setIsWorkoutActive(true);
      setWorkoutStartTime(new Date());
      setWorkoutDuration(0);
      setNotes('');
      setExercises([]);
    } catch (error) {
      console.error('Error starting workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopWorkout = async () => {
    if (!currentWorkout || !authUser) return;
    
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
    } catch (error) {
      console.error('Error stopping workout:', error);
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
    } catch (error) {
      console.error('Error adding exercise:', error);
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
    } catch (error) {
      console.error('Error updating exercise:', error);
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
    } catch (error) {
      console.error('Error deleting exercise:', error);
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
    } catch (error) {
      console.error('Error updating workout notes:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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
    <div className="min-h-screen bg-amoled-950 relative overflow-hidden pb-24">
      {/* AMOLED Dark Background with Elegant Particles */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amoled-950 via-amoled-900 to-amoled-800"></div>
        
        {/* Elegant floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-emerald/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-accent-blue/8 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent-purple/6 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Subtle animated particles */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/15 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.01]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

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
            <Card className="mb-8 text-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
              
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 ${
                      isWorkoutActive 
                        ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                        : 'bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald'
                    }`}>
                      {isWorkoutActive ? (
                        <Square className="w-10 h-10" />
                      ) : (
                        <Play className="w-10 h-10 ml-1" />
                      )}
                    </div>
                    {isWorkoutActive && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {isWorkoutActive ? 'Workout Active' : 'Ready to Start'}
                    </h2>
                    {isWorkoutActive && (
                      <div className="text-5xl font-bold text-red-400 mb-2 font-mono">
                        {formatTime(workoutDuration)}
                      </div>
                    )}
                    <p className="text-white/60">
                      {isWorkoutActive ? 'Keep pushing! You\'re doing great!' : 'Start your fitness journey'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    {!isWorkoutActive ? (
                      <Button
                        onClick={startWorkout}
                        disabled={loading}
                        variant="gradient"
                        size="lg"
                        className="px-8 py-4 text-lg font-semibold"
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
                        variant="destructive"
                        size="lg"
                        className="px-8 py-4 text-lg font-semibold"
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
              <Card className="mb-8 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20">
                      <Edit3 className="w-6 h-6 text-accent-blue" />
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
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 resize-none"
                    rows={3}
                    placeholder="Add your workout notes here..."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Exercises */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-emerald/20 to-accent-blue/20">
                      <Target className="w-6 h-6 text-accent-emerald" />
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
                      <div className="w-20 h-20 bg-gradient-to-br from-accent-emerald/20 to-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-10 h-10 text-accent-emerald" />
                      </div>
                      <h3 className="text-white/80 text-xl font-semibold mb-2">No exercises added yet</h3>
                      {isWorkoutActive && (
                        <p className="text-white/50 text-sm mb-6">Start adding exercises to track your workout progress</p>
                      )}
                      {isWorkoutActive && (
                        <Button
                          onClick={() => setIsAddExerciseOpen(true)}
                          variant="gradient"
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
                          <div className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                                {exercise.name}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.sets} sets
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.reps} reps
                                </Badge>
                                {(exercise.weight ?? 0) > 0 && (
                                  <Badge variant="info" className="text-xs">
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
                                  className="h-8 w-8 text-accent-blue hover:text-accent-blue hover:bg-accent-blue/10"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => deleteExercise(exercise.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
