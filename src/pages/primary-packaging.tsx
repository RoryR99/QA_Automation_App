import { ChangeEvent, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Package } from 'lucide-react';

import { InspectionButton } from '@/components/inspection-button';
import { PhotoUpload } from '@/components/photo-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInspection } from '@/hooks/use-create-inspection';
import { useUser } from '@/hooks/use-user';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import type { InspectionValue } from '@/types/app';

interface InspectionField {
  key: string;
  label: string;
  value?: InspectionValue;
  imageUrl?: string;
}

const primaryInspectionFields: InspectionField[] = [
  { key: 'cap', label: 'Cap / Neck / Sealing Surface' },
  { key: 'filtec', label: 'FILTEC' },
  { key: 'dryAfterWarmer', label: 'DRY AFTER WARMER' },
  { key: 'labelalignment', label: 'Label Alignment' },
  { key: 'securesealtest', label: 'Secure Seal Test' },
  { key: 'datecode', label: 'Date Code Condition' },
];

export function PrimaryPackagingPage() {
  const navigate = useNavigate();
  const currentRun = useAtomValue(currentProductionRunAtom);
  const createInspection = useCreateInspection();
  const { data: user } = useUser();

  const [temperatureAfterWarmer, setTemperatureAfterWarmer] = useState<number | undefined>(undefined);
  const [condensationAfterWarmer, setCondensationAfterWarmer] = useState<InspectionValue | undefined>(undefined);
  const [inspections, setInspections] = useState<InspectionField[]>(primaryInspectionFields);

  const updateInspection = (key: string, value: InspectionValue) => {
    setInspections((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
  };

  const updateImageUrl = (key: string, imageUrl?: string) => {
    setInspections((prev) => prev.map((item) => (item.key === key ? { ...item, imageUrl } : item)));
  };

  const handleSubmit = async () => {
    if (!currentRun) {
      toast.error('No active production run');
      return;
    }

    const incompleteFields = inspections.filter((item) => !item.value);
    if (incompleteFields.length > 0) {
      toast.error(`Please complete all inspections: ${incompleteFields.map((item) => item.label).join(', ')}`);
      return;
    }

    try {
      await createInspection.mutateAsync({
        hourlyinspectionname: `Primary Packaging - ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        inspector: user?.userPrincipalName ?? 'Unknown',
        inspectionType: 'primary-packaging',
        productionrunid: { id: currentRun.id, productioncode: currentRun.productioncode },
        producttempf: temperatureAfterWarmer,
        ...(condensationAfterWarmer && {
          condensationKey: condensationAfterWarmer === 'acceptable' ? 'Condensationkey0' : 'Condensationkey1',
        }),
        capKey: inspections.find((item) => item.key === 'cap')?.value === 'acceptable' ? 'Capkey0' : 'Capkey1',
        capimageurl: inspections.find((item) => item.key === 'cap')?.imageUrl,
        filtecKey: inspections.find((item) => item.key === 'filtec')?.value === 'acceptable' ? 'Filteckey0' : 'Filteckey1',
        filtecimageurl: inspections.find((item) => item.key === 'filtec')?.imageUrl,
        dryafterwarmerKey:
          inspections.find((item) => item.key === 'dryAfterWarmer')?.value === 'acceptable'
            ? 'Dryafterwarmerkey0'
            : 'Dryafterwarmerkey1',
        dryafterwarmerimageurl: inspections.find((item) => item.key === 'dryAfterWarmer')?.imageUrl,
        labelalignmentKey:
          inspections.find((item) => item.key === 'labelalignment')?.value === 'acceptable'
            ? 'Labelalignmentkey0'
            : 'Labelalignmentkey1',
        labelalignmentimageurl: inspections.find((item) => item.key === 'labelalignment')?.imageUrl,
        securesealtestKey:
          inspections.find((item) => item.key === 'securesealtest')?.value === 'acceptable'
            ? 'Securesealtestkey0'
            : 'Securesealtestkey1',
        securesealtestimageurl: inspections.find((item) => item.key === 'securesealtest')?.imageUrl,
        datecodeKey:
          inspections.find((item) => item.key === 'datecode')?.value === 'acceptable'
            ? 'Datecodekey0'
            : 'Datecodekey1',
        datecodeimageurl: inspections.find((item) => item.key === 'datecode')?.imageUrl,
      });

      toast.success('Primary packaging inspection saved');
      navigate('/secondary-packaging');
    } catch {
      toast.error('Failed to save inspection');
    }
  };

  if (!currentRun) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-serif text-2xl font-semibold">No active production run</h2>
          <p className="mb-4 text-muted-foreground">Start a new production run to begin inspections.</p>
          <Button onClick={() => navigate('/')}>Start new run</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full p-1 lg:p-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl font-semibold text-foreground">Primary Packaging</h1>
          </div>
          <p className="text-muted-foreground">
            Run: <span className="font-medium text-foreground">{currentRun.productioncode}</span> | {currentRun.brand} -{' '}
            {currentRun.flavour}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Inspection Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {inspections.map((inspection, index) => {
              const showTempField = inspection.key === 'dryAfterWarmer';

              return (
                <div key={inspection.key}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`space-y-3 ${showTempField ? 'pb-4' : 'border-b border-border pb-6 last:border-0 last:pb-0'}`}
                  >
                    <Label className="text-base font-medium">{inspection.label}</Label>
                    <InspectionButton value={inspection.value} onChange={(value) => updateInspection(inspection.key, value)} />

                    {inspection.value === 'non-acceptable' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                        <PhotoUpload
                          value={inspection.imageUrl}
                          onChange={(value) => updateImageUrl(inspection.key, value)}
                          helperText={`Upload a photo for ${inspection.label}`}
                          previewAlt={`${inspection.label} issue`}
                        />
                      </motion.div>
                    )}
                  </motion.div>

                  {showTempField && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 0.5) * 0.05 }}
                        className="space-y-3 pb-4"
                      >
                        <Label className="text-base font-medium">TEMPERATURE AFTER WARMER (deg F)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter temperature"
                          className="max-w-xs"
                          value={temperatureAfterWarmer ?? ''}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setTemperatureAfterWarmer(event.target.value ? Number.parseFloat(event.target.value) : undefined)
                          }
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 0.6) * 0.05 }}
                        className="space-y-3 border-b border-border pb-6"
                      >
                        <Label className="text-base font-medium">CONDENSATION AFTER WARMER</Label>
                        <InspectionButton value={condensationAfterWarmer} onChange={setCondensationAfterWarmer} />
                      </motion.div>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to run setup
          </Button>
          <Button onClick={handleSubmit} disabled={createInspection.isPending} className="min-w-[200px]">
            {createInspection.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save and continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
