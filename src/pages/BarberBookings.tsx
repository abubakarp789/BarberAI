import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Scissors, Calendar, Check, X, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function BarberBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'bookings'), where('barberId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      data.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
      
      setBookings(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      toast.success(`Booking ${status}`);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
      setSelectedBooking(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20"
    };
    return (
      <span className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", styles[status])}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">Bookings</h1>
          <p className="text-[#a0a0b0] mt-2">Manage your appointments and requests.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-none">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap",
                filter === f ? "bg-[#e94560] text-white" : "bg-black/20 text-[#a0a0b0] hover:bg-black/40 border border-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10"></div>
                <div>
                  <div className="h-5 bg-white/5 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-24"></div>
                </div>
              </div>
              <div className="w-20 h-6 bg-white/5 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#16213e] p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
          <div className="text-7xl mb-6">📅</div>
          <h3 className="text-2xl font-bold mb-2 text-[#eaeaea]">No bookings found</h3>
          <p className="text-[#a0a0b0]">No bookings match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-[#16213e] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/10 transition-colors cursor-pointer" onClick={() => setSelectedBooking(booking)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center border border-white/5">
                  <span className="font-bold text-lg">{booking.customerName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    {booking.customerName}
                    {booking.haircutBrief && <Scissors className="text-[#e94560]" size={14} />}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-[#a0a0b0]">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {booking.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {booking.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 justify-between sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
                <div className="text-right hidden sm:block">
                  <div className="font-medium text-[#eaeaea]">{booking.service}</div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#16213e] rounded-3xl border border-white/10 w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedBooking.customerName}</h2>
                <div className="text-[#a0a0b0] text-sm flex gap-3">
                  <span>{selectedBooking.date}</span>
                  <span>{selectedBooking.time}</span>
                </div>
              </div>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div className="space-y-6">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs uppercase tracking-wider text-[#a0a0b0] font-bold mb-1">Service Requested</h4>
                <p className="font-medium text-lg">{selectedBooking.service}</p>
              </div>

              {selectedBooking.haircutBrief && selectedBooking.haircutBrief.recommendedStyle && (
                <div className="bg-gradient-to-br from-[#e94560]/10 to-purple-500/10 p-5 rounded-2xl border border-[#e94560]/50 relative overflow-hidden shadow-[0_0_15px_rgba(233,69,96,0.1)]">
                  <div className="absolute top-0 right-0 p-3 opacity-10"><Scissors size={64} /></div>
                  <h4 className="flex items-center gap-2 font-bold mb-4 text-[#e94560]">
                    <Sparkles size={18} /> Haircut Brief
                  </h4>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30 rounded text-xs font-bold uppercase tracking-wider mb-2">
                        ✦ {selectedBooking.haircutBrief.faceShape} Face Shape
                      </span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#a0a0b0] block mb-1">Recommended Style</span>
                      <p className="font-bold text-lg text-white">{selectedBooking.haircutBrief.recommendedStyle}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#a0a0b0] block mb-1">Description</span>
                      <p className="text-sm text-[#eaeaea] leading-relaxed">{selectedBooking.haircutBrief.styleDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.haircutBrief?.note && (
                <div className="flex gap-3 bg-black/40 p-5 rounded-2xl border border-white/10">
                  <MessageSquare size={20} className="text-[#a0a0b0] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[#a0a0b0] font-bold mb-2">Customer Note</h4>
                    <p className="text-sm text-[#eaeaea] leading-relaxed italic border-l-2 border-white/20 pl-3">"{selectedBooking.haircutBrief.note}"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              {selectedBooking.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(selectedBooking.id, 'confirmed')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                    <Check size={18} /> Confirm
                  </button>
                  <button onClick={() => updateStatus(selectedBooking.id, 'cancelled')} className="flex-1 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-white/10">
                    <X size={18} /> Decline
                  </button>
                </>
              )}
              
              {selectedBooking.status === 'confirmed' && (
                <>
                  <button onClick={() => updateStatus(selectedBooking.id, 'completed')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                    <Check size={18} /> Mark Completed
                  </button>
                  <button onClick={() => updateStatus(selectedBooking.id, 'cancelled')} className="flex-1 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-white/10">
                    <X size={18} /> Cancel
                  </button>
                </>
              )}
              
              <button onClick={() => setSelectedBooking(null)} className="w-full mt-2 text-sm text-[#a0a0b0] hover:text-white py-2 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
