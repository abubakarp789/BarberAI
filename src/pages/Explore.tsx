import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, MapPin, Scissors } from 'lucide-react';
import clsx from 'clsx';

export default function Explore() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const q = query(collection(db, 'barbers'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarbers(data);
      } catch (error) {
        console.error("Error fetching barbers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBarbers();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Discover Barbers</h1>
        <p className="text-[#a0a0b0] mt-2">Find the best local professionals for your next cut.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="group bg-[#16213e] rounded-3xl border border-white/5 overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/5 relative"></div>
              <div className="p-5">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/4"></div>
                  <div className="h-4 bg-white/5 rounded w-full"></div>
                  <div className="h-4 bg-white/5 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <div className="bg-[#16213e] p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
          <div className="text-7xl mb-6">💈</div>
          <h3 className="text-2xl font-bold mb-2 text-[#eaeaea]">No barbers found</h3>
          <p className="text-[#a0a0b0]">Check back later as more professionals join our platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map(barber => (
            <Link key={barber.id} to={`/barber/${barber.id}`} className="group bg-[#16213e] rounded-3xl border border-white/5 overflow-hidden hover:border-[#e94560]/50 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="aspect-video bg-black/50 relative overflow-hidden">
                {barber.coverImageUrl ? (
                  <img src={barber.coverImageUrl} alt={barber.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : barber.portfolioImages && barber.portfolioImages.length > 0 ? (
                  <img src={barber.portfolioImages[0]} alt={barber.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors size={48} className="text-[#a0a0b0] opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16213e] to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-3">
                  <div className="flex items-end gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-white font-bold shrink-0 border border-white/10">
                      {barber.profileImageUrl ? (
                        <img src={barber.profileImageUrl} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        barber.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white leading-tight">{barber.name}</h3>
                    <p className="text-sm font-medium text-[#c0c0d0]">{barber.shopName}</p>
                  </div>
                  </div>
                  <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-[#f0a500]">
                    <Star size={14} className="fill-current" />
                    {barber.rating ? barber.rating.toFixed(1) : 'New'}
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-start gap-2 text-sm text-[#a0a0b0] mb-4">
                  <MapPin size={16} className="text-[#e94560] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{barber.location}</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider">Top Services</p>
                  {barber.services?.slice(0, 2).map((service: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                      <span className="truncate pr-4 text-[#eaeaea]">{service.name}</span>
                      <span className="font-medium text-[#e94560] whitespace-nowrap">${service.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
