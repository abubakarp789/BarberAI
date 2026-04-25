import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Scissors, X, Star } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming or past

  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'bookings'), where('customerId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      data.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Past nearest first
      });
      // Actually ascending for upcoming, descending for past? Let's keep it simple
      data.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return filter === 'upcoming' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
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
  }, [user, filter]);

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
      toast.success("Booking cancelled");
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      console.error(error);
      toast.error('Failed to cancel booking');
    }
  };

  const openReviewModal = (booking: any) => {
    setSelectedBookingForReview(booking);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBookingForReview) return;
    
    try {
      setSubmittingReview(true);
      
      // 1. Create review doc
      await addDoc(collection(db, 'reviews'), {
        bookingId: selectedBookingForReview.id,
        customerId: user.uid,
        barberId: selectedBookingForReview.barberId,
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      // 2. Fetch current barber to update rating
      const barberRef = doc(db, 'barbers', selectedBookingForReview.barberId);
      const barberSnap = await getDoc(barberRef);
      if (barberSnap.exists()) {
        const bd = barberSnap.data();
        const oldTotal = bd.totalReviews || 0;
        const oldRating = bd.rating || 0;
        const newTotal = oldTotal + 1;
        const newRating = ((oldRating * oldTotal) + rating) / newTotal;
        
        await updateDoc(barberRef, {
          rating: newRating,
          totalReviews: newTotal
        });
      }

      toast.success("Review submitted!");
      setReviewModalOpen(false);
    } catch (error) {
      console.error('Review submission error', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const now = new Date();
  
  const filteredBookings = bookings.filter(b => {
    const isPast = new Date(`${b.date}T${b.time}`) < now;
    if (filter === 'upcoming') {
      return !isPast && b.status !== 'cancelled';
    } else {
      return isPast || b.status === 'cancelled';
    }
  });

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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#eaeaea]">My Bookings</h1>
          <p className="text-[#a0a0b0] mt-2">Manage your upcoming appointments and history.</p>
        </div>
        
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilter('upcoming')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === 'upcoming' ? "bg-[#16213e] text-white shadow" : "text-[#a0a0b0] hover:text-white"
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === 'past' ? "bg-[#16213e] text-white shadow" : "text-[#a0a0b0] hover:text-white"
            )}
          >
            Past / Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#16213e] p-5 sm:p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6 animate-pulse">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-[80px] h-[80px] bg-white/5 rounded-2xl"></div>
                <div className="pt-1 flex-1">
                  <div className="h-6 bg-white/5 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-white/5 rounded w-1/4"></div>
                </div>
              </div>
              <div className="w-24 h-8 bg-white/5 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#16213e] p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
          <div className="text-7xl mb-6">✂️</div>
          <h3 className="text-2xl font-bold mb-2 text-[#eaeaea]">No {filter} bookings yet</h3>
          <p className="text-[#a0a0b0] mb-8">Ready for a fresh cut? Find the perfect barber for your next style.</p>
          {filter === 'upcoming' && (
            <Link to="/explore" className="inline-block bg-[#e94560] hover:bg-[#ff5c77] shadow-[0_0_15px_rgba(233,69,96,0.2)] text-white px-8 py-3.5 rounded-xl font-bold transition-all transform hover:-translate-y-1">
              Find a Barber
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-[#16213e] p-5 sm:p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
              
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-black p-4 rounded-2xl border border-white/5 text-center min-w-[80px]">
                  <div className="text-xs uppercase text-[#a0a0b0] font-bold tracking-wider mb-1">
                    {format(new Date(booking.date), 'MMM')}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {format(new Date(booking.date), 'd')}
                  </div>
                </div>
                
                <div className="pt-1">
                  <h3 className="font-bold text-xl text-white mb-2">
                    <Link to={`/barber/${booking.barberId}`} className="hover:text-[#e94560] transition-colors">{booking.barberName}</Link>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-[#a0a0b0]">
                    <div className="flex items-center gap-2">
                      <Scissors size={14} className="text-[#e94560]" /> {booking.service}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#e94560]" /> {booking.time}
                    </div>
                  </div>
                  {booking.haircutBrief && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-[#e94560]/10 text-[#e94560] rounded-md text-xs font-bold border border-[#e94560]/20">
                      <Star size={12} className="fill-current" /> Included AI Style Brief
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 md:min-w-[120px]">
                <StatusBadge status={booking.status} />
                
                {filter === 'upcoming' && booking.status !== 'cancelled' && (
                  <button 
                    onClick={() => cancelBooking(booking.id)}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 mt-2"
                  >
                    <X size={14} /> Cancel
                  </button>
                )}

                {booking.status === 'completed' && (
                  <button onClick={() => openReviewModal(booking)} className="text-sm text-[#f0a500] hover:text-[#ffb700] font-bold flex items-center gap-1 border border-[#f0a500]/20 bg-[#f0a500]/10 px-3 py-1.5 rounded-lg mt-2 transition-all">
                    <Star size={14} className="fill-current" /> Leave Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#16213e] rounded-3xl sm:max-w-md w-full border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Leave a Review</h2>
                <button onClick={() => setReviewModalOpen(false)} className="text-[#a0a0b0] hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#eaeaea] mb-3 text-center">How was your haircut with {selectedBookingForReview?.barberName}?</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 transition-all hover:scale-110 ${star <= rating ? 'text-[#f0a500]' : 'text-gray-600'}`}
                      >
                        <Star size={36} className={star <= rating ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-black/40 text-white placeholder-[#a0a0b0] focus:ring-2 focus:ring-[#e94560] transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setReviewModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-[#a0a0b0] hover:text-white hover:bg-white/5 font-medium transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingReview} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#f0a500] hover:bg-[#ffb700] text-black shadow-[0_0_15px_rgba(240,165,0,0.3)] disabled:opacity-50 transition-all">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
