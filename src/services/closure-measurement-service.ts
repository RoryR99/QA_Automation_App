import { apiRequest } from '@/services/api-client';
import type { ClosureMeasurementInput, ClosureMeasurementRecord } from '@/types/app';

export async function createClosureMeasurement(input: ClosureMeasurementInput) {
  return apiRequest<ClosureMeasurementRecord>('/closure-measurements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
