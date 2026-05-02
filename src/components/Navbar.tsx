import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, Menu, X, Activity, Box, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isLoginPage = location.pathname === '/login';
  if (isLoginPage && !user) return null;

  const navLinks = profile?.role === 'patient' 
    ? [
        { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'Timeline', path: '/patient/timeline', icon: Activity },
        { name: 'Upload', path: '/patient/upload', icon: Box },
      ]
    : [
        { name: 'Portal', path: '/doctor/dashboard', icon: Activity },
      ];

  return (
    <nav className="sticky top-0 z-[80] bg-white/70 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-slate-200">
                <Shield className="w-6 h-6 text-blue-500 group-hover:text-emerald-500 transition-colors" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">MedVault</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && profile?.onboarded && (
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                      location.pathname === link.path ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="h-6 w-px bg-slate-100" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase">
                    {profile?.name?.[0]}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {profile?.name?.split(' ')[0]}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all hover:scale-110"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-50 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-slate-900"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                    <link.icon className="w-5 h-5" />
                  </div>
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 text-sm font-black uppercase tracking-widest text-rose-600"
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  Logout Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
