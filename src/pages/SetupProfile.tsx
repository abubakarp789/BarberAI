import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Camera, Clock, MapPin, Plus, Scissors, Store, Trash2 } from 'lucide-react';
import { fileToCompressedJpegDataUrl } from '../lib/imageUpload';

export default function SetupProfile() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [services, setServices] = useState<{name: string, price: number}[]>([{ name: 'Standard Haircut', price: 30 }]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const initialAvailability = {
    monday: { open: '09:00', close: '18:00', isClosed: false },
    tuesday: { open: '09:00', close: '18:00', isClosed: false },
    wednesday: { open: '09:00', close: '18:00', isClosed: false },
    thursday: { open: '09:00', close: '18:00', isClosed: false },
    friday: { open: '09:00', close: '18:00', isClosed: false },
    saturday: { open: '10:00', close: '16:00', isClosed: false },
    sunday: { open: '00:00', close: '00:00', isClosed: true },
  };
  const [availability, setAvailability] = useState(initialAvailability);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const ref = doc(db, 'barbers', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setShopName(data.shopName || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setServices(data.services || [{ name: 'Standard Haircut', price: 30 }]);
        setPortfolioImages(data.portfolioImages || []);
        setAvailability((data.availability as typeof initialAvailability) || initialAvailability);
        setProfileImageUrl(data.profileImageUrl || null);
        setCoverImageUrl(data.coverImageUrl || null);
        setRating(data.rating || 0);
        setTotalReviews(data.totalReviews || 0);
        setIsActive(typeof data.isActive === 'boolean' ? data.isActive : true);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImagePick = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void,
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageDataUrl = await fileToCompressedJpegDataUrl(file);
      setter(imageDataUrl);
      toast.success(`${label} updated`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to update ${label.toLowerCase()}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    if (!shopName || !location || !bio) return toast.error('Please fill required fields');
    if (services.length === 0) return toast.error('Add at least one service');
    if (services.some(s => !s.name || s.price <= 0)) return toast.error('Valid services are required');

    try {
      setLoading(true);
      await setDoc(doc(db, 'barbers', user.uid), {
        uid: user.uid,
        name: userData.name,
        shopName,
        location,
        bio,
        services,
        portfolioImages,
        availability,
        rating,
        totalReviews,
        isActive,
        profileImageUrl,
        coverImageUrl,
      }, { merge: true });

      toast.success('Profile saved successfully');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => setServices([...services, { name: '', price: 0 }]);
  const removeService = (index: number) => setServices(services.filter((_, i) => i !== index));
  const updateService = (index: number, key: 'name' | 'price', value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [key]: key === 'price' ? Number(value) : value };
    setServices(newServices);
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (shopName.trim() !== '') score += 15;
    if (location.trim() !== '') score += 15;
    if (bio.trim() !== '') score += 15;
    if (services.length > 0 && services.some(s => s.name.trim() !== '' && s.price > 0)) score += 20;
    if (Object.values(availability).some((day: any) => !day.isClosed)) score += 15;
    if (portfolioImages.length > 0) score += 10;
    if (profileImageUrl) score += 5;
    if (coverImageUrl) score += 5;
    return score;
  };
  const completeness = calculateCompleteness();

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Barber Profile</h1>
        <p className="text-[#a0a0b0] mt-2">Configure how customers see you and when they can book.</p>
      </div>

      <div className="bg-[#16213e] p-6 rounded-3xl border border-white/5 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#eaeaea]">Profile Completeness</span>
          <span className="text-sm font-bold text-[#e94560]">{completeness}%</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-[#e94560] to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${completeness}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Store size={20} className="text-[#e94560]" /> Profile Images</h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#eaeaea] mb-3">Cover Image</p>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="group relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-black/50 flex items-center justify-center"
              >
                {coverImageUrl ? (
                  <>
                    <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2">
                      <Camera size={18} /> Change cover image
                    </div>
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-[#a0a0b0]">
                    <Camera size={18} /> Upload cover image
                  </span>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImagePick(e, setCoverImageUrl, 'Cover image')}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-[#eaeaea] mb-3">Profile Image</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-3xl font-bold text-white"
                >
                  {profileImageUrl ? (
                    <>
                      <img src={profileImageUrl} alt={userData?.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} />
                      </div>
                    </>
                  ) : (
                    userData?.name?.charAt(0).toUpperCase()
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                >
                  {profileImageUrl ? 'Change profile image' : 'Upload profile image'}
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImagePick(e, setProfileImageUrl, 'Profile image')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Store size={20} className="text-[#e94560]" /> Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Shop/Studio Name</label>
              <input type="text" required value={shopName} onChange={e => setShopName(e.target.value)} className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm" placeholder="The Premium Cut" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-[#a0a0b0]" />
                </div>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm" placeholder="123 Main St, City" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#eaeaea] mb-1">Bio</label>
              <textarea required value={bio} onChange={e => setBio(e.target.value)} rows={3} className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm" placeholder="Tell customers about your experience and style..." />
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Scissors size={20} className="text-[#e94560]" /> Services</h2>
            <button type="button" onClick={addService} className="text-sm font-medium text-[#e94560] hover:text-[#ff5c77] flex items-center gap-1">
              <Plus size={16} /> Add Service
            </button>
          </div>
          <div className="space-y-3">
            {services.map((service, index) => (
              <div key={index} className="flex items-center gap-3">
                <input type="text" required value={service.name} onChange={e => updateService(index, 'name', e.target.value)} placeholder="Service Name" className="flex-1 block px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:ring-2 focus:ring-[#e94560] sm:text-sm" />
                <div className="relative w-32">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#a0a0b0]">$</span>
                  <input type="number" min="1" required value={service.price || ''} onChange={e => updateService(index, 'price', e.target.value)} className="block w-full pl-8 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 focus:ring-2 focus:ring-[#e94560] sm:text-sm" />
                </div>
                {services.length > 1 && (
                  <button type="button" onClick={() => removeService(index)} className="p-3 text-[#a0a0b0] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock size={20} className="text-[#e94560]" /> Availability</h2>
          <div className="space-y-4">
            {(Object.keys(availability) as Array<keyof typeof initialAvailability>).map((day) => (
              <div key={day} className="flex sm:items-center flex-col sm:flex-row gap-3 p-3 rounded-xl border border-white/5 bg-black/10">
                <div className="w-32 flex items-center justify-between sm:justify-start gap-2">
                  <span className="capitalize font-medium block">{day}</span>
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox" className="sr-only" checked={!availability[day].isClosed} onChange={(e) => setAvailability(prev => ({ ...prev, [day]: { ...prev[day], isClosed: !e.target.checked } }))} />
                    <div className={`w-10 h-6 bg-black/40 rounded-full transition-colors ${!availability[day].isClosed ? 'bg-[#e94560]' : ''}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!availability[day].isClosed ? 'translate-x-4' : ''}`}></div>
                  </label>
                </div>
                {!availability[day].isClosed ? (
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <input type="time" value={availability[day].open} onChange={(e) => setAvailability(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm flex-1 sm:flex-none" />
                    <span className="text-[#a0a0b0]">to</span>
                    <input type="time" value={availability[day].close} onChange={(e) => setAvailability(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm flex-1 sm:flex-none" />
                  </div>
                ) : (
                  <div className="text-sm text-[#a0a0b0] italic mt-2 sm:mt-0">Closed</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 bg-[#e94560] hover:bg-[#ff5c77] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(233,69,96,0.3)] hover:-translate-y-1">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
