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
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardHeader>
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Activity className="text-blue-600 w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className="text-center text-gray-500 mt-2">
              Portable health records, anywhere.
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            {!isLogin && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all shadow-sm ${
                      role === 'patient' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50' 
                        : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-bold text-sm">Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all shadow-sm ${
                      role === 'doctor' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50' 
                        : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                    <span className="font-bold text-sm">Doctor</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebase/anonymous/google.svg" alt="Google" className="w-5 h-5" />
                {isLogin ? 'Login with Google' : `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </button>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">OR USE EMAIL</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pb-2 text-left"
                >
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-100 border text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                      placeholder="e.g. Alex Smith"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-100 border text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-gray-100 border text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                  placeholder="••••••••"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${error.isProviderError ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'} p-4 rounded-2xl text-xs font-bold space-y-2`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error.message}</span>
                    </div>
                    {error.isProviderError && (
                      <a 
                        href="https://console.firebase.google.com/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="block underline hover:opacity-80"
                      >
                        Open Firebase Console
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-[24px] hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 shadow-xl shadow-blue-100 mt-4 text-lg"
              >
                {loading ? 'Authenticating...' : (isLogin ? 'Login to Vault' : 'Create Secure ID')}
              </button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center flex-col items-center gap-4 py-6 bg-gray-50 rounded-b-2xl border-none">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </CardFooter>
        </Card>
      </motion.div>
      <div className="mt-8 text-center px-4 max-w-sm">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-600 mb-2">Final Setup Required</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Firebase requires a one-time manual activation of sign-in methods:
          </p>
          <ol className="text-[10px] text-amber-700 mt-2 list-decimal list-inside space-y-1">
            <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a></li>
            <li>Go to <b>Authentication</b> → <b>Sign-in method</b></li>
            <li>Enable <b>Email/Password</b> and <b>Google</b></li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
