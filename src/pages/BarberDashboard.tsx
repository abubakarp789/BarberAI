import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function BarberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    rating: 0
  });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch all bookings for stats
        const qBookings = query(collection(db, 'bookings'), where('barberId', '==', user.uid));
        const snap = await getDocs(qBookings);
        
        let pending = 0, completed = 0, cancelled = 0;
        const today: any[] = [];
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'pending') pending++;
          else if (data.status === 'completed') completed++;
          else if (data.status === 'cancelled') cancelled++;
          
          if (data.date === todayStr && data.status !== 'cancelled') {
            today.push({ id: doc.id, ...data });
          }
        });
        
        // Sort today bookings by time
        today.sort((a, b) => a.time.localeCompare(b.time));

        // Fetch barber profile for rating
        const qBarber = query(collection(db, 'barbers'), where('uid', '==', user.uid));
        const barberSnap = await getDocs(qBarber);
        let rating = 0;
        if (!barberSnap.empty) {
          rating = barberSnap.docs[0].data().rating || 0;
        }

        setStats({
          total: snap.size,
          pending,
          completed,
          cancelled,
          rating
        });
        setTodayBookings(today);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Dashboard</h1>
        <p className="text-[#a0a0b0] mt-2">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#a0a0b0] mb-2">
            <CalendarIcon size={18} /> <span className="text-sm font-medium uppercase tracking-wider">Total</span>
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <Clock size={18} /> <span className="text-sm font-medium uppercase tracking-wider text-[#a0a0b0]">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pending}</div>
        </div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle2 size={18} /> <span className="text-sm font-medium uppercase tracking-wider text-[#a0a0b0]">Completed</span>
          </div>
          <div className="text-3xl font-bold">{stats.completed}</div>
        </div>
        <div className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#e94560] mb-2">
            <Star size={18} /> <span className="text-sm font-medium uppercase tracking-wider text-[#a0a0b0]">Rating</span>
          </div>
          <div className="text-3xl font-bold">{stats.rating.toFixed(1)}</div>
        </div>
      </div>

      <div className="bg-[#16213e] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a2e]/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-[#e94560]" size={20} /> Today's Schedule
          </h2>
          <Link to="/barber-bookings" className="text-sm text-[#e94560] hover:text-[#ff5c77] font-medium">View All</Link>
        </div>
        
        <div className="p-6">
          {todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon size={48} className="mx-auto text-[#a0a0b0] opacity-50 mb-3" />
              <p className="text-[#a0a0b0]">No bookings scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map(booking => (
                <div key={booking.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#e94560]/10 p-3 rounded-xl min-w-[70px] text-center border border-[#e94560]/20">
                      <div className="text-sm text-[#a0a0b0] uppercase text-[10px] tracking-wider mb-1">Time</div>
                      <div className="font-bold text-[#e94560]">{booking.time}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">{booking.customerName}</h4>
                      <p className="text-sm text-[#a0a0b0]">{booking.service}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                      booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>
                      {booking.status}
                    </span>
                    <Link to="/barber-bookings" className="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors border border-white/5">
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
