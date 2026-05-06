import { apiRequest } from '@/services/api-client';
import type { MockUser } from '@/types/app';

export async function getMockUser() {
  return apiRequest<MockUser>('/user');
}
