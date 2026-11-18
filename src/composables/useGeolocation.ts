export type GeoFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported'

export class GeoError extends Error {
  constructor(public kind: GeoFailure) {
    super(kind)
  }
}

/**
 * Asks the browser for the current position. Call it only from a deliberate tap: the permission
 * prompt appears at that moment and not on page load.
 */
export function locate(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new GeoError('unsupported'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new GeoError(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
