'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function WiFiGuard({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [outOfRange, setOutOfRange] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Skip location check for admin routes
  const isAdminRoute = pathname?.startsWith('/admin');

  const checkWiFi = async () => {
    // For development/testing: Allow bypass with localStorage
    const bypass = localStorage.getItem('wifi_check_bypass');
    if (bypass === 'true') {
      setIsConnected(true);
      return;
    }

    // Check if online first
    if (!navigator.onLine) {
      setIsConnected(false);
      return;
    }

    try {
      // Try to get user's location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Call our network check API with location
            const response = await fetch(
              `/api/network-check?lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
              {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              setIsConnected(data.connected);
              setLocationDenied(false);
              setOutOfRange(!data.connected); // If not connected, they're out of range
            } else {
              setIsConnected(false);
              setOutOfRange(true);
            }
          },
          async (error) => {
            // If location is denied, block access and show message
            if (error.code === 1) {
              setLocationDenied(true);
              setIsConnected(false);
              setOutOfRange(false);
            } else {
              // Position unavailable or timeout - try IP fallback
              const response = await fetch('/api/network-check', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
              });
              
              if (response.ok) {
                const data = await response.json();
                setIsConnected(data.connected);
                setLocationDenied(false);
                setOutOfRange(!data.connected);
              } else {
                setIsConnected(false);
                setOutOfRange(true);
              }
            }
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        // No geolocation support, use IP check
        const response = await fetch('/api/network-check', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected);
          setOutOfRange(!data.connected);
        } else {
          setIsConnected(false);
          setOutOfRange(true);
        }
      }
    } catch (error) {
      console.error('Network check failed:', error);
      setIsConnected(false);
      setOutOfRange(true);
    }
  };

  useEffect(() => {
    // Allow admin routes without location check
    if (isAdminRoute) {
      setIsConnected(true);
      return;
    }

    checkWiFi();

    // Recheck every 10 seconds
    const interval = setInterval(checkWiFi, 10000);

    // Listen for network changes
    const handleOnline = () => checkWiFi();
    const handleOffline = () => setIsConnected(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkWiFi();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdminRoute]);

  // Loading state
  if (isConnected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-library-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Checking connection...</p>
        </div>
      </div>
    );
  }

  // Not connected to library WiFi
  if (!isConnected) {
    // Case 1: Location is turned off or denied
    if (locationDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Location Access Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please enable location services to verify you are at the library.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-amber-800">
                <strong>📍 How to Enable Location:</strong>
                <br /><br />
                <strong>On Chrome/Edge:</strong>
                <br />• Click the 🔒 lock icon in address bar
                <br />• Click "Site settings"
                <br />• Find "Location" → Select "Allow"
                <br />• Refresh the page
                <br /><br />
                <strong>On Mobile:</strong>
                <br />• Tap address bar → Tap 🔒 or (i) icon
                <br />• Go to "Permissions" or "Site settings"
                <br />• Enable "Location"
                <br />• Refresh the page
              </p>
            </div>
            <button
              onClick={() => {
                setIsConnected(null);
                setLocationDenied(false);
                setTimeout(() => checkWiFi(), 100);
              }}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors mb-3"
            >
              Retry After Enabling Location
            </button>
            <p className="text-xs text-gray-500 text-center">
              Location is needed to verify library attendance
            </p>
          </div>
        </div>
      );
    }

    // Case 2: Location is on but user is out of range
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-red-500"
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
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 mb-6">
            You can only access this system when you are physically present at <strong className="text-red-600">Bright Beginning Library</strong>.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>🚫 Out of Range</strong>
              <br /><br />
              Please visit the library to mark your attendance and access the system.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Need Help?</strong> Contact library staff for assistance.
            </p>
          </div>
          <button
            onClick={() => {
              setIsConnected(null);
              setOutOfRange(false);
              setTimeout(() => checkWiFi(), 100);
            }}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Connected - show children
  return <>{children}</>;
}
