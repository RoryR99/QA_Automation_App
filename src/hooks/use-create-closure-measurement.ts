import { useMutation } from '@tanstack/react-query';

import { createClosureMeasurement } from '@/services/closure-measurement-service';

export function useCreateClosureMeasurement() {
  return useMutation({
    mutationFn: createClosureMeasurement,
  });
}
