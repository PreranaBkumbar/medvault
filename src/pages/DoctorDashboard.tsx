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
  Sparkles,
  Zap,
  Activity,
  ShieldCheck
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
    <div className="space-y-8 max-w-5xl mx-auto pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0 overflow-hidden">
        <Activity className="absolute bottom-40 right-[-5%] w-[350px] h-[350px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 px-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Secure Node #4829</p>
          </div>
          <h1 className="text-[56px] leading-[0.8] font-black text-slate-900 tracking-tighter">
            DR. {profile.name.split(' ')[0].toUpperCase()} <span className="text-emerald-600">_</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 flex items-center gap-3 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Node Active</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 px-4">
        
        {/* Verification Hub */}
        <Card className="md:col-span-4 bg-slate-900 rounded-[48px] border-none text-white p-8 px-10 flex flex-col justify-between min-h-[400px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-emerald-500 transition-all">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Rank</p>
                  <p className="text-xs font-black uppercase text-emerald-500">Verified Pro</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight">{profile.degree || 'Medical Staff'}</h2>
                  <p className="font-mono text-[10px] text-slate-500 mt-2 uppercase tracking-[0.2em]">S/N: {profile.uid.slice(-12).toUpperCase()}</p>
                </div>
                
                <div className="bg-white/5 rounded-3xl p-4 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-500">Session Status</span>
                    <span className="text-[9px] font-black uppercase text-emerald-500">Encrypted</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="h-full bg-emerald-500" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4">Cache Sessions</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(id => (
                    <button
                      key={id}
                      onClick={() => navigate(`/doctor/patient/${id}`)}
                      className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition-all border border-white/5"
                    >
                      {id.slice(-6).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Global Patient Portal */}
        <Card className="md:col-span-8 bg-white rounded-[48px] border-2 border-slate-50 p-10 px-12 flex flex-col justify-between shadow-2xl shadow-indigo-100/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Portal Gateway .</h2>
            </div>
            
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className={`h-14 px-8 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
                showScanner 
                  ? 'bg-rose-50 text-rose-600' 
                  : 'bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-xl shadow-slate-200'
              }`}
            >
              {showScanner ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              {showScanner ? 'Abort Scan' : 'Trigger Scanner'}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {showScanner ? (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="relative max-w-md mx-auto">
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-3xl pointer-events-none animate-pulse" />
                    <div id="reader" className="w-full bg-slate-900 rounded-3xl overflow-hidden border-8 border-white shadow-2xl" />
                    <div className="absolute inset-x-0 top-1/2 h-[2px] bg-emerald-500/50 animate-scan pointer-events-none" />
                  </div>
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse italic">Awaiting Biometric ID Handshake...</p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSearch} 
                  className="space-y-8"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                      <User className="w-6 h-6 text-slate-200 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full pl-20 pr-8 py-8 bg-slate-50 rounded-[40px] border-4 border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all font-mono text-lg tracking-widest placeholder:text-slate-200 placeholder:font-sans placeholder:tracking-tight"
                      placeholder="ENTER GLOBAL PATIENT UID"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 h-20 bg-emerald-600 text-white font-black rounded-[40px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-emerald-100 active:scale-95 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                      <Zap className="w-6 h-6 group-hover:animate-bounce" />
                      <span className="text-sm tracking-[0.2em] uppercase">Authenticate Session</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center gap-6 justify-center md:justify-start grayscale opacity-30">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">End-to-End</span>
             </div>
             <div className="w-px h-3 bg-slate-200" />
             <div className="flex items-center gap-2">
               <History className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Real-time sync</span>
             </div>
          </div>
        </Card>

        {/* Global Status Indicators */}
        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'Network Latency', value: '18ms', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
             { label: 'Active Channels', value: '1,284', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
             { label: 'Auth Success Rate', value: '99.98%', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
             { label: 'Region Hub', value: 'ASIA-01', icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' }
           ].map((stat, i) => (
             <Card key={i} className="border-none bg-white p-6 rounded-[32px] flex items-center gap-5 shadow-sm border-2 border-slate-50">
                <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                   <p className="text-xl font-black text-slate-900 font-mono italic">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;
