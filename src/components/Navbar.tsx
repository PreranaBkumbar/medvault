import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 transition-transform hover:scale-105 active:scale-95">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter text-gray-900">MedVault</span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            {profile?.onboarded && (
              <>
                <div className="hidden md:flex items-center gap-4 mr-4 border-r border-gray-100 pr-4">
                  {profile.role === 'patient' ? (
                    <>
                      <Link to="/patient/dashboard" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Home</Link>
                      <Link to="/patient/timeline" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Timeline</Link>
                      <Link to="/patient/upload" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Upload</Link>
                    </>
                  ) : (
                    <Link to="/doctor/dashboard" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Dashboard</Link>
                  )}
                </div>
                
                <div className="hidden sm:flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px] uppercase">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 leading-none mb-0.5">{profile.role}</p>
                    <p className="text-xs font-bold text-gray-900 leading-none">{profile.name.split(' ')[0]}</p>
                  </div>
                </div>
              </>
            )}
            <button 
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
