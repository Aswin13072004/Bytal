# Fitness Monitor App

A modern, mobile-first fitness tracking application built with React, Material-UI, and Supabase. Features a beautiful frosted glass UI theme with smooth animations and responsive design.

## ✨ Features

### 🏠 Dashboard
- **Fitness Statistics**: Track total workouts, current streak, and longest streak
- **Progress Monitoring**: Visual progress bars and charts
- **Weight Progress**: Monthly weight tracking with visual representation
- **Recent Activity**: Timeline of recent fitness activities
- **Responsive Design**: Optimized for mobile devices

### 🏋️ Gym Section
- **Workout Timer**: Start/stop workout sessions with real-time tracking
- **Exercise Management**: Add, edit, and delete exercises during workouts
- **Workout Notes**: Add detailed notes for each session
- **Exercise Details**: Track sets, reps, weight, and personal notes
- **Session History**: View and manage workout sessions

### 👤 Profile Management
- **User Information**: Edit name, email, and personal details
- **Weight Tracking**: Comprehensive weight progress monitoring
- **Streak Counter**: Track consecutive workout days
- **Progress Visualization**: Visual progress bars and charts
- **Data Management**: Add, edit, and delete weight entries

## 🎨 Design Features

- **Frosted Glass Theme**: Modern iOS-inspired glass morphism effects
- **Dark/Light Mode**: Automatic system preference detection with manual toggle
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Mobile-First**: Responsive design optimized for mobile devices
- **Instagram-Inspired UI**: Clean, modern interface with beautiful gradients
- **Accessibility**: Enhanced focus states and keyboard navigation

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Styling**: Emotion + CSS-in-JS
- **Icons**: Material Icons

## 📱 Mobile-First Features

- **Touch-Optimized**: Large touch targets and swipe gestures
- **Responsive Layout**: Adapts to all screen sizes
- **Smooth Scrolling**: Optimized for mobile performance
- **Bottom Navigation**: Easy thumb navigation
- **Safe Area Support**: Modern device compatibility

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd fitness-monitor
npm install
```

### 2. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

#### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  current_weight DECIMAL(5,2) NOT NULL,
  target_weight DECIMAL(5,2) NOT NULL,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout sessions table
CREATE TABLE workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight progress table
CREATE TABLE weight_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_progress ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust according to your auth setup)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own workouts" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exercises" ON exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM workout_sessions WHERE id = exercises.workout_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workout_sessions WHERE id = exercises.workout_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workout_sessions WHERE id = exercises.workout_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM workout_sessions WHERE id = exercises.workout_session_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own weight entries" ON weight_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight entries" ON weight_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight entries" ON weight_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight entries" ON weight_progress FOR DELETE USING (auth.uid() = user_id);
```

### 3. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📱 Usage

### Dashboard
- View your fitness statistics and progress
- Monitor streaks and workout counts
- Track weight changes over time

### Gym
- Start a new workout session
- Add exercises with sets, reps, and weight
- Add workout notes
- Stop session when finished

### Profile
- Update personal information
- Track weight progress
- View streak information
- Manage weight entries

## 🎯 Key Features

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-optimized interactions

### Smooth Animations
- Page transitions
- Component animations
- Micro-interactions
- Loading states

### Theme System
- Automatic dark/light mode detection
- Manual theme toggle
- Consistent color scheme
- Glass morphism effects

## 🔧 Customization

### Colors
Edit the theme colors in `src/contexts/ThemeContext.tsx`:
```typescript
primary: {
  main: '#6366f1', // Change primary color
  light: '#818cf8',
  dark: '#4f46e5',
},
```

### Animations
Modify animation settings in `src/App.css`:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Enhancements

- [ ] Social features and sharing
- [ ] Advanced analytics and insights
- [ ] Workout templates and plans
- [ ] Integration with fitness devices
- [ ] Push notifications
- [ ] Offline support
- [ ] Multi-language support

---

Built with ❤️ using React, Material-UI, and Supabase
