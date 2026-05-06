import { useQuery } from '@tanstack/react-query';

import { listRecentRuns } from '@/services/production-service';

export function useRecentRuns() {
  return useQuery({
    queryKey: ['recent-runs'],
    queryFn: listRecentRuns,
  });
}
