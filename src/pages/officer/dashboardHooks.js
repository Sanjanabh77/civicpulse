import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

export const useSummary = () =>
  useQuery({
    queryKey: ['dash-summary'],
    queryFn: () => api('/dashboard/summary'),
    refetchInterval: 60_000,
  });

export const useReports = (filters) =>
  useInfiniteQuery({
    queryKey: ['dash-reports', filters],
    queryFn: ({ pageParam }) => api('/dashboard/reports', { params: { ...filters, cursor: pageParam } }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

export const useOfficers = (enabled) =>
  useQuery({
    queryKey: ['dash-officers'],
    queryFn: () => api('/dashboard/officers'),
    enabled,
  });

function useInvalidatingMutation(fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['dash-reports'] });
      qc.invalidateQueries({ queryKey: ['dash-summary'] });
      qc.invalidateQueries({ queryKey: ['map-reports'] });
      if (variables?.id) {
        qc.invalidateQueries({ queryKey: ['tracking', variables.id] });
      }
    },
  });
}

export const useUpdateStatus = () =>
  useInvalidatingMutation(({ id, ...body }) =>
    api(`/dashboard/reports/${id}/status`, { method: 'PATCH', body }),
  );

export const useAssign = () =>
  useInvalidatingMutation(({ id, officerId }) =>
    api(`/dashboard/reports/${id}/assign`, { method: 'PATCH', body: { officerId } }),
  );
