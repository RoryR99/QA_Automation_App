import { useMutation } from '@tanstack/react-query';

import { createInspectionExtension } from '@/services/inspection-extension-service';

export function useCreateInspectionExtension() {
  return useMutation({
    mutationFn: createInspectionExtension,
  });
}
