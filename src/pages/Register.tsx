import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Scissors, User as UserIcon, Settings, Mail, Lock } from 'lucide-react';
import clsx from 'clsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'barber'>('customer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userData, refreshUserData } = useAuth();

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      
      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          role,
          createdAt: serverTimestamp(),
          profileImageUrl: user.photoURL || null
        });
      }
      
      await refreshUserData(user);
      toast.success('Welcome!');
      
      setTimeout(() => {
        if (role === 'barber' || userDoc.data()?.role === 'barber' || userData?.role === 'barber') {
          navigate('/setup-profile');
        } else {
          navigate('/explore');
        }
      }, 500);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Google Sign-In is not enabled in Firebase Console.', { duration: 5000 });
      } else {
        toast.error(error.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: serverTimestamp(),
        profileImageUrl: null
      });

      await refreshUserData(user);
      
      toast.success('Registration successful!');
      if (role === 'barber') {
        navigate('/setup-profile');
      } else {
        navigate('/explore');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email registration is not enabled. Please sign up with Google or enable Email/Password provider in the Firebase Console.', { duration: 5000 });
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-[#16213e] rounded-3xl p-8 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#e94560] to-purple-500"></div>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#e94560]/10 rounded-2xl flex items-center justify-center mb-4">
            <Scissors className="text-[#e94560]" size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create an Account</h2>
          <p className="text-[#a0a0b0] mt-2">Join BarberAI to {role === 'barber' ? 'manage your business' : 'find the perfect cut'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={clsx(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                role === 'customer' 
                  ? "border-[#e94560] bg-[#e94560]/10 text-white" 
                  : "border-white/10 bg-black/20 text-[#a0a0b0] hover:bg-white/5"
              )}
            >
              <UserIcon size={24} className={role === 'customer' ? "text-[#e94560]" : "opacity-70"} />
              <span className="font-medium text-sm">Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('barber')}
              className={clsx(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                role === 'barber' 
                  ? "border-[#e94560] bg-[#e94560]/10 text-white" 
                  : "border-white/10 bg-black/20 text-[#a0a0b0] hover:bg-white/5"
              )}
            >
              <Settings size={24} className={role === 'barber' ? "text-[#e94560]" : "opacity-70"} />
              <span className="font-medium text-sm">Barber</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#a0a0b0]" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#a0a0b0]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#a0a0b0]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#e94560] hover:bg-[#ff5c77] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#16213e] focus:ring-[#e94560] disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#16213e] text-[#a0a0b0]">Or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-white/10 rounded-xl shadow-sm text-sm font-bold text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#16213e] focus:ring-white/20 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-[#a0a0b0]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#e94560] hover:text-[#ff5c77] transition-colors">
            Login instead
          </Link>
        </p>
      </div>
    </div>
  );
}
