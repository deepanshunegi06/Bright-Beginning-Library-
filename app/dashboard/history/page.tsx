'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

interface AttendanceRecord {
  date: string;
  inTime: string;
  outTime: string | null;
}

export default function AttendanceHistory() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);

      try {
        const response = await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ phone: user.phone }),
        });

        const data = await response.json();

        if (response.ok) {
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

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

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-library-blue"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">My Attendance History</h1>
              <div className="w-16"></div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No attendance records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{record.date}</p>
                      <p className="text-sm text-gray-600">
                        IN: {record.inTime} | OUT: {record.outTime || 'Not marked'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      record.outTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.outTime ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
