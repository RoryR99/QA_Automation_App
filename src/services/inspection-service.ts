import { apiRequest } from '@/services/api-client';
import { mockDb, wait } from '@/services/mock-db';
import type { CreateInspectionInput, InspectionRecord } from '@/types/app';

export async function createInspection(input: CreateInspectionInput) {
  try {
    return await apiRequest<InspectionRecord>('/inspections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    await wait(250);
    const record: InspectionRecord = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `inspection-${Date.now()}`,
      createdAt: new Date().toISOString(),
      inspectionType: input.inspectionType,
      payload: input,
    };
    const existing = mockDb.inspections.read<InspectionRecord>();
    mockDb.inspections.write([record, ...existing.filter((item) => item.id !== record.id)]);
    return record;
  }
}

export async function listInspections() {
  try {
    return await apiRequest<InspectionRecord[]>('/inspections');
  } catch {
    await wait(150);
    return mockDb.inspections.read<InspectionRecord>();
  }
}
