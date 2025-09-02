import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { FitnessStats, WorkoutSession, WeightProgress } from '../types';
import { dbOperations, subscribeToRealtime } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Target, 
  Flame, 
  Calendar,
  RefreshCw,
  BarChart3,
  Zap,
  Trophy,
  Heart,
  Timer,
  Sparkles,
  Star,
  Award,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FitnessStats>({
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageWorkoutDuration: 0,
    totalWorkoutTime: 0,
    weightChange: 0,
    monthlyProgress: [],
  });
  const [loading, setLoading] = useState(true);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightProgress[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setGreeting(getGreeting());
      
      // Subscribe to real-time updates
      const workoutSubscription = subscribeToRealtime('workout_sessions', (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadDashboardData();
        }
      });

      const weightSubscription = subscribeToRealtime('weight_progress', (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadDashboardData();
        }
      });

      return () => {
        workoutSubscription.unsubscribe();
        weightSubscription.unsubscribe();
      };
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load workout sessions
      const workouts = await dbOperations.getWorkoutSessions(user.id);
      setRecentWorkouts(workouts.slice(0, 5)); // Get last 5 workouts
      
      // Load weight progress
      const weightData = await dbOperations.getWeightProgress(user.id);
      setWeightHistory(weightData);
      
      // Calculate stats
      const totalWorkouts = workouts.length;
      const currentStreak = calculateCurrentStreak(workouts);
      const longestStreak = calculateLongestStreak(workouts);
      const averageDuration = totalWorkouts > 0 
        ? Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / totalWorkouts)
        : 0;
      const totalTime = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
      
      // Calculate weight change
      const weightChange = weightData.length > 1 
        ? weightData[0].weight - weightData[weightData.length - 1].weight
        : 0;
      
      // Calculate monthly progress
      const monthlyProgress = calculateMonthlyProgress(workouts, weightData);
      
      setStats({
        totalWorkouts,
        currentStreak,
        longestStreak,
        averageWorkoutDuration: averageDuration,
        totalWorkoutTime: totalTime,
        weightChange,
        monthlyProgress,
      });
      
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      const details = error?.details || error?.hint || '';
      console.error('Error loading dashboard data:', { message, details, error });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = (workouts: WorkoutSession[]): number => {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.startTime);
      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = workoutDate;
      } else if (daysDiff > streak + 1) {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (workouts: WorkoutSession[]): number => {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const prevDate = new Date(sortedWorkouts[i - 1].startTime);
      const currDate = new Date(sortedWorkouts[i].startTime);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(maxStreak, currentStreak);
  };

  const calculateMonthlyProgress = (workouts: WorkoutSession[], weightData: WeightProgress[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const monthIndex = (currentMonth - 5 + index + 12) % 12;
      const monthWorkouts = workouts.filter(w => new Date(w.startTime).getMonth() === monthIndex).length;
      const monthWeight = weightData.find(w => new Date(w.date).getMonth() === monthIndex)?.weight || 0;
      
      return { month, workouts: monthWorkouts, weight: monthWeight };
    });
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

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    progress?: number;
    gradient?: string;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, subtitle, icon, color, progress, gradient, trend = 'neutral' }) => (
    <motion.div variants={itemVariants}>
      <Card className="h-full group hover:scale-105 transition-all duration-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl ${gradient || ''}`} style={{ backgroundColor: `${color}15` }}>
                <div style={{ color: color }}>
                  {icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90">{title}</h3>
                {subtitle && (
                  <p className="text-white/60 text-sm">{subtitle}</p>
                )}
              </div>
            </div>
            {trend !== 'neutral' && (
              <Badge variant={trend === 'up' ? 'success' : 'destructive'} className="text-xs">
                {trend === 'up' ? '↗' : '↘'}
              </Badge>
            )}
          </div>
          
          <div className="text-3xl font-bold mb-3 text-white">
            {value}
          </div>
          
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/60">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${color}40, ${color})`
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-amoled-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-accent-purple rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="space-y-2">
            <p className="text-white/80 text-xl font-semibold">Loading your fitness data...</p>
            <p className="text-white/50 text-sm">Preparing your personalized dashboard</p>
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-accent-purple/8 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent-cyan/6 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Subtle animated particles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
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

      {/* Main Content */}
      <div className="relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <div className="p-6 pt-8">
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-accent-blue" />
                    <h1 className="text-2xl font-bold text-white/90">{greeting}</h1>
                  </div>
                  <h2 className="text-4xl font-bold text-white">Welcome back!</h2>
                  <p className="text-white/60 text-lg">Track your fitness journey with real-time updates</p>
                </div>
                <Button
                  onClick={loadDashboardData}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 hover:scale-105 transition-transform duration-300"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatCard
                title="Current Streak"
                value={stats.currentStreak}
                subtitle="days"
                icon={<Flame className="w-6 h-6" />}
                color="#ef4444"
                progress={stats.longestStreak > 0 ? (stats.currentStreak / stats.longestStreak) * 100 : 0}
                gradient="bg-gradient-to-br from-red-500/20 to-orange-500/20"
                trend={stats.currentStreak > 0 ? 'up' : 'neutral'}
              />
              <StatCard
                title="Total Workouts"
                value={stats.totalWorkouts}
                subtitle="sessions"
                icon={<Activity className="w-6 h-6" />}
                color="#3b82f6"
                progress={Math.min((stats.totalWorkouts / 30) * 100, 100)}
                gradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                trend={stats.totalWorkouts > 0 ? 'up' : 'neutral'}
              />
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatCard
                title="Average Duration"
                value={`${stats.averageWorkoutDuration} min`}
                subtitle="per workout"
                icon={<Clock className="w-6 h-6" />}
                color="#8b5cf6"
                progress={Math.min((stats.averageWorkoutDuration / 60) * 100, 100)}
                gradient="bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
              />
              <StatCard
                title="Total Time"
                value={`${Math.round(stats.totalWorkoutTime / 60)}h`}
                subtitle="all time"
                icon={<Timer className="w-6 h-6" />}
                color="#10b981"
                progress={Math.min((stats.totalWorkoutTime / 3600) * 100, 100)}
                gradient="bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                trend="up"
              />
            </div>

            {/* Weight Progress */}
            {weightHistory.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="mb-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                          <Target className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Weight Progress</CardTitle>
                          <CardDescription>
                            {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg total change
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={stats.weightChange > 0 ? 'destructive' : 'success'} className="text-sm">
                        {stats.weightChange > 0 ? 'Gained' : 'Lost'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl font-bold text-emerald-400">
                          {weightHistory[0]?.weight} kg
                        </div>
                        <div className="text-white/60 text-sm">
                          Current weight
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-white/80 font-medium">Monthly Activity</h4>
                        <div className="flex justify-between items-end h-32 space-x-2">
                          {stats.monthlyProgress.map((month, index) => (
                            <div key={month.month} className="text-center flex-1 group">
                              <div
                                className="bg-gradient-to-t from-emerald-400 to-teal-400 rounded-t-lg mb-2 min-h-5 transition-all duration-500 hover:scale-110 cursor-pointer"
                                style={{ height: `${Math.max((month.workouts / 25) * 80, 20)}px` }}
                                title={`${month.workouts} workouts in ${month.month}`}
                              ></div>
                              <p className="text-white/60 text-xs group-hover:text-white/80 transition-colors">{month.month}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card className="mb-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Recent Activity</CardTitle>
                        <CardDescription>Your latest workout sessions</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-white/60 hover:text-white">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {recentWorkouts.length > 0 ? (
                    <div className="space-y-3">
                      {recentWorkouts.map((workout, index) => (
                        <div key={workout.id} className="flex items-center p-4 backdrop-blur-sm bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                          <div className="w-3 h-3 bg-accent-blue rounded-full mr-4 animate-pulse"></div>
                          <div className="flex-1">
                            <p className="text-white/90 font-medium group-hover:text-white transition-colors">
                              {workout.notes || `Workout session - ${workout.duration || 0} min`}
                            </p>
                            <p className="text-white/50 text-sm">
                              {new Date(workout.startTime).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="flex items-center text-white/40 group-hover:text-white/60 transition-colors">
                            <Timer className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{workout.duration || 0}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-10 h-10 text-accent-blue" />
                      </div>
                      <h3 className="text-white/80 text-xl font-semibold mb-2">No workouts yet</h3>
                      <p className="text-white/50 text-sm mb-6">Start your fitness journey today and track your progress!</p>
                      <Button variant="gradient" className="px-8">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start First Workout
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievement Section */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Achievements</CardTitle>
                      <CardDescription>Your fitness milestones and progress</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Heart className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">{stats.currentStreak}</div>
                      <div className="text-white/60 text-sm font-medium">Day Streak</div>
                      <Badge variant="success" className="mt-2 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    
                    <div className="text-center p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">{stats.totalWorkouts}</div>
                      <div className="text-white/60 text-sm font-medium">Total Sessions</div>
                      <Badge variant="info" className="mt-2 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Milestone
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
