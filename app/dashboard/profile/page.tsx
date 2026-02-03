'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }

    const user = JSON.parse(userStr);
    setName(user.name);
    setPhone(user.phone);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify({ name: name.trim(), phone }));
        setMessage('✅ Profile updated successfully!');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setMessage('❌ ' + (data.message || 'Failed to update profile'));
      }
    } catch (err) {
      setMessage('❌ Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-library-blue transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-library-blue to-indigo-600 bg-clip-text text-transparent">
                ✏️ Edit Profile
              </h1>
              <div className="w-16"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-library-blue focus:border-library-blue outline-none text-gray-900 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Phone number cannot be changed
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-xl font-medium text-sm sm:text-base ${
                  message.includes('✅')
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-library-blue to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
