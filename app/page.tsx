'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !confirmPhone.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (phone !== confirmPhone) {
      setError('Phone numbers do not match');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('user', JSON.stringify({ name: data.name, phone: data.phone }));
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('user', JSON.stringify({ name: data.name, phone: data.phone }));
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block bg-blue-600 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-md">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome to</h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-600">Bright Beginning Library</h2>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-gray-200 rounded-lg p-1 mb-4 sm:mb-6">
            <button
              onClick={() => { setIsRegistering(false); setError(''); setName(''); setPhone(''); setConfirmPhone(''); }}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm sm:text-base font-semibold transition-all ${!isRegistering ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegistering(true); setError(''); setName(''); setPhone(''); setConfirmPhone(''); }}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-md text-sm sm:text-base font-semibold transition-all ${isRegistering ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
            >
              Register
            </button>
          </div>

          {/* Forms */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 text-center">Create New Account</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                    placeholder="Enter your phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPhone" className="block text-sm font-medium text-gray-700 mb-2">Confirm Phone Number</label>
                  <input
                    type="tel"
                    id="confirmPhone"
                    value={confirmPhone}
                    onChange={(e) => setConfirmPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                    placeholder="Re-enter your phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : '📝 Register'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 text-center">Welcome Back!</h3>
                
                <div>
                  <label htmlFor="phone-signin" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="phone-signin"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                    placeholder="Enter your registered phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : '🔐 Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
