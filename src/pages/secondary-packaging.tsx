import { ChangeEvent, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, Layers, Loader2 } from 'lucide-react';

import { InspectionButton } from '@/components/inspection-button';
import { PhotoUpload } from '@/components/photo-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateInspection } from '@/hooks/use-create-inspection';
import { useUser } from '@/hooks/use-user';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import type { InspectionValue } from '@/types/app';

type NonConformanceStatus = 'completed' | 'not-completed';

export function SecondaryPackagingPage() {
  const navigate = useNavigate();
  const currentRun = useAtomValue(currentProductionRunAtom);
  const createInspection = useCreateInspection();
  const { data: user } = useUser();

  const [formData, setFormData] = useState({
    stretchWrapQuality: undefined as InspectionValue | undefined,
    stretchRatio: undefined as number | undefined,
    layerPad: undefined as InspectionValue | undefined,
    amt: undefined as InspectionValue | undefined,
    palletTags: undefined as InspectionValue | undefined,
    palletTagInfo: '',
    palletTagPhotoUrl: '',
    stickers: undefined as InspectionValue | undefined,
    stickerInfo: '',
    stickerPhotoUrl: '',
    observations: '',
    containmentForceTop: undefined as number | undefined,
    containmentForceMiddle: undefined as number | undefined,
    containmentForceBottom: undefined as number | undefined,
    nonConformanceStatus: undefined as NonConformanceStatus | undefined,
    nonConformancePhotoUrl: '',
  });

  const handleSubmit = async () => {
    if (!currentRun) {
      toast.error('No active production run');
      return;
    }

    const requiredFields = [
      { key: 'stretchWrapQuality', label: 'Stretch Wrap Quality' },
      { key: 'layerPad', label: 'Layer Pad' },
      { key: 'amt', label: 'Amount of Layer Pads per Pallet' },
      { key: 'palletTags', label: 'Pallet Tag Verification' },
      { key: 'stickers', label: 'Case Sticker Verification' },
    ] as const;

    const incomplete = requiredFields.filter((field) => formData[field.key] === undefined);
    if (incomplete.length > 0) {
      toast.error(`Please complete: ${incomplete.map((field) => field.label).join(', ')}`);
      return;
    }

    try {
      await createInspection.mutateAsync({
        hourlyinspectionname: `Secondary Packaging - ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        inspector: user?.userPrincipalName ?? 'Unknown',
        inspectionType: 'secondary-packaging',
        productionrunid: { id: currentRun.id, productioncode: currentRun.productioncode },
        stretchwrapqualityKey:
          formData.stretchWrapQuality === 'acceptable' ? 'Stretchwrapqualitykey0' : 'Stretchwrapqualitykey1',
        stretchratio: formData.stretchRatio,
        layerpadKey: formData.layerPad === 'acceptable' ? 'Layerpadkey0' : 'Layerpadkey1',
        amtKey: formData.amt === 'acceptable' ? 'Amtkey0' : 'Amtkey1',
        observations: formData.observations,
        pallettagsKey: formData.palletTags === 'acceptable' ? 'Pallettagskey0' : 'Pallettagskey1',
        pallettaginfo: formData.palletTagInfo || undefined,
        pallettagphotourl: formData.palletTagPhotoUrl || undefined,
        stickersKey:
          formData.stickers === 'acceptable'
            ? 'Stickerskey0'
            : formData.stickers === 'not-applicable'
              ? 'Stickerskey2'
              : 'Stickerskey1',
        stickerinfo: formData.stickerInfo || undefined,
        stickerphotourl: formData.stickerPhotoUrl || undefined,
        containmentforcetopkg: formData.containmentForceTop,
        containmentforcemiddlekg: formData.containmentForceMiddle,
        containmentforcebottomkg: formData.containmentForceBottom,
        nonconformancestatus: formData.nonConformanceStatus,
        nonconformancephotourl: formData.nonConformancePhotoUrl || undefined,
      });

      toast.success('Secondary packaging inspection saved');

      navigate('/product-specs');
    } catch {
      toast.error('Failed to save inspection');
    }
  };

  if (!currentRun) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 text-center">
          <Layers className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
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
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl font-semibold text-foreground">Secondary Packaging</h1>
          </div>
          <p className="text-muted-foreground">
            Run: <span className="font-medium text-foreground">{currentRun.productioncode}</span> | {currentRun.brand} -{' '}
            {currentRun.flavour}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Packaging Quality Checks</CardTitle>
              <CardDescription>Inspect each aspect of secondary packaging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 border-b border-border pb-6">
                <Label className="text-base font-medium">Stretch Wrap Quality</Label>
                <InspectionButton
                  value={formData.stretchWrapQuality}
                  onChange={(value) => setFormData((prev) => ({ ...prev, stretchWrapQuality: value }))}
                />
              </div>

              <div className="space-y-3 border-b border-border pb-6">
                <Label className="text-base font-medium">Stretch Ratio (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter stretch ratio"
                  className="max-w-xs"
                  value={formData.stretchRatio ?? ''}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      stretchRatio: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                    }))
                  }
                />
              </div>

              <div className="space-y-3 border-b border-border pb-6">
                <Label className="text-base font-medium">Layer Pad</Label>
                <InspectionButton
                  value={formData.layerPad}
                  onChange={(value) => setFormData((prev) => ({ ...prev, layerPad: value }))}
                />
              </div>

              <div className="space-y-3 border-b border-border pb-6">
                <Label className="text-base font-medium">Amount of Layer Pads per Pallet</Label>
                <InspectionButton value={formData.amt} onChange={(value) => setFormData((prev) => ({ ...prev, amt: value }))} />
              </div>

              <div className="space-y-3 border-b border-border pb-6">
                <Label className="text-base font-medium">Pallet Tag Verification</Label>
                <InspectionButton
                  value={formData.palletTags}
                  onChange={(value) => setFormData((prev) => ({ ...prev, palletTags: value }))}
                />
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Pallet Tag Info</Label>
                  <Input
                    placeholder="Enter pallet tag details..."
                    className="mt-1.5"
                    value={formData.palletTagInfo}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, palletTagInfo: event.target.value }))
                    }
                  />
                </div>
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Pallet Tag Photo</Label>
                  <div className="mt-1.5">
                    <PhotoUpload
                      value={formData.palletTagPhotoUrl || undefined}
                      onChange={(value) => setFormData((prev) => ({ ...prev, palletTagPhotoUrl: value ?? '' }))}
                      helperText="Upload a photo of the pallet tag"
                      buttonLabel="Upload pallet tag"
                      replaceLabel="Replace pallet tag"
                      previewAlt="Pallet tag"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Case Sticker Verification</Label>
                <InspectionButton
                  value={formData.stickers}
                  onChange={(value) => setFormData((prev) => ({ ...prev, stickers: value }))}
                  allowNotApplicable
                />
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Sticker Info</Label>
                  <Input
                    placeholder="Enter sticker details..."
                    className="mt-1.5"
                    value={formData.stickerInfo}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, stickerInfo: event.target.value }))
                    }
                  />
                </div>
                <div className="mt-3">
                  <Label className="text-sm text-muted-foreground">Case Sticker Photo</Label>
                  <div className="mt-1.5">
                    <PhotoUpload
                      value={formData.stickerPhotoUrl || undefined}
                      onChange={(value) => setFormData((prev) => ({ ...prev, stickerPhotoUrl: value ?? '' }))}
                      helperText="Upload a photo of the case sticker"
                      buttonLabel="Upload case sticker"
                      replaceLabel="Replace case sticker"
                      previewAlt="Case sticker"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Containment Force</CardTitle>
              <CardDescription>Measure containment force at three levels (kg).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-base font-medium">Top (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.containmentForceTop ?? ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      containmentForceTop: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Middle (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.containmentForceMiddle ?? ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      containmentForceMiddle: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Bottom (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.containmentForceBottom ?? ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      containmentForceBottom: event.target.value ? Number.parseFloat(event.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Non-Conformance Completion</CardTitle>
              <CardDescription>Record completion status and photo evidence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Completion Status</Label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={formData.nonConformanceStatus === 'completed' ? 'default' : 'outline'}
                    className={formData.nonConformanceStatus === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    onClick={() => setFormData((prev) => ({ ...prev, nonConformanceStatus: 'completed' }))}
                  >
                    Completed
                  </Button>
                  <Button
                    type="button"
                    variant={formData.nonConformanceStatus === 'not-completed' ? 'default' : 'outline'}
                    className={
                      formData.nonConformanceStatus === 'not-completed' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
                    }
                    onClick={() => setFormData((prev) => ({ ...prev, nonConformanceStatus: 'not-completed' }))}
                  >
                    Not Completed
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Non-Conformance Photo</Label>
                <PhotoUpload
                  value={formData.nonConformancePhotoUrl || undefined}
                  onChange={(value) => setFormData((prev) => ({ ...prev, nonConformancePhotoUrl: value ?? '' }))}
                  helperText="Upload non-conformance evidence"
                  buttonLabel="Upload evidence"
                  replaceLabel="Replace evidence"
                  previewAlt="Non-conformance evidence"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any observations or notes..."
                rows={4}
                value={formData.observations}
                onChange={(event) => setFormData((prev) => ({ ...prev, observations: event.target.value }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/primary-packaging')}>
            Back to primary packaging
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createInspection.isPending}
            className="min-w-[200px]"
          >
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
