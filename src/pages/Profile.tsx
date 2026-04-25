import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, userData } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), { name });
      toast.success("Profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userData) return <div className="text-white">Loading...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">My Profile</h1>
        <p className="text-[#a0a0b0] mt-2">Manage your account information.</p>
      </div>

      <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-4">
              {userData.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaeaea] mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-[#e94560] transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaeaea] mb-1">Email <span className="text-[#a0a0b0] text-xs">(cannot be changed)</span></label>
            <input 
              type="email" 
              disabled 
              value={userData.email || ''} 
              className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/40 text-[#a0a0b0] cursor-not-allowed" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || name === userData.name} 
            className="w-full bg-[#e94560] hover:bg-[#ff5c77] text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(233,69,96,0.3)] hover:-translate-y-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
