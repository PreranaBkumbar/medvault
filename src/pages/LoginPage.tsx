import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/DashboardCard';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Activity, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<{message: string, isProviderError?: boolean} | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleProviderError = (err: any) => {
    if (err.code === 'auth/operation-not-allowed') {
      setError({
        message: "Authentication provider is disabled. Please enable 'Email/Password' and 'Google' in your Firebase Console -> Authentication -> Sign-in method.",
        isProviderError: true
      });
    } else {
      setError({ message: err.message });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const path = `users/${user.uid}`;
        try {
          // Use the selected role from the UI state for new Google accounts
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'New User',
            role: role, 
            onboarded: false,
            isSharing: role === 'patient' ? true : false,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
        navigate('/onboarding');
      } else {
        navigate('/patient/dashboard'); // App logic handles role redirect
      }
    } catch (err: any) {
      handleProviderError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/'); // Redirect handles role
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const path = `users/${user.uid}`;
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email,
            name,
            role,
            onboarded: false,
            isSharing: role === 'patient' ? true : false,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
        
        navigate('/onboarding');
      }
    } catch (err: any) {
      handleProviderError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white overflow-hidden flex flex-col md:flex-row">
      {/* Left Column: Brand & Hero */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 border-r border-slate-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[100px] opacity-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">MedVault</span>
          </div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[80px] leading-[0.9] font-black tracking-tighter text-white"
            >
              YOUR <br />
              <span className="text-blue-500">HEALTH</span> <br />
              PORTABLE.
            </motion.h1>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-medium">
              The world's first truly private, high-performance medical identity layer. Built for patients, verified by doctors.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Protocol</p>
            <p className="text-sm font-bold text-white">AES-256 GCM</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Availability</p>
            <p className="text-sm font-bold text-white">99.9% Global</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Audit</p>
            <p className="text-sm font-bold text-white">Verified</p>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Forms */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-24 overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Access your Vault' : 'Initialize Identity'}
            </h2>
            <p className="text-sm font-bold text-slate-400 mt-2">
              {isLogin ? 'Enter your credentials to decrypt your health data.' : 'Create your decentralized medical identifier.'}
            </p>
          </div>

          {!isLogin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-2 items-start group ${
                    role === 'patient' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'
                  }`}
                >
                  <User className={`w-6 h-6 ${role === 'patient' ? 'text-blue-600 animate-bounce' : 'text-slate-300'}`} />
                  <span className="text-xs font-black uppercase tracking-widest">Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-2 items-start group ${
                    role === 'doctor' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'
                  }`}
                >
                  <Activity className={`w-6 h-6 ${role === 'doctor' ? 'text-emerald-600 animate-pulse' : 'text-slate-300'}`} />
                  <span className="text-xs font-black uppercase tracking-widest">Professional</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-700 font-black rounded-3xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 disabled:opacity-50 text-sm tracking-tight"
            >
              <img src="https://www.gstatic.com/firebase/anonymous/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-[2px] bg-slate-50"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap">Secure Email Protocol</span>
              <div className="flex-1 h-[2px] bg-slate-50"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 px-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-black text-sm tracking-tight placeholder:text-slate-300"
                    placeholder="FULL NAME"
                  />
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-black text-sm tracking-tight placeholder:text-slate-300"
                  placeholder="EMAIL ADDRESS"
                />
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-black text-sm tracking-tight placeholder:text-slate-300"
                  placeholder="PASSWORD"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`${error.isProviderError ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'} p-4 rounded-3xl text-[10px] font-bold`}
                  >
                    <div className="flex items-center gap-3 uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error.message}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-16 text-white font-black rounded-[32px] transition-all active:scale-95 disabled:grayscale shadow-2xl flex items-center justify-center gap-2 group relative overflow-hidden ${
                  role === 'patient' ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'
                }`}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                <span className="relative tracking-widest uppercase text-sm">
                  {loading ? 'Validating...' : (isLogin ? 'Unlock Vault' : 'Create Identity')}
                </span>
                {!loading && <Activity className="w-4 h-4 relative group-hover:animate-pulse" />}
              </button>
            </form>
          </div>

          <div className="pt-8 text-center border-t border-slate-50">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              {isLogin ? "Transfer to Identity Creation" : 'Switch to Existing Vault'}
            </button>
          </div>
        </div>

        {/* Global Security Disclaimer for Dev Environment */}
        <div className="mt-auto pt-12 max-w-sm">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
             <div className="flex items-center gap-2 mb-2">
               <AlertCircle className="w-3 h-3 text-amber-600" />
               <p className="text-[10px] uppercase font-black tracking-widest text-amber-600">Dev Environment Protocol</p>
             </div>
             <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
               Ensure <b>Email/Google</b> sign-in methods are activated in your Firebase console under Authentication.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
