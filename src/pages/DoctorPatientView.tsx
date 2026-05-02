import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, MedicalRecord } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { 
  ChevronLeft, 
  User, 
  ShieldOff, 
  FileText, 
  ExternalLink, 
  Calendar,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

const DoctorPatientView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Patient Profile
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError("Patient not found. Please verify the UID.");
          setLoading(false);
          return;
        }

        const patientData = docSnap.data() as UserProfile;
        setPatient(patientData);

        // 2. Check Sharing Status
        if (!patientData.isSharing) {
          setLoading(false);
          return;
        }

        // 3. Fetch Records
        const q = query(
          collection(db, 'records'),
          where('patientId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const recordData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MedicalRecord[];
        setRecords(recordData);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Access Denied. Ensure the patient has enabled sharing.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">Securely fetching patient data...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full flex items-center gap-2 text-gray-500 font-medium">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <Card className="border-red-100 bg-red-50 py-10 px-6 text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-full inline-block mb-4">
            <ShieldOff className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{error || 'Access Restricted'}</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            This patient either doesn't exist or has disabled data sharing with medical professionals.
          </p>
          <button 
            onClick={() => navigate('/doctor/dashboard')}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
          >
            Return to Terminal
          </button>
        </Card>
      </div>
    );
  }

  // Check sharing one more time (redundant but safe)
  if (!patient.isSharing) {
    return (
       <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full flex items-center gap-2 text-gray-500 font-medium">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <Card className="border-yellow-100 bg-yellow-50 py-10 px-6 text-center shadow-none">
          <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full inline-block mb-4">
            <ShieldOff className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Sharing Disabled</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Dr. {patient.name} has not shared their medical records with you. Please ask them to toggle 'Sharing ON' in their dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient File</h1>
      </div>

      {/* Patient Header */}
      <Card className="bg-white shadow-xl border-t-4 border-t-green-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="bg-gray-100 p-4 rounded-2xl">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                   {patient.age} Yrs • {patient.gender}
                </span>
                <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> {patient.bloodGroup}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Email Address</p>
              <p className="font-medium text-gray-700">{patient.email}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Address</p>
              <p className="font-medium text-gray-700 truncate">{patient.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <FileText className="text-blue-600 w-5 h-5" />
          Medical History
        </h3>

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:border-blue-200 transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      record.type === 'prescription' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${
                        record.type === 'prescription' ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {record.type}
                      </span>
                      <h4 className="font-bold text-gray-800 text-sm truncate">{record.fileName}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(record.createdAt)}
                      </p>
                    </div>
                    <a 
                      href={record.fileURL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-gray-50 p-3 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed border-2 py-10 px-6 text-center shadow-none">
            <p className="text-gray-400 text-sm">No medical records have been uploaded by the patient yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientView;
