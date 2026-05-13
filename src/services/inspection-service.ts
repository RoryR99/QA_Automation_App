import { apiRequest } from '@/services/api-client';
import type { CreateInspectionInput, InspectionRecord } from '@/types/app';

export async function createInspection(input: CreateInspectionInput) {
  return apiRequest<InspectionRecord>('/inspections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listInspections() {
  return apiRequest<InspectionRecord[]>('/inspections');
}
