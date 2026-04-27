import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Camera, Clock, Eye, MapPin, Scissors, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { fileToCompressedJpegDataUrl } from '../lib/imageUpload';
import toast from 'react-hot-toast';

export default function BarberProfileView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barber, setBarber] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBarber = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'barbers', user.uid));
        if (snap.exists()) {
          setBarber(snap.data());

          const qReviews = query(collection(db, 'reviews'), where('barberId', '==', user.uid));
          const reviewSnap = await getDocs(qReviews);
          setReviews(reviewSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBarber();
  }, [user]);

  const handleHeaderImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    field: 'profileImageUrl' | 'coverImageUrl',
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const imageDataUrl = await fileToCompressedJpegDataUrl(file);
      await updateDoc(doc(db, 'barbers', user.uid), { [field]: imageDataUrl });
      setBarber((current: any) => current ? { ...current, [field]: imageDataUrl } : current);
      toast.success(`${label} updated`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to update ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-12 animate-pulse">
        <div className="h-6 w-24 bg-white/5 rounded mb-6"></div>
        <div className="bg-[#16213e] rounded-3xl border border-white/5 overflow-hidden mb-8">
          <div className="h-48 md:h-64 bg-white/5"></div>
          <div className="px-6 md:px-10 pb-8 relative -mt-16">
            <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
              <div className="w-32 h-32 rounded-2xl bg-white/10 mb-4 border-4 border-[#16213e]"></div>
              <div className="flex-1 w-full mt-4 md:mt-0">
                <div className="h-8 md:h-10 w-48 bg-white/5 rounded mb-2"></div>
                <div className="h-6 w-32 bg-white/5 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-[#a0a0b0]">
        <div className="text-7xl mb-6">💈</div>
        <h3 className="text-2xl font-bold mb-2 text-[#eaeaea]">Profile not set up yet</h3>
        <p className="text-[#a0a0b0] mb-6">Complete your barber profile to see how customers view it.</p>
        <Link
          to="/setup-profile"
          className="bg-[#e94560] hover:bg-[#ff5c77] text-white px-6 py-3 rounded-xl font-bold transition-all"
        >
          Setup Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#a0a0b0] hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e94560]/10 border border-[#e94560]/20 rounded-full text-sm font-medium text-[#e94560]">
          <Eye size={14} /> Customer Preview
        </div>
      </div>

      <div className="bg-[#16213e] rounded-3xl border border-white/5 overflow-hidden mb-8">
        <div className="h-48 md:h-64 bg-gradient-to-br from-[#1a1a2e] to-black/50 relative group">
          {barber.coverImageUrl ? (
            <img src={barber.coverImageUrl} className="w-full h-full object-cover opacity-70" alt="Cover" />
          ) : barber.portfolioImages && barber.portfolioImages.length > 0 ? (
            <img src={barber.portfolioImages[0]} className="w-full h-full object-cover opacity-50" alt="Cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16213e] to-transparent"></div>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-sm font-medium backdrop-blur hover:bg-black/60 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Camera size={16} /> {barber.coverImageUrl ? 'Change Cover' : 'Upload Cover'}
            </span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleHeaderImageChange(e, 'coverImageUrl', 'Cover image')}
          />
        </div>

        <div className="px-6 md:px-10 pb-8 relative -mt-16">
          <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                disabled={uploading}
                className="group relative w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-[#16213e] shadow-xl mb-4"
              >
                {barber.profileImageUrl ? (
                  <>
                    <img src={barber.profileImageUrl} alt={barber.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={22} />
                    </div>
                  </>
                ) : (
                  barber.name?.charAt(0).toUpperCase()
                )}
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleHeaderImageChange(e, 'profileImageUrl', 'Profile image')}
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">{barber.name}</h1>
              <p className="text-xl text-[#a0a0b0] font-medium">{barber.shopName}</p>
            </div>

            <div className="flex flex-col md:items-end gap-4 mt-4 md:mt-0">
              <div className="flex gap-4">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center px-6">
                  <div className="text-2xl font-bold text-[#f0a500] flex justify-center items-center gap-1">
                    <Star size={20} className="fill-current" /> {barber.rating ? barber.rating.toFixed(1) : 'New'}
                  </div>
                  <div className="text-xs text-[#a0a0b0] uppercase tracking-wider">{barber.totalReviews || 0} Reviews</div>
                </div>
              </div>
              <Link to="/setup-profile" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-center transition-all">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin size={20} className="text-[#e94560]" /> About & Location</h2>
            <p className="text-[#c0c0d0] leading-relaxed mb-6">{barber.bio}</p>
            <div className="bg-black/20 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
              <MapPin className="text-[#a0a0b0]" size={20} />
              <span className="text-[#eaeaea] font-medium">{barber.location}</span>
            </div>
          </div>

          <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Scissors size={20} className="text-[#e94560]" /> Services</h2>
            <div className="space-y-3">
              {barber.services?.map((service: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                  <span className="font-medium text-[#eaeaea]">{service.name}</span>
                  <span className="font-bold text-[#e94560]">${service.price}</span>
                </div>
              ))}
              {(!barber.services || barber.services.length === 0) && (
                <p className="text-[#a0a0b0] text-sm italic">No services added yet.</p>
              )}
            </div>
          </div>

          {barber.portfolioImages && barber.portfolioImages.length > 0 && (
            <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">📸 Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {barber.portfolioImages.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-black/20">
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Star size={20} className="text-[#e94560]" /> Reviews</h2>
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-1 text-[#f0a500]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < review.rating ? 'fill-current' : 'text-white/10'} />
                        ))}
                      </div>
                      <span className="text-xs text-[#a0a0b0]">
                        {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'MMM d, yyyy') : ''}
                      </span>
                    </div>
                    {review.comment && <p className="text-[#c0c0d0]">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5 sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock size={20} className="text-[#e94560]" /> Opening Hours</h2>
            <div className="space-y-3">
              {barber.availability && (Object.keys(barber.availability) as Array<keyof typeof barber.availability>).map(day => (
                <div key={day} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                  <span className="capitalize text-[#a0a0b0]">{day}</span>
                  {(barber.availability[day] as any).isClosed ? (
                    <span className="text-[#e94560] font-medium italic">Closed</span>
                  ) : (
                    <span className="text-[#eaeaea] font-medium">{(barber.availability[day] as any).open} - {(barber.availability[day] as any).close}</span>
                  )}
                </div>
              ))}
              {!barber.availability && (
                <p className="text-[#a0a0b0] text-sm italic">Availability not set yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
