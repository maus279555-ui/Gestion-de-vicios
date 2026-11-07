import { GeoLocationInfo } from '../types/finance';

let cachedLocation: GeoLocationInfo | null = null;
let watcherId: number | null = null;

export const startLocationWatcher = (onUpdate?: (loc: GeoLocationInfo) => void) => {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return;
  }

  // Attempt initial quick position
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      cachedLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
        timestamp: pos.timestamp,
        address: formatApproxAddress(pos.coords.latitude, pos.coords.longitude),
      };
      if (onUpdate && cachedLocation) onUpdate(cachedLocation);
    },
    (err) => {
      console.warn('Geolocation warning:', err.message);
    },
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
  );

  // Watch position
  try {
    watcherId = navigator.geolocation.watchPosition(
      (pos) => {
        cachedLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
          address: formatApproxAddress(pos.coords.latitude, pos.coords.longitude),
        };
        if (onUpdate && cachedLocation) onUpdate(cachedLocation);
      },
      (err) => {
        console.warn('Watch geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  } catch (e) {
    console.warn('Could not start location watcher', e);
  }
};

export const stopLocationWatcher = () => {
  if (watcherId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watcherId);
    watcherId = null;
  }
};

export const getCurrentCachedLocation = async (): Promise<GeoLocationInfo | null> => {
  if (cachedLocation) {
    return cachedLocation;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const info: GeoLocationInfo = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
          address: formatApproxAddress(pos.coords.latitude, pos.coords.longitude),
        };
        cachedLocation = info;
        resolve(info);
      },
      () => {
        // Fallback default coordinates if in dev or permission denied
        resolve(cachedLocation);
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
    );
  });
};

function formatApproxAddress(lat: number, lng: number): string {
  // Approximate coordinate description for quick display
  return `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export const triggerHaptic = (type: 'light' | 'success' | 'warning' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(35);
      if (type === 'success') navigator.vibrate([40, 60, 80]);
      if (type === 'warning') navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignore vibration error
    }
  }
};
