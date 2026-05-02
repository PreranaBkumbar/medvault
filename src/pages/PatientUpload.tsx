import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useAuth } from '../App';
import { Card, CardHeader, CardTitle, CardContent } from '../components/DashboardCard';
import { Upload, FileText, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PatientUpload: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'prescription' | 'report'>('prescription');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Upload to Storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `records/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(storageRef);

      // 2. Save to Firestore
      await addDoc(collection(db, 'records'), {
        patientId: user.uid,
        fileURL,
        fileName: file.name,
        type,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/patient/timeline');
      }, 2000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upload Record</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpload} className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all ${
                  file ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                
                {file ? (
                  <div className="text-center">
                    <div className="bg-blue-600 text-white p-4 rounded-2xl inline-block mb-3 shadow-lg">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-gray-900 block truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-gray-100 text-gray-400 p-4 rounded-2xl inline-block mb-3">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-gray-900">Tap to Select File</p>
                    <p className="text-xs text-gray-500 mt-1">PDF or Images (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Record Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('prescription')}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      type === 'prescription' ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100' : 'border-gray-100 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('report')}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      type === 'report' ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100' : 'border-gray-100 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Medical Report
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex gap-3 items-center"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!file || loading || success}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  success 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none'
                }`}
              >
                {loading ? 'Uploading...' : success ? <><CheckCircle2 className="w-6 h-6" /> Uploaded!</> : 'Confirm Upload'}
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="text-center">
         <p className="text-gray-400 text-xs">All records are stored securely with end-to-end encryption principles in Firebase storage.</p>
      </div>
    </div>
  );
};

export default PatientUpload;
