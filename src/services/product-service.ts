import { apiRequest } from '@/services/api-client';
import type { ProductSpec, ProductionRun } from '@/types/app';

export async function getProductSpec(run: ProductionRun | null) {
  const params = new URLSearchParams();

  if (run?.brand) params.set('brand', run.brand);
  if (run?.flavour) params.set('flavour', run.flavour);
  if (run?.packageType) params.set('packageType', run.packageType);

  return apiRequest<ProductSpec>(`/product-specs?${params.toString()}`);
}
