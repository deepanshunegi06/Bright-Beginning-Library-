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
  subscriptionExpiryDate?: string;
  joiningDate?: string;
  hasAadhaar?: boolean;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkOutConfirm, setShowMarkOutConfirm] = useState(false);
  const [markingOut, setMarkingOut] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    fetchUserData();

    // Auto-refresh every minute
    const interval = setInterval(() => {
      fetchUserData();
    }, 60000);

    return () => clearInterval(interval);
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Welcome Back!
                </h1>
                <p className="text-lg font-semibold text-gray-700 mt-2">{userData.name}</p>
                <p className="text-sm text-gray-600 mt-1">{userData.phone}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
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

            {/* Payment Status Alert */}
            {userData.subscriptionExpiryDate && (() => {
              const expiry = new Date(userData.subscriptionExpiryDate);
              const now = new Date();
              const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntilExpiry < 0) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg
                        className="w-6 h-6 text-red-600 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-red-800 mb-1">
                          Payment Expired
                        </h3>
                        <p className="text-sm text-red-700">
                          Your subscription expired on {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. Please renew to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else if (daysUntilExpiry <= 7) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
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
                          Payment Expiring Soon
                        </h3>
                        <p className="text-sm text-yellow-700">
                          Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} on {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. Please renew soon.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg
                        className="w-6 h-6 text-green-600 mr-3 flex-shrink-0"
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
                        <h3 className="font-semibold text-green-800 mb-1">
                          Active Subscription
                        </h3>
                        <p className="text-sm text-green-700">
                          Valid until {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Aadhaar Card Upload Notification */}
            {!userData.hasAadhaar && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-1">
                      📄 Upload Aadhaar Card
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Please upload your Aadhaar card for verification and record purposes.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/profile')}
                      className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Upload Now →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Forgot Yesterday Alert */}
            {userData.forgotYesterday && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-green-600"
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
                    <h3 className="font-bold text-green-800 mb-1">
                      ✅ All Done for Today!
                    </h3>
                    <p className="text-sm text-green-700">
                      You have already completed your entry for today. See you tomorrow!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Card */}
            {!userData.alreadyCompletedToday && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    📅 Today's Status
                  </h2>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold inline-block ${
                      isInside
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isInside ? '✅ Inside' : '🏁 Done'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🕐</span>
                      <span className="text-sm font-medium text-gray-700">Check-in</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {userData.todayInTime || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🕐</span>
                      <span className="text-sm font-medium text-gray-700">Check-out</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {userData.todayOutTime || 'Not marked'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/dashboard/history')}
              className="bg-white border border-gray-200 text-gray-800 p-4 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📊</span>
                <span>My History</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="bg-white border border-gray-200 text-gray-800 p-4 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">✏️</span>
                <span>Edit Profile</span>
              </div>
            </button>
          </div>

          {/* Mark Out Button */}
          {isInside && !userData.alreadyCompletedToday && (
            <button
              onClick={() => setShowMarkOutConfirm(true)}
              className="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition-all shadow-md mt-4"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🚪</span>
                <span>Mark Out Now</span>
              </div>
            </button>
          )}

          {/* Logout */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                sessionStorage.removeItem('user');
                router.push('/');
              }}
              className="text-red-600 hover:text-red-700 transition-colors font-semibold px-6 py-2 hover:bg-red-50 rounded-lg"
            >
              🔓 Logout
            </button>
          </div>
        </div>

        {/* Mark Out Confirmation Modal */}
        {showMarkOutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
                <h3 className="text-xl font-bold text-gray-800 mb-2">
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
