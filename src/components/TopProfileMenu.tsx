import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TopProfileMenu: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const goProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  const doLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Logout failed', err);
    }
  };

  const name = userProfile?.name || 'Profile';

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
      >
        <User className="w-5 h-5" />
        <span className="max-w-[120px] truncate text-sm">{name}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mt-2 w-44 rounded-2xl overflow-hidden backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl"
          >
            <button
              onClick={goProfile}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-white/10"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={doLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopProfileMenu;


