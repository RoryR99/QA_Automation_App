import { useQuery } from '@tanstack/react-query';

import { listInspections } from '@/services/inspection-service';

export function useInspectionHistory() {
  return useQuery({
    queryKey: ['inspection-history'],
    queryFn: listInspections,
  });
}
