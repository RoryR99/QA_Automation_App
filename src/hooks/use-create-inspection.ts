import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';

import { lastSubmittedInspectionAtom } from '@/lib/production-run-store';
import { createInspection } from '@/services/inspection-service';

export function useCreateInspection() {
  const queryClient = useQueryClient();
  const setLastSubmittedInspection = useSetAtom(lastSubmittedInspectionAtom);

  return useMutation({
    mutationFn: createInspection,
    onSuccess: (record) => {
      setLastSubmittedInspection(record.id);
      void queryClient.invalidateQueries({ queryKey: ['inspection-history'] });
    },
  });
}
