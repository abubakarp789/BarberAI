import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { fileToCompressedJpegDataUrl } from '../lib/imageUpload';

export default function Profile() {
  const { user, userData, refreshUserData } = useAuth();
  const [name, setName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setProfileImageUrl(userData.profileImageUrl || null);
    }
  }, [userData]);

  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const nextProfileImageUrl = await fileToCompressedJpegDataUrl(file);
      await updateDoc(doc(db, 'users', user.uid), { profileImageUrl: nextProfileImageUrl });
      setProfileImageUrl(nextProfileImageUrl);
      await refreshUserData();
      toast.success('Profile photo updated');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to update profile photo');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), { name, profileImageUrl });
      await refreshUserData();
      toast.success('Profile updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userData) return <div className="text-white">Loading...</div>;

  const hasChanges = name !== userData.name || profileImageUrl !== (userData.profileImageUrl || null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">My Profile</h1>
        <p className="text-[#a0a0b0] mt-2">Manage your account information.</p>
      </div>

      <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-4xl font-bold text-white"
              >
                {profileImageUrl ? (
                  <>
                    <img src={profileImageUrl} alt={userData.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} />
                    </div>
                  </>
                ) : (
                  <>
                    {userData.name?.charAt(0).toUpperCase()}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfileImageChange}
              />
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
            disabled={loading || !hasChanges}
            className="w-full bg-[#e94560] hover:bg-[#ff5c77] text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(233,69,96,0.3)] hover:-translate-y-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
