import { apiRequest } from '@/services/api-client';
import { mockDb, wait } from '@/services/mock-db';
import type { ClosureMeasurementRecord, InspectionExtensionRecord } from '@/types/app';

export async function listInspectionExtensions() {
  try {
    return await apiRequest<InspectionExtensionRecord[]>('/inspection-extensions');
  } catch {
    await wait(150);
    return mockDb.inspectionExtensions.read<InspectionExtensionRecord>();
  }
}

export async function listClosureMeasurements() {
  try {
    return await apiRequest<ClosureMeasurementRecord[]>('/closure-measurements');
  } catch {
    await wait(150);
    return mockDb.closureMeasurements.read<ClosureMeasurementRecord>();
  }
}
