import { useCallback, useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

// Must be used inside <MapContainer>. Returns the visible area as [west, south, east, north] + zoom.
export default function useMapBounds() {
  const map = useMap();
  const read = useCallback(() => {
    const b = map.getBounds();
    return { bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: map.getZoom() };
  }, [map]);
  const [state, setState] = useState(read);
  useMapEvents({ moveend: () => setState(read()), zoomend: () => setState(read()) });
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setState(read()), [read]);
  return state;
}

// Pad the box by 25% and round it so tiny pans do not trigger a new request.
export function paddedBbox([w, s, e, n]) {
  const dx = (e - w) * 0.25, dy = (n - s) * 0.25, r = (v) => Math.round(v * 100) / 100;
  return [r(Math.max(-180, w - dx)), r(Math.max(-90, s - dy)), r(Math.min(180, e + dx)), r(Math.min(90, n + dy))];
}
