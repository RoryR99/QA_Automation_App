import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion } from 'motion/react';
import { CheckCircle2, Clock3, History, Lock, PackagePlus, PlayCircle, Plus, Save, Tags, TriangleAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInspectionHistory } from '@/hooks/use-inspection-history';
import { useRecentRuns } from '@/hooks/use-recent-runs';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import { addProductionRunBatchNumbers, closeProductionRun } from '@/services/production-service';
import type { CreateInspectionInput, InspectionRecord, ProductionRun, ProductionRunBatch } from '@/types/app';

const hiddenPayloadKeys = new Set([
  'hourlyinspectionname',
  'timestamp',
  'inspector',
  'inspectionType',
  'productionrunid',
  'closureMeasurements',
]);

const fieldLabelOverrides: Record<string, string> = {
  producttempf: 'Product Temperature',
  condensationKey: 'Condensation After Warmer',
  capKey: 'Closure',
  capimageurl: 'Closure Photo',
  filtecKey: 'Filtec',
  filtecimageurl: 'Filtec Photo',
  dryafterwarmerKey: 'Dry After Warmer',
  dryafterwarmerimageurl: 'Dry After Warmer Photo',
  labelalignmentKey: 'Label Alignment',
  labelalignmentimageurl: 'Label Alignment Photo',
  neckKey: 'Neck',
  neckimageurl: 'Neck Photo',
  rinserjetalignmentandpressureKey: 'Rinser Jet Alignment and Pressure',
  rinserjetalignmentandpressureimageurl: 'Rinser Jet Alignment and Pressure Photo',
  sealingsurfaceKey: 'Sealing Surface',
  sealingsurfaceimageurl: 'Sealing Surface Photo',
  securesealtestKey: 'Secure Seal Test',
  securesealtestimageurl: 'Secure Seal Test Photo',
  datecodeKey: 'Date Code',
  datecodeimageurl: 'Date Code Photo',
  stretchwrapqualityKey: 'Stretch Wrap Quality',
  stretchratio: 'Stretch Ratio',
  layerpadKey: 'Layer Pad',
  amtKey: 'AMT',
  observations: 'Observations',
  pallettagphotourl: 'Pallet Tag Photo',
  stickerphotourl: 'Case Sticker Photo',
  containmentforcetopkg: 'Containment Force Top (kg)',
  containmentforcemiddlekg: 'Containment Force Middle (kg)',
  containmentforcebottomkg: 'Containment Force Bottom (kg)',
  nonconformancestatus: 'Non-Conformance Status',
  nonconformancephotourl: 'Non-Conformance Photo',
  brand: 'Brand',
  flavor: 'Flavor',
  packsize: 'Pack Size',
  fillheight: 'Fill Height',
  brix: 'Brix',
  co2pressure: 'CO2 Pressure',
  co2temperature: 'CO2 Temperature',
  co2: 'CO2 Volume',
  ph: 'pH',
  ta: 'TA',
  vitaminc: 'Ascorbic Acid / Vitamin C',
  closuresupplier: 'Closure Supplier',
  netcompletion: 'Net Completion',
  cpandcpkcompletion: 'CP and CPK Completion',
  cipcompletion: 'CIP Completion',
  cipmethod: 'CIP Methods',
  copcompletion: 'COP Completion',
  copchemical: 'COP Chemicals',
  pallettagsKey: 'Pallet Tags',
  pallettaginfo: 'Pallet Tag Info',
  stickersKey: 'Stickers',
  stickerinfo: 'Sticker Info',
};

function humanizeKey(key: string) {
  return (
    fieldLabelOverrides[key] ??
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatInspectionType(type: string) {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isImageValue(key: string, value: string) {
  const normalizedKey = key.toLowerCase();
  return (
    (normalizedKey.endsWith('imageurl') || normalizedKey.endsWith('photourl') || normalizedKey.endsWith('photo')) &&
    (value.startsWith('data:image/') || value.startsWith('http'))
  );
}

function formatPayloadValue(key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (key.endsWith('Key') && typeof value === 'string') {
    if (value.endsWith('0')) {
      return 'Acceptable';
    }

    if (value.endsWith('1')) {
      return 'Non-acceptable';
    }
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if ('productioncode' in value && typeof value.productioncode === 'string') {
      return value.productioncode;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function getInspectionDetails(payload: CreateInspectionInput) {
  return Object.entries(payload)
    .filter(([key]) => !hiddenPayloadKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      value: formatPayloadValue(key, value),
    }))
    .filter((item) => item.value !== null);
}

function getRunSubtitle(run: ProductionRun) {
  return `${run.brand} | ${run.flavour} | ${run.packageType}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-secondary/35 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function isRunClosed(run: ProductionRun) {
  return run.status === 'closed';
}

function PhotoRow({ label, src }: { label: string; src: string }) {
  return (
    <div className="rounded-2xl bg-secondary/35 px-4 py-3 text-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">Uploaded photo</span>
      </div>
      <img src={src} alt={label} className="h-40 w-full rounded-2xl object-cover md:h-52" />
    </div>
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  const currentRun = useAtomValue(currentProductionRunAtom);
  const setCurrentRun = useSetAtom(currentProductionRunAtom);
  const queryClient = useQueryClient();
  const { data: history, isLoading: historyLoading } = useInspectionHistory();
  const { data: runs, isLoading: runsLoading } = useRecentRuns();
  const [batchEditors, setBatchEditors] = useState<Record<string, string[]>>({});
  const [expandedBatchRunId, setExpandedBatchRunId] = useState<string | null>(null);

  const isLoading = historyLoading || runsLoading;

  const runsById = useMemo(() => new Map((runs ?? []).map((run) => [run.id, run])), [runs]);

  const resumeRun = (run: ProductionRun) => {
    if (isRunClosed(run)) {
      toast.error('This production run is closed. No new checks can be added.');
      return;
    }

    setCurrentRun(run);
    navigate('/primary-packaging');
  };

  const closeRun = useMutation({
    mutationFn: closeProductionRun,
    onSuccess: (closedRun) => {
      queryClient.setQueryData<ProductionRun[]>(['recent-runs'], (existing) =>
        (existing ?? []).map((run) => (run.id === closedRun.id ? closedRun : run)),
      );

      if (currentRun?.id === closedRun.id) {
        setCurrentRun(null);
      }

      toast.success('Production run closed');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to close production run');
    },
  });

  const addBatchNumbers = useMutation({
    mutationFn: ({ productionRunId, batchNumbers }: { productionRunId: string; batchNumbers: string[] }) =>
      addProductionRunBatchNumbers(productionRunId, batchNumbers),
    onSuccess: (createdBatches, variables) => {
      queryClient.setQueryData<ProductionRun[]>(['recent-runs'], (existing) =>
        (existing ?? []).map((run) => {
          if (run.id !== variables.productionRunId) {
            return run;
          }

          const existingBatches = run.batchNumbers ?? [];
          const knownBatchNumbers = new Set(existingBatches.map((batch) => batch.batchNumber));
          const newBatches = createdBatches.filter((batch) => !knownBatchNumbers.has(batch.batchNumber));

          return {
            ...run,
            batchNumbers: [...existingBatches, ...newBatches],
          };
        }),
      );
      setBatchEditors((prev) => ({ ...prev, [variables.productionRunId]: [''] }));
      toast.success('Batch numbers added');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to add batch numbers');
    },
  });

  const toggleBatchEditor = (run: ProductionRun) => {
    setExpandedBatchRunId((current) => (current === run.id ? null : run.id));
    setBatchEditors((prev) => ({
      ...prev,
      [run.id]: prev[run.id] ?? [''],
    }));
  };

  const updateBatchEditorValue = (runId: string, index: number, value: string) => {
    setBatchEditors((prev) => ({
      ...prev,
      [runId]: (prev[runId] ?? ['']).map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addBatchEditorRow = (runId: string) => {
    setBatchEditors((prev) => ({
      ...prev,
      [runId]: [...(prev[runId] ?? ['']), ''],
    }));
  };

  const removeBatchEditorRow = (runId: string, index: number) => {
    setBatchEditors((prev) => {
      const nextValues = (prev[runId] ?? ['']).filter((_, itemIndex) => itemIndex !== index);

      return {
        ...prev,
        [runId]: nextValues.length > 0 ? nextValues : [''],
      };
    });
  };

  const submitBatchNumbers = (event: FormEvent<HTMLFormElement>, run: ProductionRun) => {
    event.preventDefault();

    if (isRunClosed(run)) {
      toast.error('Batch numbers cannot be added to a closed production run.');
      return;
    }

    const existingBatchNumbers = new Set((run.batchNumbers ?? []).map((batch) => batch.batchNumber.toLowerCase()));
    const batchNumbers = Array.from(
      new Set(
        (batchEditors[run.id] ?? [])
          .map((value) => value.trim())
          .filter((value) => value && !existingBatchNumbers.has(value.toLowerCase())),
      ),
    );

    if (batchNumbers.length === 0) {
      toast.error('Enter at least one new batch number.');
      return;
    }

    addBatchNumbers.mutate({ productionRunId: run.id, batchNumbers });
  };

  const findClosureMeasurements = (inspection: InspectionRecord) => {
    const value = inspection.payload.closureMeasurements;
    return Array.isArray(value) ? value : [];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <History className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-4xl font-semibold">Inspection History</h1>
          </div>
          <p className="text-muted-foreground">
            Reopen old production runs and review exactly what was entered for each inspection.
          </p>
        </div>
        <Button onClick={() => navigate(currentRun ? '/primary-packaging' : '/')}>
          <PackagePlus className="h-4 w-4" />
          {currentRun ? 'Resume current run' : 'Start a run'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Runs</CardTitle>
          <CardDescription>Select any production run to add a fresh primary, secondary, and specs inspection for it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Loading run history...
            </div>
          ) : runs && runs.length > 0 ? (
            runs.map((run, index) => {
              const isActive = currentRun?.id === run.id;
              const closed = isRunClosed(run);
              const batchValues = batchEditors[run.id] ?? [''];
              const existingBatches = run.batchNumbers ?? [];

              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-[1.5rem] border border-border/80 bg-white/75 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Production Run
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{run.productioncode}</h3>
                      <p className="text-sm text-muted-foreground">{getRunSubtitle(run)}</p>
                      <p className="text-sm text-muted-foreground">
                        Line {run.line} | {run.shift} | Created {new Date(run.createdAt).toLocaleString()}
                      </p>
                      {closed && run.closedAt ? (
                        <p className="text-sm font-medium text-muted-foreground">Closed {new Date(run.closedAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      {isActive && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      )}
                      {closed ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                          <Lock className="h-4 w-4" />
                          Closed
                        </span>
                      ) : null}
                      <Button variant="outline" onClick={() => toggleBatchEditor(run)}>
                        <Tags className="h-4 w-4" />
                        Batch numbers
                      </Button>
                      {!closed ? (
                        <Button
                          variant="outline"
                          onClick={() => closeRun.mutate(run.id)}
                          disabled={closeRun.isPending}
                        >
                          <Lock className="h-4 w-4" />
                          Close run
                        </Button>
                      ) : null}
                      <Button onClick={() => resumeRun(run)} disabled={closed}>
                        <PlayCircle className="h-4 w-4" />
                        Add new checks
                      </Button>
                    </div>
                  </div>

                  {(existingBatches.length > 0 || expandedBatchRunId === run.id) && (
                    <div className="mt-5 space-y-4 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <div>
                        <div className="mb-2 text-sm font-semibold text-foreground">Batch numbers</div>
                        {existingBatches.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {existingBatches.map((batch: ProductionRunBatch) => (
                              <span
                                key={batch.id}
                                className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-foreground shadow-sm"
                              >
                                {batch.batchNumber}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No batch numbers have been added yet.</p>
                        )}
                      </div>

                      {expandedBatchRunId === run.id && !closed ? (
                        <form onSubmit={(event) => submitBatchNumbers(event, run)} className="space-y-3">
                          <Label>New batch numbers</Label>
                          <div className="grid gap-3 md:grid-cols-2">
                            {batchValues.map((value, batchIndex) => (
                              <div key={`${run.id}-batch-${batchIndex}`} className="flex gap-2">
                                <Input
                                  value={value}
                                  onChange={(event) => updateBatchEditorValue(run.id, batchIndex, event.target.value)}
                                  placeholder={`Batch number ${batchIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBatchEditorRow(run.id, batchIndex)}
                                  aria-label="Remove batch number"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button type="button" variant="outline" onClick={() => addBatchEditorRow(run.id)}>
                              <Plus className="h-4 w-4" />
                              Add another
                            </Button>
                            <Button type="submit" disabled={addBatchNumbers.isPending}>
                              <Save className="h-4 w-4" />
                              Save batches
                            </Button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No production runs recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved submissions</CardTitle>
          <CardDescription>
            Each inspection now shows the actual statuses, notes, values, and uploaded photos that were entered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Loading inspection history...
            </div>
          ) : history && history.length > 0 ? (
            history.map((entry, index) => {
              const run = runsById.get(entry.payload.productionrunid.id);
              const details = getInspectionDetails(entry.payload);
              const photoDetails = details.filter(
                (detail) => typeof detail.value === 'string' && isImageValue(detail.key, detail.value),
              );
              const textDetails = details.filter(
                (detail) => !(typeof detail.value === 'string' && isImageValue(detail.key, detail.value)),
              );
              const measurements = findClosureMeasurements(entry);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-[1.5rem] border border-border/80 bg-white/75 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {formatInspectionType(entry.inspectionType)}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {String(entry.payload.hourlyinspectionname)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Run {entry.payload.productionrunid.productioncode} | Inspector {entry.payload.inspector}
                      </p>
                      {run && <p className="mt-1 text-sm text-muted-foreground">{getRunSubtitle(run)}</p>}
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                        <Clock3 className="h-4 w-4" />
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      {run && (
                        <Button variant="outline" size="sm" onClick={() => resumeRun(run)}>
                          <PlayCircle className="h-4 w-4" />
                          Reuse this run
                        </Button>
                      )}
                    </div>
                  </div>

                  {textDetails.length > 0 && (
                    <div className="mt-5 grid gap-3">
                      {textDetails.map((detail) => (
                        <DetailRow key={`${entry.id}-${detail.key}`} label={detail.label} value={detail.value as string} />
                      ))}
                    </div>
                  )}

                  {photoDetails.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="text-sm font-semibold text-foreground">Photo evidence</div>
                      <div className="grid gap-3">
                        {photoDetails.map((detail) => (
                          <PhotoRow key={`${entry.id}-${detail.key}`} label={detail.label} src={detail.value as string} />
                        ))}
                      </div>
                    </div>
                  )}

                  {measurements.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="text-sm font-semibold text-foreground">Closure measurements</div>
                      <div className="grid gap-3">
                        {measurements.map((measurement, measurementIndex) => (
                          <div key={`${entry.id}-closure-${measurementIndex}`} className="rounded-2xl bg-secondary/35 p-4 text-sm">
                            <div className="mb-2 font-medium text-foreground">
                              Measurement {formatPayloadValue('measurementnumber', measurement.measurementnumber) ?? measurementIndex + 1}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <DetailRow label="Application Angle" value={String(measurement.applicationangle ?? '')} />
                              <DetailRow label="Removal Torque" value={String(measurement.removaltorque ?? '')} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {textDetails.length === 0 && photoDetails.length === 0 && measurements.length === 0 && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
                      <TriangleAlert className="h-4 w-4" />
                      No detailed fields were found for this entry.
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No inspections have been recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
