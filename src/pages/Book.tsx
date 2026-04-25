import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Clock, Scissors, FileText, Sparkles } from 'lucide-react';
import { format, parse, addMinutes, isAfter, isBefore, set } from 'date-fns';
import toast from 'react-hot-toast';

export default function Book() {
  const { uid } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  
  const [barber, setBarber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [activeBrief, setActiveBrief] = useState<any>(null);
  const [attachBrief, setAttachBrief] = useState(false);

  useEffect(() => {
    // Check local storage for active brief
    const storedBrief = localStorage.getItem('activeBrief');
    if (storedBrief) {
      try {
        const brief = JSON.parse(storedBrief);
        setActiveBrief(brief);
        setAttachBrief(true);
      } catch (e) {
        console.error('Failed to parse brief', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchBarber = async () => {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'barbers', uid));
        if (snap.exists()) {
          setBarber(snap.data());
          if (snap.data().services?.length > 0) {
            setService(snap.data().services[0].name);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBarber();
  }, [uid]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!uid || !date) {
        setBookedSlots([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'bookings'), 
          where('barberId', '==', uid), 
          where('date', '==', date),
          where('status', 'in', ['pending', 'confirmed'])
        );
        const snap = await getDocs(q);
        const slots = snap.docs.map(doc => doc.data().time);
        setBookedSlots(slots);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    fetchBookings();
  }, [uid, date]);

  const generateTimeSlots = () => {
    if (!date || !barber?.availability) return [];
    
    // Get day of week (monday, tuesday, etc.)
    const dayOfWeek = format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE').toLowerCase() as any;
    const todayAvail = barber.availability[dayOfWeek];
    
    if (!todayAvail || todayAvail.isClosed) return [];
    
    const slots = [];
    let current = parse(todayAvail.open, 'HH:mm', new Date());
    const end = parse(todayAvail.close, 'HH:mm', new Date());
    
    // Prevent booking in the past for today
    const now = new Date();
    const isToday = date === format(now, 'yyyy-MM-dd');
    
    while (isBefore(current, end)) {
      if (!isToday || isAfter(set(new Date(), { hours: current.getHours(), minutes: current.getMinutes() }), now)) {
        slots.push(format(current, 'HH:mm'));
      }
      current = addMinutes(current, 30);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    if (!date || !time || !service) return toast.error("Please select all required options");

    try {
      setSubmitting(true);
      
      const payload: any = {
        customerId: user.uid,
        customerName: userData.name,
        barberId: uid,
        barberName: barber.name,
        date,
        time,
        service,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      if (attachBrief && activeBrief) {
        payload.haircutBrief = {
          faceShape: activeBrief.faceShape,
          recommendedStyle: activeBrief.recommendedStyle,
          styleDescription: activeBrief.styleDescription,
          note: note
        };
      } else if (note) {
         payload.haircutBrief = { note };
      }

      await addDoc(collection(db, 'bookings'), payload);

      toast.success("Booking requested successfully!");
      if (attachBrief) {
         localStorage.removeItem('activeBrief');
      }
      navigate('/my-bookings');
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-[#a0a0b0]">Loading booking details...</div>;
  if (!barber) return <div className="flex justify-center items-center h-64 text-[#a0a0b0]">Barber not found</div>;

  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Book Appointment</h1>
        <p className="text-[#a0a0b0] mt-2">with {barber.name} at {barber.shopName}</p>
      </div>

      <form onSubmit={handleBook} className="space-y-8">
        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-[#eaeaea] mb-3 flex items-center gap-2">
              <Scissors size={18} className="text-[#e94560]" /> Select Service
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barber.services?.map((s: any) => (
                <button
                  type="button"
                  key={s.name}
                  onClick={() => setService(s.name)}
                  className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
                    service === s.name ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-white/5 bg-black/20 text-[#a0a0b0] hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className={service === s.name ? 'text-white font-bold' : 'text-[#eaeaea]'}>${s.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaeaea] mb-3 flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#e94560]" /> Select Date
            </label>
            <input
              type="date"
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              value={date}
              onChange={e => { setDate(e.target.value); setTime(''); }}
              className="w-full sm:w-1/2 block px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:ring-2 focus:ring-[#e94560] transition-all text-[#eaeaea]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaeaea] mb-3 flex items-center gap-2">
              <Clock size={18} className="text-[#e94560]" /> Select Time
            </label>
            {!date ? (
              <p className="text-sm text-[#a0a0b0] bg-black/20 p-4 rounded-xl border border-white/5">Please select a date first</p>
            ) : timeSlots.length === 0 ? (
              <p className="text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">Barber goes not have any available slots on this day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {timeSlots.map(t => {
                  const isBooked = bookedSlots.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      disabled={isBooked}
                      onClick={() => setTime(t)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        isBooked ? 'border-white/5 bg-black/40 text-gray-600 cursor-not-allowed opacity-50'
                        : time === t ? 'border-[#e94560] bg-[#e94560] text-white shadow-lg' 
                        : 'border-white/10 bg-black/20 text-[#a0a0b0] hover:bg-white/5 hover:border-white/30'
                      }`}
                    >
                      {t} {isBooked && <span className="block text-[10px] mt-1">Taken</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {activeBrief && (
          <div className={`p-6 rounded-3xl border-2 transition-all ${attachBrief ? 'bg-gradient-to-br from-[#16213e] to-[#e94560]/10 border-[#e94560]/50' : 'bg-[#16213e] border-white/5'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Sparkles className={attachBrief ? "text-[#e94560]" : "text-[#a0a0b0]"} size={20} /> 
                Attach Your AI Haircut Brief
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={attachBrief} onChange={(e) => setAttachBrief(e.target.checked)} />
                <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e94560]"></div>
              </label>
            </div>
            
            <div className={`transition-all ${attachBrief ? 'opacity-100' : 'opacity-50 grayscale'}`}>
              <div className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="flex-1">
                  <div className="inline-flex items-center px-2 py-1 rounded border border-[#e94560]/30 bg-[#e94560]/10 text-xs font-bold text-[#e94560] uppercase tracking-wider mb-2">
                    ✦ {activeBrief.faceShape} Face
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">{activeBrief.recommendedStyle}</h3>
                  <p className="text-sm text-[#a0a0b0] line-clamp-2">{activeBrief.styleDescription}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#16213e] p-6 sm:p-8 rounded-3xl border border-white/5">
          <label className="block text-sm font-medium text-[#eaeaea] mb-3 flex items-center gap-2">
            <FileText size={18} className="text-[#e94560]" /> Add a Note (Optional)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={attachBrief ? "Any additional notes for the barber alongside the AI brief..." : "Any specific requests or details for the barber..."}
            className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all sm:text-sm text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !date || !time || !service}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.2)] text-lg font-bold text-white bg-[#e94560] hover:bg-[#ff5c77] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e94560] disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1"
        >
          {submitting ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
