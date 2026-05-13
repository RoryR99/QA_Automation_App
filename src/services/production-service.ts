import { apiRequest } from '@/services/api-client';
import type { ProductionRun, StartRunInput } from '@/types/app';

export async function createProductionRun(input: StartRunInput) {
  return apiRequest<ProductionRun>('/production-runs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listRecentRuns() {
  return apiRequest<ProductionRun[]>('/production-runs');
}
