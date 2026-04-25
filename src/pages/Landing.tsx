import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Compass, CalendarCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col flex-1 py-12 md:py-20 lg:py-28 text-center max-w-5xl mx-auto items-center justify-center">
      <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-[#eaeaea]">
        <Sparkles size={16} className="text-[#e94560]" />
        <span>Try our new AI Style Match</span>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
        Find Your Perfect Cut, <br className="hidden sm:block" />
        <span className="text-[#e94560]">Powered by AI</span>
      </h1>
      
      <p className="text-lg md:text-xl text-[#a0a0b0] max-w-2xl mb-12">
        Discover top-rated barbers, get personalized hairstyle recommendations based on your face shape, and book your next appointment seamlessly.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full sm:w-auto">
        <Link to="/explore" className="px-8 py-4 bg-[#e94560] hover:bg-[#ff5c77] text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(233,69,96,0.4)]">
          Find a Barber
        </Link>
        <Link to="/register" className="px-8 py-4 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white rounded-full font-bold text-lg transition-all">
          Register as Barber
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
        <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="w-14 h-14 bg-black/30 rounded-2xl flex items-center justify-center mb-6">
            <Compass className="text-[#e94560]" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3">Discover Barbers</h3>
          <p className="text-[#a0a0b0] leading-relaxed">Browse curated profiles of top local professionals. See their portfolios, read verified reviews, and check their real-time availability.</p>
        </div>
        
        <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="w-14 h-14 bg-black/30 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="text-[#e94560]" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3">AI Style Match</h3>
          <p className="text-[#a0a0b0] leading-relaxed">Unsure what to get? Let our AI analyze your face shape and suggest the perfect styles. Share the brief directly with your barber.</p>
        </div>
        
        <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e94560]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="w-14 h-14 bg-black/30 rounded-2xl flex items-center justify-center mb-6">
            <CalendarCheck className="text-[#e94560]" size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3">Easy Booking</h3>
          <p className="text-[#a0a0b0] leading-relaxed">Book appointments 24/7. No more phone tag. Select your service, choose an available time slot, and securely confirm your spot.</p>
        </div>
      </div>
    </div>
  );
}
