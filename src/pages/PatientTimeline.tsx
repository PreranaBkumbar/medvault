import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { MedicalRecord } from '../types';
import { Card, CardContent } from '../components/DashboardCard';
import { 
  ChevronLeft, 
  FileText, 
  ExternalLink, 
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

const PatientTimeline: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'records'),
          where('patientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MedicalRecord[];
        setRecords(data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Medical Timeline</h1>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search records..."
            className="w-full pl-9 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-gray-500">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Fetching secure history...</p>
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-4">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:bg-gray-50 cursor-pointer border-gray-100 transition-all hover:shadow-md">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm ${
                    record.type === 'prescription' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">
                      {record.type} Report
                    </h4>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight truncate pr-4">{record.fileName}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400">{formatDate(record.createdAt)}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-300">|</span>
                      <span className="text-xs font-bold text-blue-600/50">Verified Link</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href={record.fileURL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gray-100 inline-block p-6 rounded-full mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No records found</h3>
          <p className="text-gray-500 mt-2">Upload your first prescription or report to start your timeline.</p>
          <button 
            onClick={() => navigate('/patient/upload')}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
          >
            Upload Now
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientTimeline;
