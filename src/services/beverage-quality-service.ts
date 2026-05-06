import { apiRequest } from '@/services/api-client';
import { beverageQualityData } from '@/data/beverage-quality-data';
import type { BeverageQualityMeasurement } from '@/types/app';

export async function listBeverageQualityMeasurements() {
  try {
    return await apiRequest<BeverageQualityMeasurement[]>('/beverage-quality-measurements');
  } catch {
    // Keep brand/flavor/spec dropdowns working even when the local API is unavailable.
    return beverageQualityData;
  }
}
