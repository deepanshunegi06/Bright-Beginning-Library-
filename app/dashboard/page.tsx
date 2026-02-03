'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

interface UserData {
  name: string;
  phone: string;
  todayInTime?: string;
  todayOutTime?: string | null;
  forgotYesterday?: boolean;
  alreadyCompletedToday?: boolean;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkOutConfirm, setShowMarkOutConfirm] = useState(false);
  const [markingOut, setMarkingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);

      try {
        const response = await fetch('/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: user.phone }),
        });

        const data = await response.json();

        if (response.ok) {
          setUserData(data);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to fetch user status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleMarkOut = async () => {
    if (!userData) return;

    setMarkingOut(true);

    try {
      const response = await fetch('/api/markOut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userData.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData({
          ...userData,
          todayOutTime: data.outTime,
        });
        setShowMarkOutConfirm(false);
      } else {
        alert(data.message || 'Failed to mark out');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setMarkingOut(false);
    }
  };

  if (loading) {
    return (
      <WiFiGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-library-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </WiFiGuard>
    );
  }

  if (!userData) {
    return null;
  }

  const isInside = userData.todayInTime && !userData.todayOutTime;

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-library-blue to-indigo-600 bg-clip-text text-transparent">
                  Welcome Back!
                </h1>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">{userData.name}</p>
                <p className="text-sm text-gray-600 mt-1">{userData.phone}</p>
              </div>
              <div className="bg-gradient-to-br from-library-blue to-indigo-600 p-4 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Forgot Yesterday Alert */}
            {userData.forgotYesterday && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">
                      Reminder
                    </h3>
                    <p className="text-sm text-yellow-700">
                      You forgot to mark OUT yesterday. Please remember to mark OUT every day before leaving.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Already Completed Alert */}
            {userData.alreadyCompletedToday && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 mb-1 text-base sm:text-lg">
                      ✅ All Done for Today!
                    </h3>
                    <p className="text-sm sm:text-base text-green-700">
                      You have already completed your entry for today. See you tomorrow!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Card */}
            {!userData.alreadyCompletedToday && (
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    📅 Today's Status
                  </h2>
                  <span
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold inline-block shadow-sm ${
                      isInside
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                    }`}
                  >
                    {isInside ? '✅ Inside Library' : '🏁 Completed'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🕐</span>
                      <span className="text-sm sm:text-base text-gray-700 font-medium">Check-in</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {userData.todayInTime || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🕐</span>
                      <span className="text-sm sm:text-base text-gray-700 font-medium">Check-out</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {userData.todayOutTime || 'Not marked'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/dashboard/history')}
              className="group bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 sm:p-5 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl">📊</span>
                <span className="text-base sm:text-lg">My History</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="group bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 sm:p-5 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl">✏️</span>
                <span className="text-base sm:text-lg">Edit Profile</span>
              </div>
            </button>
          </div>

          {/* Mark Out Button */}
          {isInside && !userData.alreadyCompletedToday && (
            <button
              onClick={() => setShowMarkOutConfirm(true)}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 mt-4 sm:mt-6"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🚪</span>
                <span>Mark Out Now</span>
              </div>
            </button>
          )}

          {/* Logout */}
          <div className="text-center mt-6 sm:mt-8">
            <button
              onClick={() => {
                sessionStorage.removeItem('user');
                router.push('/');
              }}
              className="text-red-600 hover:text-red-700 transition-colors font-semibold text-sm sm:text-base px-6 py-2 hover:bg-red-50 rounded-lg"
            >
              🔓 Logout
            </button>
          </div>
        </div>

        {/* Mark Out Confirmation Modal */}
        {showMarkOutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="inline-block bg-red-100 p-4 rounded-full mb-4">
                  <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Confirm Mark Out
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to mark OUT now?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleMarkOut}
                  disabled={markingOut}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {markingOut ? 'Marking Out...' : 'Yes, Mark Out'}
                </button>
                <button
                  onClick={() => setShowMarkOutConfirm(false)}
                  disabled={markingOut}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WiFiGuard>
  );
}
