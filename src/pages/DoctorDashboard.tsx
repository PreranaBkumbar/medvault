import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  QrCode, 
  History, 
  ArrowRight,
  ClipboardList,
  Camera,
  X,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DoctorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('mv_recent_patients');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const addToRecent = (id: string) => {
    const newRecent = [id, ...recentSearches.filter(i => i !== id)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('mv_recent_patients', JSON.stringify(newRecent));
  };

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        let id = decodedText;
        if (decodedText.includes('/doctor/patient/')) {
          id = decodedText.split('/doctor/patient/')[1];
        } else if (decodedText.startsWith('http')) {
          try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            id = pathParts[pathParts.length - 1];
          } catch(e) {}
        }
        
        id = id.trim();
        addToRecent(id);
        scanner.clear();
        setShowScanner(false);
        navigate(`/doctor/patient/${id}`);
      }, (error) => {});

      return () => {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      };
    }
  }, [showScanner, navigate, recentSearches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      const id = patientId.trim();
      addToRecent(id);
      navigate(`/doctor/patient/${id}`);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Terminal v2.0</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Dr. {profile.name.split(' ')[0]}</h1>
        </div>
        <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Secure Link Active</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="bg-white border-blue-100 border-2 overflow-hidden md:col-span-1 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="bg-blue-600 w-20 h-20 rounded-3xl text-white shadow-xl flex items-center justify-center transform rotate-3">
                  <ClipboardList className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-xl shadow-lg">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 leading-tight">{profile.degree || 'Medical Specialist'}</h2>
                <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase tracking-tighter">ID: {profile.uid.slice(-8)}</p>
              </div>
            </div>
            
            {recentSearches.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-3">Recent Patient Sessions</p>
                <div className="space-y-2">
                  {recentSearches.map(id => (
                    <button
                      key={id}
                      onClick={() => navigate(`/doctor/patient/${id}`)}
                      className="w-full text-left p-3 rounded-xl hover:bg-blue-50 group transition-all border border-transparent hover:border-blue-100"
                    >
                      <p className="text-xs font-mono font-bold text-gray-600 group-hover:text-blue-600 truncate">{id}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Search Section */}
        <Card className="shadow-2xl md:col-span-2 border-none ring-1 ring-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="text-blue-600 w-5 h-5" />
                <span>Patient Access Gateway</span>
              </div>
              <button 
                onClick={() => setShowScanner(!showScanner)}
                className={`p-3 rounded-2xl transition-all shadow-sm ${showScanner ? 'bg-red-50 text-red-600' : 'bg-slate-900 text-white hover:scale-105'}`}
              >
                {showScanner ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {showScanner ? (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-blue-600/5 animate-pulse pointer-events-none rounded-3xl" />
                  <div id="reader" className="w-full bg-black rounded-3xl overflow-hidden border-4 border-white shadow-2xl" />
                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Scanning biometric QR layer...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSearch} 
                  className="space-y-4"
                >
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full pl-14 pr-5 py-6 bg-slate-50 rounded-[32px] border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-widest placeholder:font-sans placeholder:tracking-normal"
                      placeholder="Enter Global Patient UID"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-100 active:scale-95 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                    <Search className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    <span className="tracking-widest">AUTHENTICATE & ACCESS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Verification Legend */}
      <Card className="bg-slate-50 border-none shadow-none rounded-[40px]">
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Encrypted Access</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">All record views are end-to-end encrypted and logged for auditing.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-1">Session Protocol</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Automatic session termination if sharing is disabled by patient.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
