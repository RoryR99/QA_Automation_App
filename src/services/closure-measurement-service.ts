import { apiRequest } from '@/services/api-client';
import { mockDb, wait } from '@/services/mock-db';
import type { ClosureMeasurementInput, ClosureMeasurementRecord } from '@/types/app';

export async function createClosureMeasurement(input: ClosureMeasurementInput) {
  try {
    return await apiRequest<ClosureMeasurementRecord>('/closure-measurements', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    await wait(250);
    const record: ClosureMeasurementRecord = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `closure-measurement-${Date.now()}`,
      createdAt: new Date().toISOString(),
      payload: input,
    };
    const existing = mockDb.closureMeasurements.read<ClosureMeasurementRecord>();
    mockDb.closureMeasurements.write([record, ...existing.filter((item) => item.id !== record.id)]);
    return record;
  }
}
