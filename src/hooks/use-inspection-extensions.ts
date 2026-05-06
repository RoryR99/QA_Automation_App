import { useQuery } from '@tanstack/react-query';

import { listInspectionExtensions } from '@/services/history-service';

export function useInspectionExtensions() {
  return useQuery({
    queryKey: ['inspection-extensions'],
    queryFn: listInspectionExtensions,
  });
}
