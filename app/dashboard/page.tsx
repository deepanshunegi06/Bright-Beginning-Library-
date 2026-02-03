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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome, {userData.name}!
                </h1>
                <p className="text-gray-600 mt-1">{userData.phone}</p>
              </div>
              <div className="bg-library-blue p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-white"
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-gray-600 mr-3 flex-shrink-0"
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
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Attendance Complete
                    </h3>
                    <p className="text-sm text-gray-700">
                      You have already completed your entry for today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Card */}
            {!userData.alreadyCompletedToday && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Today's Status
                  </h2>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      isInside
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isInside ? '🟢 Currently Inside Library' : '⚪ You have exited today'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Check-in Time:</span>
                    <span className="font-semibold text-gray-900">
                      {userData.todayInTime || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Check-out Time:</span>
                    <span className="font-semibold text-gray-900">
                      {userData.todayOutTime || 'Not marked yet'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mark Out Button */}
          {isInside && !userData.alreadyCompletedToday && (
            <button
              onClick={() => setShowMarkOutConfirm(true)}
              className="w-full bg-red-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              Mark Out
            </button>
          )}

          {/* Back to Home */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                sessionStorage.removeItem('user');
                router.push('/');
              }}
              className="text-gray-600 hover:text-library-blue transition-colors"
            >
              ← Back to Home
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
