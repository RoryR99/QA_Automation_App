import { apiRequest } from '@/services/api-client';
import type { ProductionRun, ProductionRunBatch, StartRunInput } from '@/types/app';

export async function createProductionRun(input: StartRunInput) {
  return apiRequest<ProductionRun>('/production-runs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listRecentRuns() {
  return apiRequest<ProductionRun[]>('/production-runs');
}

export async function closeProductionRun(id: string) {
  return apiRequest<ProductionRun>('/production-runs', {
    method: 'PATCH',
    body: JSON.stringify({ id, status: 'closed' }),
  });
}

export async function addProductionRunBatchNumbers(productionRunId: string, batchNumbers: string[]) {
  return apiRequest<ProductionRunBatch[]>('/production-run-batches', {
    method: 'POST',
    body: JSON.stringify({ productionRunId, batchNumbers }),
  });
}
