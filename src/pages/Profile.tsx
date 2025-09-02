import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { WeightProgress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { dbOperations, subscribeToRealtime } from '../utils/supabase';
import { 
  User as UserIcon, 
  Target, 
  Edit3, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Flame, 
  Weight,
  Activity,
  Settings,
  Save,
  CheckCircle,
  Award,
  Sparkles,
  Star,
  LogOut,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
// Removed unused Input import
import { Badge } from '../components/ui/badge';


const Profile: React.FC = () => {
  const { user: authUser, signOut } = useAuth();
  const [user, setUser] = useState<{ name: string; streak_count: number; email: string; created_at: string; updated_at: string } | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightProgress | null>(null);
  const [newWeight, setNewWeight] = useState({
    weight: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
  });

  const loadProfileData = React.useCallback(async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      const userData = await dbOperations.getUser(authUser.id);
      if (userData) {
        setUser(userData);
        setProfileForm({ name: userData.name });
      } else {
        setUser(null);
      }
      const weightData = await dbOperations.getWeightProgress(authUser.id);
      setWeightHistory(weightData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      loadProfileData();
      const weightSubscription = subscribeToRealtime('weight_progress', (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadProfileData();
        }
      });
      return () => {
        weightSubscription.unsubscribe();
      };
    }
  }, [authUser, loadProfileData]);

  // Refresh data when returning to tab to prevent stuck loading after alt-tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && authUser) {
        loadProfileData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [authUser, loadProfileData]);

  // Safety timeout to ensure the loading spinner does not hang indefinitely
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  // removed duplicate loadProfileData definition

  const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
  const weightChange = weightHistory.length > 1 
    ? weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight 
    : 0;
  
  const progressToTarget = 0; // Simplified for now since we don't have target weight in new schema

  const addWeightEntry = async () => {
    if (!authUser || newWeight.weight <= 0) return;
    
    try {
      await dbOperations.createWeightEntry({
        user_id: authUser.id,
        weight: newWeight.weight,
        date: newWeight.date,
        notes: newWeight.notes,
      });
      
      // Update user's current weight if it's today's entry
      if (newWeight.date === new Date().toISOString().split('T')[0]) {
        setUser((prev: { name: string; streak_count: number; email: string; created_at: string; updated_at: string } | null) => prev ? { ...prev } : null);
      }
      
      setNewWeight({
        weight: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsAddingWeight(false);
      
      // Reload data to get updated information
      loadProfileData();
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  };

  const updateWeightEntry = async () => {
    if (!editingWeight || !authUser || newWeight.weight <= 0) return;
    
    try {
      await dbOperations.updateWeightEntry(editingWeight.id, {
        weight: newWeight.weight,
        date: newWeight.date,
        notes: newWeight.notes,
      });
      
      // Update user's current weight if it's today's entry
      if (newWeight.date === new Date().toISOString().split('T')[0]) {
        setUser((prev: { name: string; streak_count: number; email: string; created_at: string; updated_at: string } | null) => prev ? { ...prev } : null);
      }
      
      setEditingWeight(null);
      setNewWeight({
        weight: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsAddingWeight(false);
      
      // Reload data to get updated information
      loadProfileData();
    } catch (error) {
      console.error('Error updating weight entry:', error);
    }
  };

  const deleteWeightEntry = async (id: string) => {
    if (!authUser) return;
    
    try {
      await dbOperations.deleteWeightEntry(id);
      loadProfileData();
    } catch (error) {
      console.error('Error deleting weight entry:', error);
    }
  };

  const saveProfile = async () => {
    if (!authUser) return;
    
    try {
      const updatedUser = await dbOperations.updateUser(authUser.id, {
        name: profileForm.name,
      });
      
      setUser(updatedUser);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-amoled-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 border-t-accent-purple rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-accent-blue rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="space-y-2">
            <p className="text-white/80 text-xl font-semibold">Loading your profile...</p>
            <p className="text-white/50 text-sm">Preparing your personal dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-amoled-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white/60 mb-2">Profile not found</h2>
          <p className="text-white/40 text-sm">Please try refreshing the page</p>
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-accent-blue/8 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent-emerald/6 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        
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
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-8 h-8 text-accent-purple" />
                    <h1 className="text-4xl font-bold text-white">Profile</h1>
                  </div>
                  <p className="text-white/60 text-lg">Manage your fitness profile and goals</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 hover:scale-105 transition-transform duration-300"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={signOut}
                    variant="destructive"
                    className="px-6 py-3 hover:scale-105 transition-transform duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Profile Info */}
            <motion.div variants={itemVariants}>
              <Card className="mb-8 text-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardContent className="p-8 relative z-10">
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-28 h-28 bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 backdrop-blur-sm rounded-3xl mx-auto flex items-center justify-center border border-white/20 relative overflow-hidden group">
                        <UserIcon className="w-14 h-14 text-white" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Badge variant="secondary" className="bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30">
                          <Star className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                      <p className="text-white/60 text-lg">{user.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Flame className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{user.streak_count || 0}</div>
                        <div className="text-white/60 text-sm font-medium">Day Streak</div>
                        <Badge variant="success" className="mt-2 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          On Fire
                        </Badge>
                      </div>
                      
                      <div className="text-center p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Weight className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">{latestWeight !== null ? latestWeight : '-'}</div>
                        <div className="text-white/60 text-sm font-medium">Recent (kg)</div>
                        <Badge variant="info" className="mt-2 text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          N/A
                        </Badge>
                      </div>
                      
                      <div className="text-center p-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Target className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">-</div>
                        <div className="text-white/60 text-sm font-medium">Target (kg)</div>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          N/A
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weight Progress */}
            <motion.div variants={itemVariants}>
              <Card className="mb-8 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Weight Progress</CardTitle>
                        <CardDescription>
                          {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg total change
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsAddingWeight(true)}
                      variant="outline"
                      size="sm"
                      className="text-white/60 hover:text-white border-white/20 hover:border-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>

                  {/* Progress Bar */}
                  {weightHistory.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-white/60">Progress to target</span>
                        <span className="text-sm text-white/60">{Math.abs(progressToTarget).toFixed(1)}%</span>
                      </div>
                      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-400 to-teal-400"
                          style={{ width: `${Math.abs(progressToTarget)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Weight History */}
                  {weightHistory.length > 0 ? (
                    <div className="space-y-4">
                      {weightHistory.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center p-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                            <div className={`w-12 h-12 rounded-2xl mr-4 flex items-center justify-center ${
                              index === 0 
                                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' 
                                : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                            }`}>
                              <Weight className={`w-6 h-6 ${
                                index === 0 ? 'text-emerald-400' : 'text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-white">{entry.weight} kg</div>
                              <div className="text-white/60 text-sm">{new Date(entry.date).toLocaleDateString()}</div>
                              {entry.notes && (
                                <div className="text-xs text-white/40 mt-1">{entry.notes}</div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingWeight(entry);
                                  setNewWeight({
                                    weight: entry.weight,
                                    date: entry.date,
                                    notes: entry.notes || '',
                                  });
                                  setIsAddingWeight(true);
                                }}
                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteWeightEntry(entry.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-white/40" />
                      </div>
                      <p className="text-white/60 text-lg mb-2">No weight entries yet</p>
                      <p className="text-white/40 text-sm">Start tracking your weight progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Summary */}
            <motion.div variants={itemVariants}>
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 relative overflow-hidden group hover:bg-white/10 transition-all duration-500">
                {/* Glass reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-2xl mr-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Quick Stats</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Flame className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{user.streak_count || 0}</div>
                      <div className="text-white/60 text-sm">Current Streak</div>
                    </div>
                    <div className="text-center p-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                      </div>
                      <div className="text-white/60 text-sm">Weight Change (kg)</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-white/60" />
                  Edit Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                      placeholder="Enter your name"
                    />
                  </div>

                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 backdrop-blur-sm bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 backdrop-blur-sm bg-blue-500/20 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 text-blue-300 font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Weight Dialog */}
      <AnimatePresence>
        {isAddingWeight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Weight className="w-5 h-5 mr-2 text-white/60" />
                  {editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        value={newWeight.weight}
                        onChange={(e) => setNewWeight({ ...newWeight, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                      <input
                        type="date"
                        value={newWeight.date}
                        onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Notes</label>
                    <textarea
                      value={newWeight.notes}
                      onChange={(e) => setNewWeight({ ...newWeight, notes: e.target.value })}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                      rows={3}
                      placeholder="Any notes about this weight entry..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setIsAddingWeight(false);
                      setEditingWeight(null);
                      setNewWeight({
                        weight: 0,
                        date: new Date().toISOString().split('T')[0],
                        notes: '',
                      });
                    }}
                    className="px-4 py-2 backdrop-blur-sm bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingWeight ? updateWeightEntry : addWeightEntry}
                    disabled={newWeight.weight <= 0}
                    className="px-4 py-2 backdrop-blur-sm bg-emerald-500/20 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300 text-emerald-300 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {editingWeight ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
