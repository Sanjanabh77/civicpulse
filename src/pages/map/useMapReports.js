import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Loads reports for the visible area only. keepPreviousData = no flicker while panning.
export default function useMapReports(bbox, filters) {
  const key = bbox?.join(',');
  return useQuery({
    queryKey: ['map-reports', key, filters.status, filters.category],
    queryFn: () => api('/map/reports', { params: { bbox: key, status: filters.status, category: filters.category } }),
    enabled: !!key,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
