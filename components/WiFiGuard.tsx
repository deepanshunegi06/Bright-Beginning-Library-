'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function WiFiGuard({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
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
            } else {
              setIsConnected(false);
            }
          },
          async (error) => {
            // If location is denied, block access and show message
            if (error.code === 1) {
              setLocationDenied(true);
              setIsConnected(false);
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
              } else {
                setIsConnected(false);
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
        } else {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error('Network check failed:', error);
      setIsConnected(false);
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
            WiFi Connection Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please be physically present at <strong className="text-library-blue">Bright Beginning Library</strong> to access the system.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>📍 Location Required:</strong>
              <br />
              • <strong>Must allow location access</strong> to enter
              <br />
              • Move near a window if indoors (better GPS signal)
              <br />
              • Works best on mobile phones
              <br />
              • Blocking location will prevent access
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Having trouble?</strong> Contact library staff for assistance.
            </p>
          </div>
          <button
            onClick={() => {
              setIsConnected(null); // Show loading
              checkWiFi(); // Request location again
            }}
            className="w-full bg-library-blue text-white py-3 rounded-lg font-semibold hover:bg-library-blue-dark transition-colors"
          >
            {locationDenied ? 'Grant Location Access' : 'Retry Connection'}
          </button>
        </div>
      </div>
    );
  }

  // Connected - show children
  return <>{children}</>;
}
