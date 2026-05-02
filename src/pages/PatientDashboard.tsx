import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Upload, 
  Clock, 
  User, 
  Share2, 
  ShieldCheck, 
  ShieldOff,
  ChevronRight,
  Bell,
  Activity,
  Droplets,
  Heart,
  Plus,
  X as XIcon,
  Calendar,
  Zap
} from 'lucide-react';
import { useAuth } from '../App';
import { doc, updateDoc, serverTimestamp, collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { motion, AnimatePresence } from 'motion/react';
import { Reminder } from '../types';

const LifeScore: React.FC<{ score: number }> = ({ score }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <div className="absolute inset-0 bg-blue-600/5 rounded-full animate-pulse" />
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-slate-100 fill-none"
          strokeWidth="8"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
          cx="56"
          cy="56"
          r={radius}
          className="stroke-blue-600 fill-none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-slate-900 tracking-tighter">{score}</p>
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pulse</p>
      </div>
    </div>
  );
};

const PatientDashboard: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = React.useState(true);
  const [showAddReminder, setShowAddReminder] = React.useState(false);
  const [newReminder, setNewReminder] = React.useState({ title: '', time: '09:00', type: 'medicine' as const });

  React.useEffect(() => {
    if (!profile) return;
    
    const path = 'reminders';
    const q = query(
      collection(db, path),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(remindersList.sort((a, b) => a.time.localeCompare(b.time)));
      setLoadingReminders(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [profile]);

  if (!profile) return null;

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    const path = `reminders/${id}`;
    try {
      await updateDoc(doc(db, 'reminders', id), {
        completed: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'reminders';
    try {
      await addDoc(collection(db, path), {
        userId: profile.uid,
        title: newReminder.title,
        time: newReminder.time,
        type: newReminder.type,
        completed: false,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        createdAt: serverTimestamp()
      });
      setShowAddReminder(false);
      setNewReminder({ title: '', time: '09:00', type: 'medicine' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleSharing = async () => {
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        isSharing: !profile.isSharing,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error toggling sharing:", error);
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto px-4">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
        <Activity className="absolute top-20 right-[-10%] w-96 h-96" />
        <Heart className="absolute bottom-20 left-[-10%] w-80 h-80" />
      </div>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Bio-Identity Active</p>
          </div>
          <h1 className="text-[56px] leading-none font-black text-gray-900 tracking-tighter">
            Hii, {profile.name.split(' ')[0]} <span className="text-blue-600">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-white border-2 border-slate-50 p-3 pr-5 rounded-[28px] shadow-sm">
          <div className={`p-3 rounded-2xl ${profile.isSharing ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
            {profile.isSharing ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {profile.isSharing ? 'Network Sharing' : 'Offline Mode'}
            </p>
            <button 
              onClick={toggleSharing}
              className={`text-xs font-black uppercase tracking-widest ${profile.isSharing ? 'text-emerald-600' : 'text-blue-600'} hover:opacity-70 transition-opacity`}
            >
              {profile.isSharing ? 'Stop Broadcast' : 'Go Live'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Vitality Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 lg:col-span-3 bg-white rounded-[48px] p-8 border-2 border-slate-50 shadow-sm flex flex-col items-center justify-between min-h-[340px]"
        >
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-8">Bio-Vitality Score</p>
            <LifeScore score={92} />
          </div>
          
          <div className="w-full space-y-3">
             <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sync Status</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">100%</span>
             </div>
             <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed">
               Your health score is based on recent check-ups and reminder compliance.
             </p>
          </div>
        </motion.div>

        {/* Global Access Link */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-8 lg:col-span-4 bg-slate-900 rounded-[48px] p-8 text-white relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 rounded-full blur-[80px] -mr-24 -mt-24 opacity-30 group-hover:opacity-50 transition-opacity" />
          
          <div className="relative h-full flex flex-col justify-between space-y-8">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <p className="text-[8px] font-black uppercase tracking-widest text-blue-300 animate-pulse">Live Link</p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2 uppercase italic leading-none">Global Access <br /><span className="text-blue-500">Key .</span></h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Patient UID: {profile.uid.slice(-12).toUpperCase()}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-3xl shrink-0">
                <QRCodeSVG 
                  value={`${window.location.origin}/doctor/patient/${profile.uid}`} 
                  size={80}
                  level="H"
                  className="grayscale contrast-125"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                Doctors can scan this code to securely view your authorized records in real-time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Actions */}
        <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="h-full">
            <Link 
              to="/patient/upload" 
              className="h-full bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[48px] transition-all flex flex-col justify-between group shadow-2xl shadow-blue-100 active:scale-95 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                <Upload className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-xl uppercase tracking-widest mb-1">Add Data</p>
                <p className="text-xs opacity-70 font-bold uppercase tracking-wider">Sync records</p>
              </div>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="h-full">
            <Link 
              to="/patient/timeline" 
              className="h-full bg-slate-100 hover:bg-slate-200 text-slate-900 p-8 rounded-[48px] transition-all flex flex-col justify-between group active:scale-95 border-2 border-transparent hover:border-slate-300"
            >
              <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-xl uppercase tracking-widest mb-1">Timeline</p>
                <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Record logs</p>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Reminders & Health Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Reminders List */}
          <Card className="rounded-[48px] border-none bg-indigo-50/50 shadow-none overflow-hidden min-h-[400px]">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between border-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-600">Protocol Reminders</CardTitle>
              </div>
              <button 
                onClick={() => setShowAddReminder(true)}
                className="p-3 bg-white text-indigo-600 rounded-2xl hover:scale-110 transition-all shadow-sm border border-indigo-100"
              >
                <Plus className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {loadingReminders ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                   <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Hydrating state...</div>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12 opacity-50 space-y-4">
                  <div className="w-16 h-16 bg-white text-indigo-200 rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                    <Bell className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Zero active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map(rem => (
                    <motion.div 
                      layout
                      key={rem.id} 
                      className={`p-5 rounded-[32px] flex items-center justify-between shadow-sm border transition-all ${
                        rem.completed ? 'bg-white/40 border-slate-100 grayscale opacity-40' : 'bg-white border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${
                          rem.completed ? 'bg-slate-100 text-slate-400' : 
                          rem.type === 'medicine' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {rem.type === 'medicine' ? <Activity className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`text-sm font-black transition-all ${rem.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {rem.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rem.time}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleReminder(rem.id, rem.completed)}
                        className={`w-10 h-10 rounded-2xl border-2 transition-all flex items-center justify-center ${
                          rem.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-100 hover:border-indigo-400'
                        }`}
                      >
                        <Plus className={`w-5 h-5 transition-transform ${rem.completed ? 'text-white rotate-45' : 'text-slate-300'}`} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-6 h-full">
            <motion.div whileHover={{ y: -5 }} className="bg-white border-2 border-slate-50 p-8 rounded-[48px] flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-6">
                <div className="bg-rose-50 p-5 rounded-[32px] text-rose-500 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-4xl font-black text-gray-900 font-mono tracking-tighter">72<span className="text-sm ml-1 uppercase opacity-40 font-sans">bpm</span></p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Average Heart Rate</p>
                </div>
              </div>
              <div className="h-12 w-28 bg-rose-50 rounded-2xl overflow-hidden relative opacity-50">
                <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="w-2 bg-rose-200 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-white border-2 border-slate-50 p-8 rounded-[48px] flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-6">
                <div className="bg-blue-50 p-5 rounded-[32px] text-blue-500 group-hover:scale-110 transition-transform">
                  <Droplets className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-4xl font-black text-gray-900 font-mono tracking-tighter">1.8<span className="text-sm ml-1 uppercase opacity-40 font-sans">L</span></p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Hydration Index</p>
                </div>
              </div>
              <div className="h-3 w-28 bg-blue-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ duration: 1, delay: 1 }}
                  className="h-full bg-blue-500" 
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Verification Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="md:col-span-12 lg:col-span-4 bg-emerald-600 rounded-[48px] p-8 text-white relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight leading-none">Identity <br />Verified</h3>
              <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mt-1">Tier 1 Secure</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-white/20 pb-4">
                <div>
                  <p className="text-[8px] uppercase font-black opacity-60 tracking-widest mb-1">Blood Type</p>
                  <p className="text-3xl font-black tracking-tighter">{profile.bloodGroup}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase font-black opacity-60 tracking-widest mb-1">Age / Sex</p>
                  <p className="text-xl font-black tracking-tighter">{profile.age} <span className="opacity-40">/</span> {profile.gender}</p>
                </div>
             </div>
             <p className="text-[10px] font-bold text-emerald-100 italic leading-relaxed">
               “{profile.address}”
             </p>
          </div>
        </motion.div>

      </div>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddReminder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddReminder(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">New Reminder</h3>
                <button 
                  onClick={() => setShowAddReminder(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Morning Meds"
                    className="w-full bg-slate-50 border-none rounded-3xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                    value={newReminder.title}
                    onChange={e => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-slate-50 border-none rounded-3xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                      value={newReminder.time}
                      onChange={e => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Type</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-3xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                      value={newReminder.type}
                      onChange={e => setNewReminder(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <option value="medicine">Medicine</option>
                      <option value="appointment">Appointment</option>
                      <option value="generic">Other</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[32px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  CREATE REMINDER
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientDashboard;
