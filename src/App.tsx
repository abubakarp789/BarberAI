/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import clsx from 'clsx';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import BarberDetails from './pages/BarberDetails';
import Book from './pages/Book';
import MyBookings from './pages/MyBookings';
import StyleMatch from './pages/StyleMatch';
import Profile from './pages/Profile';
import BarberDashboard from './pages/BarberDashboard';
import BarberBookings from './pages/BarberBookings';
import SetupProfile from './pages/SetupProfile';
import Portfolio from './pages/Portfolio';
import Navbar from './components/Navbar';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">Loading...</div>;

  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to={userData.role === 'barber' ? "/dashboard" : "/explore"} replace />;
  }

  return children;
}

function AppLayout() {
  const { user, userData } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'BarberAI - Home',
      '/login': 'Login - BarberAI',
      '/register': 'Register - BarberAI',
      '/explore': 'Explore Barbers - BarberAI',
      '/my-bookings': 'My Bookings - BarberAI',
      '/style-match': 'AI Style Match - BarberAI',
      '/profile': 'Profile - BarberAI',
      '/dashboard': 'Dashboard - BarberAI',
      '/barber-bookings': 'Bookings - BarberAI',
      '/setup-profile': 'Setup Profile - BarberAI',
      '/portfolio': 'Portfolio - BarberAI',
    };

    let title = 'BarberAI';
    if (titles[location.pathname]) {
      title = titles[location.pathname];
    } else if (location.pathname.startsWith('/barber/')) {
      title = 'Barber Profile - BarberAI';
    } else if (location.pathname.startsWith('/book/')) {
      title = 'Book Appointment - BarberAI';
    }

    document.title = title;
  }, [location]);
  
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#eaeaea] font-sans selection:bg-[#e94560] selection:text-white flex flex-col">
      <Navbar />
      <main className={clsx(
        "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen",
        user && userData ? "md:ml-64 pb-24 md:pb-8" : ""
      )}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Customer Routes */}
          <Route path="/explore" element={<ProtectedRoute allowedRoles={['customer']}><Explore /></ProtectedRoute>} />
          <Route path="/barber/:uid" element={<ProtectedRoute><BarberDetails /></ProtectedRoute>} />
          <Route path="/book/:uid" element={<ProtectedRoute allowedRoles={['customer']}><Book /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['customer']}><MyBookings /></ProtectedRoute>} />
          <Route path="/style-match" element={<ProtectedRoute allowedRoles={['customer']}><StyleMatch /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Barber Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['barber']}><BarberDashboard /></ProtectedRoute>} />
          <Route path="/barber-bookings" element={<ProtectedRoute allowedRoles={['barber']}><BarberBookings /></ProtectedRoute>} />
          <Route path="/setup-profile" element={<ProtectedRoute allowedRoles={['barber']}><SetupProfile /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute allowedRoles={['barber']}><Portfolio /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#16213e', color: '#fff' } }} />
      </Router>
    </AuthProvider>
  );
}
