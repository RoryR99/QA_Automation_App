import { apiRequest } from '@/services/api-client';
import type { BeverageQualityMeasurement } from '@/types/app';

export async function listBeverageQualityMeasurements() {
  return apiRequest<BeverageQualityMeasurement[]>('/beverage-quality-measurements');
}
