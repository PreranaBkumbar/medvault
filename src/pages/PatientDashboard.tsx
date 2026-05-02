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
  Calendar
} from 'lucide-react';
import { useAuth } from '../App';
import { doc, updateDoc, serverTimestamp, collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { motion, AnimatePresence } from 'motion/react';
import { Reminder } from '../types';

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
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Health Passport</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Hii, {profile.name.split(' ')[0]}!</h1>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-100 p-2 rounded-2xl shadow-sm">
          <div className={`w-3 h-3 rounded-full ${profile.isSharing ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {profile.isSharing ? 'Live Sharing Active' : 'Sharing Disabled'}
          </span>
          <button 
            onClick={toggleSharing}
            className="ml-2 text-[10px] font-bold text-blue-600 hover:underline"
          >
            {profile.isSharing ? 'Disable' : 'Enable'}
          </button>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* QR Access Key - Mobile First */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-50 md:row-span-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-4">Patient Access QR</p>
          <div className="relative group p-4 bg-slate-50 rounded-[40px] border-4 border-white shadow-xl transition-transform hover:scale-102">
            <QRCodeSVG 
              value={`${window.location.origin}/doctor/patient/${profile.uid}`} 
              size={120}
              level="H"
              includeMargin={false}
              className="grayscale brightness-110 contrast-125"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-[40px]">
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-[10px] font-mono font-black text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-2">
              ID: {profile.uid.slice(-6).toUpperCase()}
            </p>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">Patient UID</p>
          </div>
        </Card>

        {/* Action Pills */}
        <div className="md:col-span-3 grid grid-cols-2 gap-4">
          <Link 
            to="/patient/upload" 
            className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-[32px] transition-all flex items-center gap-4 group shadow-xl shadow-blue-100 active:scale-95"
          >
            <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-black text-sm uppercase tracking-widest">Upload</p>
              <p className="text-[10px] opacity-70">Add medical files</p>
            </div>
          </Link>
          <Link 
            to="/patient/timeline" 
            className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-[32px] transition-all flex items-center gap-4 group shadow-xl active:scale-95"
          >
            <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-black text-sm uppercase tracking-widest">History</p>
              <p className="text-[10px] opacity-70">View records</p>
            </div>
          </Link>
        </div>

        {/* Health Metrics & Reminders */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reminders List */}
          <Card className="rounded-[40px] border-none bg-indigo-50/50 shadow-none overflow-hidden h-full">
            <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between border-none">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Reminders
              </CardTitle>
              <button 
                onClick={() => setShowAddReminder(true)}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:scale-110 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {loadingReminders ? (
                <div className="text-center py-4 text-xs font-bold text-indigo-300 uppercase tracking-widest">Syncing...</div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-8 opacity-50 space-y-3">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">All set for now!</p>
                </div>
              ) : (
                reminders.map(rem => (
                  <motion.div 
                    layout
                    key={rem.id} 
                    className={`p-4 rounded-3xl flex items-center justify-between shadow-sm border transition-all ${
                      rem.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-indigo-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${
                        rem.completed ? 'bg-gray-200 text-gray-400' : 
                        rem.type === 'medicine' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {rem.type === 'medicine' ? <Activity className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className={`text-sm font-black transition-all ${rem.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {rem.title}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rem.time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleReminder(rem.id, rem.completed)}
                      className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                        rem.completed ? 'bg-indigo-600 border-indigo-600' : 'border-indigo-100 hover:border-indigo-400'
                      }`}
                    >
                      {rem.completed && <Plus className="w-4 h-4 text-white rotate-45" />}
                    </button>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-4 h-full">
            <div className="bg-white border border-gray-100 p-6 rounded-[40px] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-rose-50 p-4 rounded-3xl text-rose-500">
                  <Heart className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900 font-mono tracking-tighter">72<span className="text-xs ml-1 uppercase opacity-40">bpm</span></p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Heart Rate</p>
                </div>
              </div>
              <div className="h-10 w-24 bg-rose-50 rounded-xl overflow-hidden relative opacity-50">
                {/* Mock Sparkline */}
                <div className="absolute inset-0 flex items-center justify-around px-2">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="w-1 bg-rose-200 rounded-full" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-[40px] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-3xl text-blue-500">
                  <Droplets className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900 font-mono tracking-tighter">1.8<span className="text-xs ml-1 uppercase opacity-40">L</span></p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hydration</p>
                </div>
              </div>
              <div className="h-2 w-24 bg-blue-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[70%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Medical Stats Card */}
        <Card className="md:col-span-4 bg-slate-900 border-none rounded-[40px] text-white p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] -mr-32 -mt-32 opacity-30 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest">Medical ID Verified</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs opacity-50 mb-1 uppercase tracking-widest font-bold">Blood Type</p>
                  <p className="text-2xl font-black text-blue-400">{profile.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-xs opacity-50 mb-1 uppercase tracking-widest font-bold">Age / Sex</p>
                  <p className="text-2xl font-black">{profile.age} / {profile.gender}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <p className="text-xs opacity-50 mb-1 uppercase tracking-widest font-bold">Address</p>
              <p className="text-lg font-medium leading-relaxed italic line-clamp-2">“{profile.address}”</p>
            </div>
          </div>
        </Card>

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
