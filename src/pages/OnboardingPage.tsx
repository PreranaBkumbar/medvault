import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { motion } from 'motion/react';

const OnboardingPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    degree: ''
  });

  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        ...formData,
        onboarded: true,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
      navigate(profile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden bg-slate-50/50">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-3">Gateway Verification</p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
            FINALIZING <span className="text-blue-600">IDENTITY</span>.
          </h1>
          <p className="text-slate-400 font-medium max-w-sm mx-auto">
            Hello {profile.name}, we need a few more biometric details to secure your account.
          </p>
        </div>

        <Card className="bg-white rounded-[48px] border-2 border-white shadow-2xl shadow-indigo-100/50 p-10 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {profile.role === 'patient' ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Age</label>
                      <input
                        type="number"
                        name="age"
                        required
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-mono text-sm"
                        placeholder="25"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Gender</label>
                      <select
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-sm appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Blood Group</label>
                    <select
                      name="bloodGroup"
                      required
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-sm appearance-none"
                    >
                      <option value="">Select Type</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Residential Coordinates</label>
                    <input
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-8 py-5 rounded-[32px] bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-medium text-sm"
                      placeholder="Street, City, Country"
                    />
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Professional Degree</label>
                    <input
                      name="degree"
                      required
                      value={formData.degree}
                      onChange={handleChange}
                      className="w-full px-8 py-5 rounded-[32px] bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold italic text-sm"
                      placeholder="e.g. MBBS, MD, PhD"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Practice Address</label>
                    <input
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-8 py-5 rounded-[32px] bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-medium text-sm"
                      placeholder="Clinic/Hospital Name, City"
                    />
                  </motion.div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-slate-900 text-white font-black rounded-[40px] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 active:scale-95 disabled:bg-slate-300 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <span className="text-sm tracking-[0.2em] uppercase">
                {loading ? 'SYNCHRONIZING...' : 'ACTIVATE VAULT'}
              </span>
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
