import { useQuery } from '@tanstack/react-query';

import { getProductSpec } from '@/services/product-service';
import type { ProductionRun } from '@/types/app';

export function useProductSpec(run: ProductionRun | null) {
  return useQuery({
    queryKey: ['product-spec', run?.brand, run?.flavour, run?.packageType],
    queryFn: () => getProductSpec(run),
  });
}
