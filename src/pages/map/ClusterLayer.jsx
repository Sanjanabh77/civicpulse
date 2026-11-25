import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { Marker, Popup, useMap } from 'react-leaflet';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { statusColor } from '../../lib/status.js';

const pinIcon = (status) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${statusColor(status)};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5)"></div>`,
  iconSize: [16, 16],
});
const clusterIcon = (count) => {
  const size = count < 10 ? 34 : count < 50 ? 42 : 52;
  return L.divIcon({
    className: '',
    html: `<div class="p4-cluster" style="width:${size}px;height:${size}px;background:${count < 10 ? '#2563eb' : count < 50 ? '#f59e0b' : '#dc2626'}">${count}</div>`,
    iconSize: [size, size],
  });
};

export default function ClusterLayer({ features, bounds, zoom }) {
  const map = useMap();
  // Re-index only when the loaded data changes.
  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 17 });
    sc.load(features);
    return sc;
  }, [features]);
  // Re-cluster on pan/zoom (cheap, runs in the browser).
  const clusters = useMemo(() => (bounds ? index.getClusters(bounds, Math.round(zoom)) : []), [index, bounds, zoom]);

  return clusters.map((c) => {
    const [lng, lat] = c.geometry.coordinates;
    if (c.properties.cluster) {
      return (
        <Marker key={`c${c.id}`} position={[lat, lng]} icon={clusterIcon(c.properties.point_count)}
          eventHandlers={{ click: () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(c.id), 18)) }} />
      );
    }
    const p = c.properties;
    return (
      <Marker key={p.id} position={[lat, lng]} icon={pinIcon(p.status)}>
        <Popup>
          <strong>{p.title}</strong><br />
          <StatusBadge status={p.status} /> <small>{p.category} - {p.ward}</small><br />
          <Link to={`/reports/${p.id}/track`} style={{ display: 'inline-block', marginTop: 6, color: '#0e8a7d', fontWeight: 600, textDecoration: 'none' }}>
            Track issue &rarr;
          </Link>
        </Popup>
      </Marker>
    );
  });
}
