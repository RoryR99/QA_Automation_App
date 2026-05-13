import { apiRequest } from '@/services/api-client';
import type { CreateInspectionExtensionInput, InspectionExtensionRecord } from '@/types/app';

export async function createInspectionExtension(input: CreateInspectionExtensionInput) {
  return apiRequest<InspectionExtensionRecord>('/inspection-extensions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
