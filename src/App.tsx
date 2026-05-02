import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';

// Pages
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import PatientTimeline from './pages/PatientTimeline';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientView from './pages/DoctorPatientView';

// Components
import Navbar from './components/Navbar';
import { HealthuChat } from './components/HealthuChat';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchProfile(user.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'patient' | 'doctor' }> = ({ children, role }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && !profile.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (role && profile && profile.role !== role) {
    return <Navigate to={profile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;
  }

  return <>{children}</>;
};

const IndexRedirect: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.onboarded) return <Navigate to="/onboarding" replace />;
  if (profile?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 max-w-4xl mx-auto w-full p-4">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />

              {/* Patient Routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute role="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/upload" element={
                <ProtectedRoute role="patient">
                  <PatientUpload />
                </ProtectedRoute>
              } />
              <Route path="/patient/timeline" element={
                <ProtectedRoute role="patient">
                  <PatientTimeline />
                </ProtectedRoute>
              } />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute role="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/patient/:id" element={
                <ProtectedRoute role="doctor">
                  <DoctorPatientView />
                </ProtectedRoute>
              } />

              <Route path="/" element={<IndexRedirect />} />
            </Routes>
          </main>
          <HealthuChat />
        </div>
      </Router>
    </AuthProvider>
  );
}
