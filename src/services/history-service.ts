import { apiRequest } from '@/services/api-client';
import type { ClosureMeasurementRecord, InspectionExtensionRecord } from '@/types/app';

export async function listInspectionExtensions() {
  return apiRequest<InspectionExtensionRecord[]>('/inspection-extensions');
}

export async function listClosureMeasurements() {
  return apiRequest<ClosureMeasurementRecord[]>('/closure-measurements');
}
