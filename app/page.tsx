'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

export default function Home() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !confirmPhone.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (phone !== confirmPhone) {
      setError('Phone numbers do not match');
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

      // Store user data in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({ name: data.name, phone: data.phone }));
      
      // Redirect to dashboard
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

      // Store user data in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({ name: data.name, phone: data.phone }));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-library-blue p-4 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome to
            </h1>
            <h2 className="text-4xl font-bold text-library-blue">
              Bright Beginning Library
            </h2>
          </div>

          {/* Toggle Buttons */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
            <div className="grid grid-cols-2">
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                  setName('');
                  setPhone('');
                  setConfirmPhone('');
                }}
                className={`py-4 font-semibold transition-colors ${
                  !isRegistering
                    ? 'bg-library-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                  setName('');
                  setPhone('');
                  setConfirmPhone('');
                }}
                className={`py-4 font-semibold transition-colors ${
                  isRegistering
                    ? 'bg-library-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Forms */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {isRegistering ? (
              // Registration Form
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-library-blue focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-library-blue focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Enter your phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPhone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Phone Number
                  </label>
                  <input
                    type="tel"
                    id="confirmPhone"
                    value={confirmPhone}
                    onChange={(e) => setConfirmPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-library-blue focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Re-enter your phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-library-blue text-white py-4 rounded-lg font-semibold text-lg hover:bg-library-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    '📝 Register'
                  )}
                </button>
              </form>
            ) : (
              // Sign In Form
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label
                    htmlFor="phone-signin"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone-signin"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-library-blue focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Enter your registered phone number"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-library-blue text-white py-4 rounded-lg font-semibold text-lg hover:bg-library-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    '🚪 Sign In & Enter Library'
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  New user? Click <span className="font-semibold text-library-blue">Register</span> above
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
