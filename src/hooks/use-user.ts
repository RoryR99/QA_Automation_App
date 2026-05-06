import { useQuery } from '@tanstack/react-query';

import { getMockUser } from '@/services/user-service';

export function useUser() {
  return useQuery({
    queryKey: ['mock-user'],
    queryFn: getMockUser,
    staleTime: Infinity,
  });
}
