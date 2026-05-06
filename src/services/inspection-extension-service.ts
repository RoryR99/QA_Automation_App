import { apiRequest } from '@/services/api-client';
import { mockDb, wait } from '@/services/mock-db';
import type { CreateInspectionExtensionInput, InspectionExtensionRecord } from '@/types/app';

export async function createInspectionExtension(input: CreateInspectionExtensionInput) {
  try {
    return await apiRequest<InspectionExtensionRecord>('/inspection-extensions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    await wait(250);
    const record: InspectionExtensionRecord = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `inspection-extension-${Date.now()}`,
      createdAt: new Date().toISOString(),
      payload: input,
    };
    const existing = mockDb.inspectionExtensions.read<InspectionExtensionRecord>();
    mockDb.inspectionExtensions.write([record, ...existing.filter((item) => item.id !== record.id)]);
    return record;
  }
}
