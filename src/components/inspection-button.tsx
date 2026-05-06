import { CheckCircle2, OctagonAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { InspectionValue } from '@/types/app';

interface InspectionButtonProps {
  value?: InspectionValue;
  onChange: (value: InspectionValue) => void;
}

export function InspectionButton({ value, onChange }: InspectionButtonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant={value === 'acceptable' ? 'default' : 'outline'}
        className={cn(
          'h-14 justify-start rounded-2xl border px-4 text-left',
          value === 'acceptable' && 'bg-success text-white hover:brightness-105',
        )}
        onClick={() => onChange('acceptable')}
      >
        <CheckCircle2 className="h-5 w-5" />
        Acceptable
      </Button>
      <Button
        type="button"
        variant={value === 'non-acceptable' ? 'destructive' : 'outline'}
        className="h-14 justify-start rounded-2xl border px-4 text-left"
        onClick={() => onChange('non-acceptable')}
      >
        <OctagonAlert className="h-5 w-5" />
        Non-acceptable
      </Button>
    </div>
  );
}
