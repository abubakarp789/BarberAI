import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Compass, CalendarCheck, ArrowRight, Star, Check } from 'lucide-react';
import heroImg from '../assets/hero.png';

export default function Landing() {
  return (
    <div className="flex-1 w-full overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#e94560]/20 blur-[120px]"></div>
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in">
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              FIND YOUR <br />
              PERFECT CUT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-purple-500 drop-shadow-[0_0_30px_rgba(233,69,96,0.3)]">
                Powered by AI
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-[#a0a0b0] max-w-2xl lg:max-w-xl mb-10 leading-relaxed">
              Experience the future of grooming. Let our AI analyze your face shape, discover top-rated local barbers, and book your transformation seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/explore" className="px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff2a4d] hover:to-[#ff5c77] text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:-translate-y-1 shadow-[0_10px_30px_rgba(233,69,96,0.4)] flex items-center justify-center gap-2 group">
                Find a Barber
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register" className="px-8 py-4 bg-black/20 backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-white/5 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center">
                I'm a Barber
              </Link>
            </div>
          </div>
          
          {/* Right Content - Hero Image */}
          <div className="relative w-full max-w-lg mx-auto lg:max-w-none animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform lg:rotate-[-2deg] hover:rotate-0 transition-transform duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#e94560]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
              
              <img 
                src={heroImg} 
                alt="BarberAI App Interface" 
                className="w-full h-auto object-cover transform scale-105 group-hover:scale-100 transition-transform duration-700 aspect-[4/3] lg:aspect-auto"
              />
              
              
            </div>
            
            {/* Glow behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#e94560]/20 to-purple-500/20 blur-[80px] -z-10 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-[#a0a0b0] text-lg">We've completely reimagined the barber shop experience from discovery to the chair.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-all hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(233,69,96,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-black/50 to-black/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                <Compass className="text-[#e94560]" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Discover</h3>
              <p className="text-[#a0a0b0] leading-relaxed">Browse curated profiles of top local professionals. See their portfolios, read verified reviews, and check their real-time availability.</p>
            </div>
            
            <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-all hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(233,69,96,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-black/50 to-black/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                <Sparkles className="text-[#e94560]" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Analyze</h3>
              <p className="text-[#a0a0b0] leading-relaxed">Unsure what to get? Let our advanced AI analyze your face shape and suggest the perfect styles tailored specifically to your features.</p>
            </div>
            
            <div className="bg-[#16213e] p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-[#e94560]/50 transition-all hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(233,69,96,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e94560]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-black/50 to-black/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                <CalendarCheck className="text-[#e94560]" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">3. Book</h3>
              <p className="text-[#a0a0b0] leading-relaxed">Book appointments 24/7. No more phone tag. Select your service, choose an available time slot, and securely confirm your spot.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e94560]/30 bg-[#e94560]/10 text-[#e94560] font-medium text-sm mb-4">
            <Sparkles size={16} />
            <span>Built for AI Seekho 2026</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">#VibeKaregaPakistan</h2>
          <p className="text-[#a0a0b0] mb-6 max-w-lg mx-auto">
            This project was proudly created as part of the AI Seekho initiative.
          </p>
          <a 
            href="https://rsvp.withgoogle.com/events/aiseekho2026" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#e94560] hover:text-[#ff5c77] font-semibold transition-colors"
          >
            View Event Details <ArrowRight size={16} />
          </a>
        </div>
      </footer>
    </div>
  );
}
