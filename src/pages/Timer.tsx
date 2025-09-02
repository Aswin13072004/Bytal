import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Pause, Play, RotateCcw, Save, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dbOperations } from '../utils/supabase';

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const Timer: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [note, setNote] = useState('Exercise');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [countdownInput, setCountdownInput] = useState(60); // seconds
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const baseElapsedRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const tick = (ts: number) => {
    if (startRef.current == null) startRef.current = ts;
    const delta = ts - startRef.current;
    const next = baseElapsedRef.current + delta;
    setElapsedMs(next);
    frameRef.current = requestAnimationFrame(tick);
  };

  const onStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startRef.current = null;
    frameRef.current = requestAnimationFrame(tick);
  };

  const onPause = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    baseElapsedRef.current = elapsedMs;
  };

  const onReset = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setIsRunning(false);
    startRef.current = null;
    baseElapsedRef.current = 0;
    setElapsedMs(0);
  };

  const onSave = async () => {
    if (!user) return;
    const timeSeconds = mode === 'stopwatch'
      ? Math.floor(elapsedMs / 1000)
      : Math.max(0, countdownInput - Math.floor(elapsedMs / 1000));
    try {
      await dbOperations.createTimerEntry({
        user_id: user.id,
        note: note || 'Exercise',
        time: timeSeconds,
      });
      onReset();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save timer', e);
    }
  };

  const displayedMs = mode === 'stopwatch' ? elapsedMs : Math.max(0, countdownInput * 1000 - elapsedMs);
  const isFinished = mode === 'countdown' && displayedMs <= 0 && (elapsedMs > 0);

  return (
    <div className="min-h-screen bg-amoled-950 pb-24">
      <div className="p-6 pt-10 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Timer</h1>
          </div>
          <div className="flex gap-2 bg-white/10 border border-white/20 rounded-2xl p-1">
            <button
              onClick={() => { onReset(); setMode('stopwatch'); }}
              className={`px-3 py-1 rounded-xl text-sm ${mode==='stopwatch' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
            >Stopwatch</button>
            <button
              onClick={() => { onReset(); setMode('countdown'); }}
              className={`px-3 py-1 rounded-xl text-sm ${mode==='countdown' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
            >Countdown</button>
          </div>
        </div>

        {mode === 'countdown' && (
          <div className="mb-6">
            <label className="block text-sm text-white/70 mb-2">Countdown (seconds)</label>
            <input
              type="number"
              min={0}
              value={countdownInput}
              onChange={(e) => setCountdownInput(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        )}

        <div className="text-center mb-8">
          <div className="text-6xl md:text-7xl font-mono font-bold text-white tracking-widest">
            {formatTime(displayedMs)}
          </div>
          {isFinished && <div className="mt-2 text-emerald-400">Time's up!</div>}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Note</label>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Exercise"
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none"
            />
            <button
              onClick={() => setNote('Exercise')}
              className="px-4 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
              title="Reset note"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={onStart} className="px-6 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
              <Play className="w-5 h-5" /> Start
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={onPause} className="px-6 py-3 rounded-2xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-2">
              <Pause className="w-5 h-5" /> Pause
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.95 }} onClick={onReset} className="px-6 py-3 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> Reset
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onSave} className="px-6 py-3 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-2">
            <Save className="w-5 h-5" /> Save
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Timer;


