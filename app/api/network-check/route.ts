import { NextRequest, NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userLat = searchParams.get('lat');
  const userLon = searchParams.get('lon');

  // Method 1: Geolocation check (for Vercel/Cloud deployment)
  if (userLat && userLon) {
    const libraryLat = parseFloat(process.env.LIBRARY_LATITUDE || '0');
    const libraryLon = parseFloat(process.env.LIBRARY_LONGITUDE || '0');
    const maxRadius = parseFloat(process.env.LIBRARY_RADIUS_METERS || '100');

    if (libraryLat !== 0 && libraryLon !== 0) {
      const distance = calculateDistance(
        libraryLat,
        libraryLon,
        parseFloat(userLat),
        parseFloat(userLon)
      );

      return NextResponse.json({
        connected: distance <= maxRadius,
        method: 'geolocation',
        distance: Math.round(distance),
        maxRadius: maxRadius,
        timestamp: Date.now()
      });
    }
  }

  // Method 2: IP-based check (for local development)
  const forwarded = request.headers.get('x-forwarded-for');
  let clientIp = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  
  // For localhost development, get the actual machine's local IP
  if (!clientIp || clientIp === 'unknown' || clientIp.includes('127.0.0.1') || clientIp.includes('::1') || clientIp.includes('::ffff:127.0.0.1')) {
    const nets = networkInterfaces();
    const candidates: string[] = [];
    
    for (const name of Object.keys(nets)) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('virtualbox') || 
          lowerName.includes('vmware') || 
          lowerName.includes('vethernet') ||
          lowerName.includes('docker') ||
          lowerName.includes('vbox')) {
        continue;
      }
      
      for (const net of nets[name]!) {
        if (net.family === 'IPv4' && !net.internal) {
          candidates.push(net.address);
          
          const libraryNetworkPrefix = process.env.LIBRARY_NETWORK_PREFIX || '192.168.86';
          if (net.address.startsWith(libraryNetworkPrefix)) {
            clientIp = net.address;
            break;
          }
        }
      }
      if (clientIp && clientIp.startsWith(process.env.LIBRARY_NETWORK_PREFIX || '192.168.86')) break;
    }
    
    if ((!clientIp || clientIp.includes('127.0.0.1')) && candidates.length > 0) {
      clientIp = candidates[0];
    }
  }
  
  const libraryNetworkPrefix = process.env.LIBRARY_NETWORK_PREFIX || '192.168.86';
  const allowedPrefixes = libraryNetworkPrefix.split(',').map(p => p.trim());
  
  const isLibraryNetwork = clientIp ? allowedPrefixes.some(prefix => clientIp.startsWith(prefix)) : false;
  
  return NextResponse.json({
    connected: isLibraryNetwork,
    method: 'ip',
    ip: clientIp || 'unknown',
    requiredPrefix: libraryNetworkPrefix,
    timestamp: Date.now()
  });
}
