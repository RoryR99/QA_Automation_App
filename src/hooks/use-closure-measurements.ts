import { useQuery } from '@tanstack/react-query';

import { listClosureMeasurements } from '@/services/history-service';

export function useClosureMeasurements() {
  return useQuery({
    queryKey: ['closure-measurements'],
    queryFn: listClosureMeasurements,
  });
}
