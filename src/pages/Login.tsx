import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, User, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, name);
        setError('Please check your email to confirm your account!');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-amoled-950">
      {/* AMOLED Dark Background with Elegant Particles */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amoled-950 via-amoled-900 to-amoled-800"></div>
        
        {/* Elegant floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-accent-purple/8 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent-cyan/6 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Subtle animated particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
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
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md transform transition-all duration-700 ease-out animate-fade-in-up"
        >
          <Card className="backdrop-blur-2xl bg-white/5 border-white/10 shadow-2xl relative overflow-hidden">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
            
            <CardHeader className="text-center pb-8 relative z-10">
              {/* Logo Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-8 h-8 text-accent-blue" />
                      <Zap className="w-6 h-6 text-accent-purple" />
                    </div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="secondary" className="bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Secure
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold text-white tracking-wide">
                    Bytal
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Elegant fitness tracking platform
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-xl flex items-center gap-3 text-red-300 text-sm animate-fade-in">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2 animate-fade-in-up">
                    <label className="text-sm font-medium text-white/90">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-12"
                        required
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 focus:outline-none transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold"
                  variant="gradient"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </>
                  ) : (
                    <>
                      <LogIn size={20} className="mr-2" />
                      {isSignUp ? "Create Account" : "Sign In"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            {/* Toggle Sign Up/Sign In */}
            <div className="px-6 pb-6 text-center relative z-10">
              <div className="space-y-3">
                <p className="text-white/60 text-sm">
                  {isSignUp ? "Already have an account?" : "New to Bytal?"}
                </p>
                <Button
                  onClick={() => setIsSignUp(!isSignUp)}
                  variant="outline"
                  size="sm"
                  className="text-white/90 hover:text-white border-white/20 hover:border-white/30"
                >
                  {isSignUp ? "Sign In Instead" : "Create Account"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;