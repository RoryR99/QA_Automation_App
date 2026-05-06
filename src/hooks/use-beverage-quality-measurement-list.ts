import { useQuery } from '@tanstack/react-query';

import { listBeverageQualityMeasurements } from '@/services/beverage-quality-service';

export function useBeverageQualityMeasurementList() {
  return useQuery({
    queryKey: ['beverage-quality-measurements'],
    queryFn: listBeverageQualityMeasurements,
    staleTime: Infinity,
  });
}
