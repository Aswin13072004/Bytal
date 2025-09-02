import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Dumbbell, 
  Clock,
  Home,
  Activity,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const BottomNavigationComponent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const getCurrentValue = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'dashboard';
      case '/gym':
        return 'gym';
      case '/profile':
        return 'profile';
      default:
        return 'dashboard';
    }
  };

  const currentValue = getCurrentValue();


  const navItems = [
    {
      id: 'dashboard',
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/20',
      borderColor: 'border-accent-blue/30'
    },
    {
      id: 'gym',
      path: '/gym',
      icon: Dumbbell,
      label: 'Gym',
      color: 'text-accent-emerald',
      bgColor: 'bg-accent-emerald/20',
      borderColor: 'border-accent-emerald/30'
    },
    {
      id: 'timer',
      path: '/timer',
      icon: Clock,
      label: 'Timer',
      color: 'text-accent-purple',
      bgColor: 'bg-accent-purple/20',
      borderColor: 'border-accent-purple/30'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-around items-center p-3">
              {navItems.map((item) => {
                const isActive = currentValue === item.id;
                const Icon = item.icon;
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => handleChange({} as React.SyntheticEvent, item.path)}
                      variant="ghost"
                      className={`w-full flex flex-col items-center py-3 px-2 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? `${item.color} ${item.bgColor} border ${item.borderColor}`
                          : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="relative mb-2">
                        <Icon className="w-6 h-6" />
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full"
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                );
              })}
              

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BottomNavigationComponent;
