import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Scissors, Compass, Calendar, Sparkles, User, LayoutDashboard, Settings, Image as ImageIcon, LogOut, Menu, X, Eye } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, userData } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive 
            ? "bg-[#e94560]/10 text-[#e94560]" 
            : "text-[#a0a0b0] hover:bg-white/5 hover:text-[#eaeaea]"
        )}
      >
        <Icon size={20} className={isActive ? "text-[#e94560]" : "opacity-70"} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  if (!user || !userData) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-[#16213e]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 text-[#eaeaea] font-bold text-xl tracking-tight">
              <Scissors className="text-[#e94560]" size={24} />
              BarberAI
            </Link>
            
            <div className="hidden md:flex gap-6 items-center">
              <Link to="/login" className="text-[#eaeaea] hover:text-white font-medium">Login</Link>
              <Link to="/register" className="bg-[#e94560] text-white px-5 py-2 rounded-full font-medium hover:bg-[#ff5c77] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(233,69,96,0.3)]">
                Register
              </Link>
            </div>

            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#16213e] border-b border-white/10 px-4 py-4 flex flex-col gap-4">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-[#eaeaea]">Login</Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-[#e94560] text-center text-white px-5 py-2 rounded-xl font-medium">Register</Link>
          </div>
        )}
      </nav>
    );
  }

  const customerLinks = [
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/my-bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/style-match', icon: Sparkles, label: 'Style Match' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const barberLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/barber-bookings', icon: Calendar, label: 'Bookings' },
    { to: '/setup-profile', icon: Settings, label: 'Setup Profile' },
    { to: '/portfolio', icon: ImageIcon, label: 'Portfolio' },
    { to: '/barber-profile', icon: Eye, label: 'View Profile' },
  ];

  const links = userData.role === 'customer' ? customerLinks : barberLinks;

  return (
    <>
      {/* Mobile Top Header (Authenticated) */}
      <div className="md:hidden sticky top-0 z-40 bg-[#16213e] border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Scissors className="text-[#e94560]" size={20} />
          BarberAI
        </div>
        <button onClick={handleLogout} className="text-[#a0a0b0] hover:text-white p-2">
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Layout w/ Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#16213e] border-r border-white/5 hidden md:flex flex-col z-40">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 text-[#eaeaea] font-bold text-2xl tracking-tight mb-8">
            <div className="bg-[#e94560]/10 p-2 rounded-xl">
              <Scissors className="text-[#e94560]" size={28} />
            </div>
            BarberAI
          </Link>

          <nav className="flex flex-col gap-2">
            {links.map((link, index) => (
              <div key={index}>
                <NavItem to={link.to} icon={link.icon} label={link.label} />
              </div>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#e94560] to-purple-600 flex items-center justify-center text-white font-bold">
              {userData.profileImageUrl ? (
                <img src={userData.profileImageUrl} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                userData.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-[#eaeaea]">{userData.name}</p>
              <p className="text-xs text-[#a0a0b0] capitalize">{userData.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#a0a0b0] hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut size={20} className="opacity-70" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#16213e]/95 backdrop-blur-md border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around p-2">
          {links.map((link, index) => {
            const isActive = location.pathname.startsWith(link.to);
            const Icon = link.icon;
            return (
              <Link key={index} to={link.to} className={clsx(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                isActive ? "text-[#e94560]" : "text-[#a0a0b0]"
              )}>
                <Icon size={20} className={isActive ? "" : "opacity-70"} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  );
}
