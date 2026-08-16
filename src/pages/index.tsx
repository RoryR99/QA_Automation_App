import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { motion } from 'motion/react';
import { Factory, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PhotoUpload } from '@/components/photo-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBeverageQualityMeasurementList } from '@/hooks/use-beverage-quality-measurement-list';
import { useRecentRuns } from '@/hooks/use-recent-runs';
import { useUser } from '@/hooks/use-user';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import { createProductionRun } from '@/services/production-service';
import type { ProductionRun, ProductionRunShiftKey, StartRunInput } from '@/types/app';

const shiftOptions: Array<{ key: ProductionRunShiftKey; label: string }> = [
  { key: 'Shiftkey0', label: 'Shift A' },
  { key: 'Shiftkey1', label: 'Shift B' },
  { key: 'Shiftkey2', label: 'Shift C' },
];

const lineNumberOptions = ['1', '2', '3', '4', '6', '8', '10'];

const qaTechnicianById: Record<string, string> = {
  '1191': 'RAKESH BOODLAL',
  '11536': 'VALINI DEHU',
  '11816': 'NIKOLI MITCHELL',
  '12406': 'AMEER KARIM',
  '2603': 'LESTER PATTERSON',
  '14949': 'SARITA NAGESSAR',
  '14891': 'BRANDON CHANG-NOEL',
  '8216': 'ERBERT POLO',
  '13724': 'JIMMEL MCCREE',
  '13539': 'JONATHAN JHAGROO',
  '14983': 'ZAUFEER HOSEIN',
  '14902': 'RHONDA SMITH',
  '9225': 'JUNIOR BALDEO',
  '14656': 'AHMID SHAH',
  '14793': 'DEBBIE SAMSUNDAR',
  '14950': 'AKASH RAMROOP',
  '15063': 'DEMALIA ELBOURNE',
  '9678': 'KERRY JAIKARAN',
  '9179': 'RONDELL MOHAMMED',
  '7378': 'SANGEET DOOKIE',
  '13690': 'CELINE DEHU',
  '15041': 'MICHELE GAYAPERSAD',
  '1352': 'DINESH MAHARAJ',
  '14982': 'RUTH BETHEL',
};

const cipMethodLabels = {
  recirculation: 'Recirculation',
  flush: 'Flush',
  sanitize: 'Sanitize',
} as const;

const copChemicalLabels = {
  caustic: 'Caustic',
  acid: 'Acid',
  sanitizer: 'Sanitizer',
} as const;

type CipMethod = keyof typeof cipMethodLabels;
type CopChemical = keyof typeof copChemicalLabels;

interface RunFormState {
  mfgDate: string;
  linenumber: string;
  brand: string;
  flavour: string;
  shiftKey: ProductionRunShiftKey | '';
  productionsupervisor: string;
  qashiftsupervisor: string;
  qatechnician: string;
  shrinkwrapoperator: string;
  filleroperator: string;
  labeloperator: string;
  package1: string;
  epicorproduction: string;
  epicorsyrup: string;
  description: string;
  planner: string;
  uniqueinspectorid: string;
  bbdate: string;
  mes: boolean;
  jobtransfer: boolean;
  local: boolean;
  export: boolean;
  labelsamplephoto: string;
  codeverificationphoto: string;
  cipcompletion: boolean;
  cipmethod: CipMethod[];
  copcompletion: boolean;
  copchemical: CopChemical[];
}

type FormErrors = Partial<Record<keyof RunFormState, string>>;

function buildInitialForm(): RunFormState {
  return {
    mfgDate: new Date().toISOString().slice(0, 10),
    linenumber: '',
    brand: '',
    flavour: '',
    shiftKey: '',
    productionsupervisor: '',
    qashiftsupervisor: '',
    qatechnician: '',
    shrinkwrapoperator: '',
    filleroperator: '',
    labeloperator: '',
    package1: '',
    epicorproduction: '',
    epicorsyrup: '',
    description: '',
    planner: '',
    uniqueinspectorid: '',
    bbdate: '',
    mes: false,
    jobtransfer: false,
    local: false,
    export: false,
    labelsamplephoto: '',
    codeverificationphoto: '',
    cipcompletion: false,
    cipmethod: [],
    copcompletion: false,
    copchemical: [],
  };
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getShiftLabel(shiftKey: ProductionRunShiftKey) {
  return shiftOptions.find((option) => option.key === shiftKey)?.label ?? shiftKey;
}

function toggleArrayValue<T extends string>(values: T[], value: T, checked: boolean) {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }

  return values.filter((item) => item !== value);
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
      />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

export function IndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setCurrentRun = useSetAtom(currentProductionRunAtom);
  const { data: recentRuns } = useRecentRuns();
  const { data: user } = useUser();
  const {
    data: beverageQualityMeasurements,
    isLoading: isLoadingSpecOptions,
    isError: isSpecOptionsError,
  } = useBeverageQualityMeasurementList();
  const [form, setForm] = useState<RunFormState>(buildInitialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandOptions = Array.from(new Set((beverageQualityMeasurements ?? []).map((item) => item.brand))).sort((left, right) =>
    left.localeCompare(right),
  );

  const flavourOptions = Array.from(
    new Set(
      (beverageQualityMeasurements ?? [])
        .filter((item) => item.brand === form.brand)
        .map((item) => item.flavor),
    ),
  ).sort((left, right) => left.localeCompare(right));

  useEffect(() => {
    if (!form.brand) {
      return;
    }

    const brandStillExists = brandOptions.includes(form.brand);
    if (!brandStillExists) {
      setForm((prev) => ({ ...prev, brand: '', flavour: '' }));
      return;
    }

    if (form.flavour && !flavourOptions.includes(form.flavour)) {
      setForm((prev) => ({ ...prev, flavour: '' }));
    }
  }, [brandOptions, flavourOptions, form.brand, form.flavour]);

  const handleFieldChange = <K extends keyof RunFormState>(key: K, value: RunFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleQaTechnicianIdChange = (value: string) => {
    const nextId = value.replace(/\D/g, '');
    const technicianName = qaTechnicianById[nextId] ?? '';

    setForm((prev) => ({
      ...prev,
      uniqueinspectorid: nextId,
      qatechnician: technicianName,
    }));
    setErrors((prev) => ({ ...prev, uniqueinspectorid: undefined, qatechnician: undefined }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.mfgDate) {
      nextErrors.mfgDate = 'MFG Date is required.';
    }

    if (!form.linenumber.trim()) {
      nextErrors.linenumber = 'Line Number is required.';
    }

    if (!form.brand) {
      nextErrors.brand = 'Brand is required.';
    }

    if (!form.flavour) {
      nextErrors.flavour = 'Flavour is required.';
    }

    if (!form.shiftKey) {
      nextErrors.shiftKey = 'Shift is required.';
    }

    if (!form.productionsupervisor.trim()) {
      nextErrors.productionsupervisor = 'Production Supervisor is required.';
    }

    if (!form.uniqueinspectorid.trim()) {
      nextErrors.uniqueinspectorid = 'QA Technician ID is required.';
    } else if (!qaTechnicianById[form.uniqueinspectorid.trim()]) {
      nextErrors.uniqueinspectorid = 'Enter a valid QA Technician ID.';
    }

    if (!form.qatechnician.trim()) {
      nextErrors.qatechnician = 'QA Technician is required.';
    }

    if (form.cipcompletion && form.cipmethod.length === 0) {
      nextErrors.cipmethod = 'Select at least one CIP method.';
    }

    if (form.copcompletion && form.copchemical.length === 0) {
      nextErrors.copchemical = 'Select at least one COP chemical.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mergeRunResponse = (run: ProductionRun, payload: StartRunInput): ProductionRun => {
    return {
      ...run,
      brand: payload.brand,
      flavour: payload.flavour,
      packageType: payload.packageType,
      line: payload.line,
      shift: payload.shift,
      mfgDate: payload.mfgDate,
      bbdate: payload.bbdate,
      linenumber: payload.linenumber,
      shiftKey: payload.shiftKey,
      productionsupervisor: payload.productionsupervisor,
      qashiftsupervisor: payload.qashiftsupervisor,
      qatechnician: payload.qatechnician,
      shrinkwrapoperator: payload.shrinkwrapoperator,
      filleroperator: payload.filleroperator,
      labeloperator: payload.labeloperator,
      epicorproduction: payload.epicorproduction,
      epicorsyrup: payload.epicorsyrup,
      description: payload.description,
      planner: payload.planner,
      uniqueinspectorid: payload.uniqueinspectorid,
      mes: payload.mes,
      jobtransfer: payload.jobtransfer,
      local: payload.local,
      export: payload.export,
      labelsamplephoto: payload.labelsamplephoto,
      codeverificationphoto: payload.codeverificationphoto,
      cipcompletion: payload.cipcompletion,
      cipmethod: payload.cipmethod,
      copcompletion: payload.copcompletion,
      copchemical: payload.copchemical,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error('Please complete the required production run fields.');
      return;
    }

    const shiftKey = form.shiftKey as ProductionRunShiftKey;
    const payload: StartRunInput = {
      mfgDate: form.mfgDate,
      linenumber: form.linenumber.trim(),
      line: form.linenumber.trim(),
      brand: form.brand,
      flavour: form.flavour,
      shiftKey,
      shift: getShiftLabel(shiftKey),
      productionsupervisor: form.productionsupervisor.trim(),
      qatechnician: form.qatechnician.trim(),
      packageType: optionalValue(form.package1) ?? 'Unspecified package',
      ...(optionalValue(form.qashiftsupervisor) && { qashiftsupervisor: optionalValue(form.qashiftsupervisor) }),
      ...(optionalValue(form.shrinkwrapoperator) && { shrinkwrapoperator: optionalValue(form.shrinkwrapoperator) }),
      ...(optionalValue(form.filleroperator) && { filleroperator: optionalValue(form.filleroperator) }),
      ...(optionalValue(form.labeloperator) && { labeloperator: optionalValue(form.labeloperator) }),
      ...(optionalValue(form.package1) && { package1: optionalValue(form.package1) }),
      ...(optionalValue(form.epicorproduction) && { epicorproduction: optionalValue(form.epicorproduction) }),
      ...(optionalValue(form.epicorsyrup) && { epicorsyrup: optionalValue(form.epicorsyrup) }),
      ...(optionalValue(form.description) && { description: optionalValue(form.description) }),
      ...(optionalValue(form.planner) && { planner: optionalValue(form.planner) }),
      ...(optionalValue(form.uniqueinspectorid) && { uniqueinspectorid: optionalValue(form.uniqueinspectorid) }),
      ...(form.bbdate && { bbdate: form.bbdate }),
      ...(form.mes && { mes: true }),
      ...(form.jobtransfer && { jobtransfer: true }),
      ...(form.local && { local: true }),
      ...(form.export && { export: true }),
      ...(form.labelsamplephoto && { labelsamplephoto: form.labelsamplephoto }),
      ...(form.codeverificationphoto && { codeverificationphoto: form.codeverificationphoto }),
      ...(form.cipcompletion && { cipcompletion: true }),
      ...(form.cipcompletion && form.cipmethod.length > 0 && {
        cipmethod: form.cipmethod.map((method) => cipMethodLabels[method]),
      }),
      ...(form.copcompletion && { copcompletion: true }),
      ...(form.copcompletion && form.copchemical.length > 0 && {
        copchemical: form.copchemical.map((chemical) => copChemicalLabels[chemical]),
      }),
    };

    try {
      setIsSubmitting(true);
      const createdRun = await createProductionRun(payload);
      const mergedRun = mergeRunResponse(createdRun, payload);

      setCurrentRun(mergedRun);
      queryClient.setQueryData<ProductionRun[]>(['recent-runs'], (existing) => {
        const remaining = (existing ?? []).filter((item) => item.id !== mergedRun.id);
        return [mergedRun, ...remaining];
      });

      toast.success('Production run started');
      navigate('/primary-packaging');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start the production run';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (field: keyof RunFormState) => {
    const message = errors[field];

    if (!message) {
      return null;
    }

    return <p className="text-sm text-destructive">{message}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-semibold text-foreground">New Production Run</h1>
            <p className="text-muted-foreground">
              {user ? `Welcome, ${user.displayName}. ` : ''}Set up the run details before moving into inspections.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
            <CardDescription>Choose the line, product, shift, and key dates for this production run.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="linenumber">Line Number *</Label>
              <Select
                id="linenumber"
                value={form.linenumber}
                onChange={(event) => handleFieldChange('linenumber', event.target.value)}
              >
                <option value="">Select line number</option>
                {lineNumberOptions.map((lineNumber) => (
                  <option key={lineNumber} value={lineNumber}>
                    {lineNumber}
                  </option>
                ))}
              </Select>
              {renderError('linenumber')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shiftKey">Shift *</Label>
              <Select
                id="shiftKey"
                value={form.shiftKey}
                onChange={(event) => handleFieldChange('shiftKey', event.target.value as ProductionRunShiftKey | '')}
              >
                <option value="">Select shift</option>
                {shiftOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {renderError('shiftKey')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Select
                id="brand"
                value={form.brand}
                onChange={(event) => handleFieldChange('brand', event.target.value)}
                disabled={isLoadingSpecOptions || brandOptions.length === 0}
              >
                <option value="">
                  {isLoadingSpecOptions ? 'Loading brands...' : brandOptions.length === 0 ? 'No brands available' : 'Select brand'}
                </option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>
              {isSpecOptionsError ? <p className="text-sm text-destructive">Unable to load brand options from beverage quality specs.</p> : null}
              {renderError('brand')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flavour">Flavour *</Label>
              <Select
                id="flavour"
                value={form.flavour}
                onChange={(event) => handleFieldChange('flavour', event.target.value)}
                disabled={!form.brand || isLoadingSpecOptions || flavourOptions.length === 0}
              >
                <option value="">
                  {!form.brand
                    ? 'Select brand first'
                    : isLoadingSpecOptions
                      ? 'Loading flavours...'
                      : flavourOptions.length === 0
                        ? 'No flavours available'
                        : 'Select flavour'}
                </option>
                {flavourOptions.map((flavour) => (
                  <option key={flavour} value={flavour}>
                    {flavour}
                  </option>
                ))}
              </Select>
              {renderError('flavour')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bbdate">Best Before Date</Label>
              <Input
                id="bbdate"
                type="date"
                value={form.bbdate}
                onChange={(event) => handleFieldChange('bbdate', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfgDate">MFG Date *</Label>
              <Input
                id="mfgDate"
                type="date"
                value={form.mfgDate}
                onChange={(event) => handleFieldChange('mfgDate', event.target.value)}
              />
              {renderError('mfgDate')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Personnel</CardTitle>
            <CardDescription>Capture the core team supporting this run.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="uniqueinspectorid">QA Technician ID *</Label>
              <Input
                id="uniqueinspectorid"
                value={form.uniqueinspectorid}
                onChange={(event) => handleQaTechnicianIdChange(event.target.value)}
                placeholder="Enter ID"
                inputMode="numeric"
                list="qa-technician-ids"
              />
              <datalist id="qa-technician-ids">
                {Object.keys(qaTechnicianById).map((technicianId) => (
                  <option key={technicianId} value={technicianId} />
                ))}
              </datalist>
              {renderError('uniqueinspectorid')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qatechnician">QA Technician Name *</Label>
              <Input
                id="qatechnician"
                value={form.qatechnician}
                readOnly
                placeholder="Auto-filled from ID"
              />
              {renderError('qatechnician')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionsupervisor">Production Supervisor *</Label>
              <Input
                id="productionsupervisor"
                value={form.productionsupervisor}
                onChange={(event) => handleFieldChange('productionsupervisor', event.target.value)}
                placeholder="Enter name"
              />
              {renderError('productionsupervisor')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qashiftsupervisor">QA Shift Supervisor</Label>
              <Input
                id="qashiftsupervisor"
                value={form.qashiftsupervisor}
                onChange={(event) => handleFieldChange('qashiftsupervisor', event.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shrinkwrapoperator">Shrinkwrap Operator</Label>
              <Input
                id="shrinkwrapoperator"
                value={form.shrinkwrapoperator}
                onChange={(event) => handleFieldChange('shrinkwrapoperator', event.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filleroperator">Filler Operator</Label>
              <Input
                id="filleroperator"
                value={form.filleroperator}
                onChange={(event) => handleFieldChange('filleroperator', event.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labeloperator">Label Operator</Label>
              <Input
                id="labeloperator"
                value={form.labeloperator}
                onChange={(event) => handleFieldChange('labeloperator', event.target.value)}
                placeholder="Enter name"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Additional Details</CardTitle>
            <CardDescription>Add package, planning, system-completion, and photo details for the run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="package1">Package Size</Label>
                <Input
                  id="package1"
                  value={form.package1}
                  onChange={(event) => handleFieldChange('package1', event.target.value)}
                  placeholder="Enter package size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="epicorproduction">Epicor Production</Label>
                <Input
                  id="epicorproduction"
                  value={form.epicorproduction}
                  onChange={(event) => handleFieldChange('epicorproduction', event.target.value)}
                  placeholder="Enter production number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="epicorsyrup">Epicor Syrup</Label>
                <Input
                  id="epicorsyrup"
                  value={form.epicorsyrup}
                  onChange={(event) => handleFieldChange('epicorsyrup', event.target.value)}
                  placeholder="Enter syrup number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', event.target.value)}
                placeholder="Enter any additional notes..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Label className="text-base font-medium">CIP Completion</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Has Clean-In-Place process been completed?</p>
                  </div>
                  <Select
                    value={form.cipcompletion ? 'yes' : 'no'}
                    onChange={(event) => {
                      const enabled = event.target.value === 'yes';
                      handleFieldChange('cipcompletion', enabled);
                      if (!enabled) {
                        handleFieldChange('cipmethod', []);
                      }
                    }}
                    className="w-full md:w-24"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                {form.cipcompletion && (
                  <div className="space-y-3 border-l-2 border-primary/30 pl-4">
                    <Label className="text-sm">CIP Methods</Label>
                    <div className="grid gap-3">
                      {Object.entries(cipMethodLabels).map(([key, label]) => (
                        <CheckboxField
                          key={key}
                          id={`cipmethod-${key}`}
                          label={label}
                          checked={form.cipmethod.includes(key as CipMethod)}
                          onChange={(checked) =>
                            handleFieldChange('cipmethod', toggleArrayValue(form.cipmethod, key as CipMethod, checked))
                          }
                        />
                      ))}
                    </div>
                    {renderError('cipmethod')}
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Label className="text-base font-medium">COP Completion</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Has Clean-Out-of-Place process been completed?</p>
                  </div>
                  <Select
                    value={form.copcompletion ? 'yes' : 'no'}
                    onChange={(event) => {
                      const enabled = event.target.value === 'yes';
                      handleFieldChange('copcompletion', enabled);
                      if (!enabled) {
                        handleFieldChange('copchemical', []);
                      }
                    }}
                    className="w-full md:w-24"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                {form.copcompletion && (
                  <div className="space-y-3 border-l-2 border-primary/30 pl-4">
                    <Label className="text-sm">COP Chemicals</Label>
                    <div className="grid gap-3">
                      {Object.entries(copChemicalLabels).map(([key, label]) => (
                        <CheckboxField
                          key={key}
                          id={`copchemical-${key}`}
                          label={label}
                          checked={form.copchemical.includes(key as CopChemical)}
                          onChange={(checked) =>
                            handleFieldChange('copchemical', toggleArrayValue(form.copchemical, key as CopChemical, checked))
                          }
                        />
                      ))}
                    </div>
                    {renderError('copchemical')}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Label Sample Photo</Label>
                <PhotoUpload
                  value={form.labelsamplephoto || undefined}
                  onChange={(value) => handleFieldChange('labelsamplephoto', value ?? '')}
                  helperText="Upload a label sample photo for this run"
                  buttonLabel="Upload label sample"
                  replaceLabel="Replace label sample"
                  previewAlt="Label sample"
                />
              </div>

              <div className="space-y-2">
                <Label>Code Verification Photo</Label>
                <PhotoUpload
                  value={form.codeverificationphoto || undefined}
                  onChange={(value) => handleFieldChange('codeverificationphoto', value ?? '')}
                  helperText="Upload a code verification photo for this run"
                  buttonLabel="Upload code verification"
                  replaceLabel="Replace code verification"
                  previewAlt="Code verification"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <CheckboxField id="mes" label="MES Completed" checked={form.mes} onChange={(checked) => handleFieldChange('mes', checked)} />
              <CheckboxField
                id="jobtransfer"
                label="Job Transfer Completed"
                checked={form.jobtransfer}
                onChange={(checked) => handleFieldChange('jobtransfer', checked)}
              />
              <CheckboxField id="local" label="Local" checked={form.local} onChange={(checked) => handleFieldChange('local', checked)} />
              <CheckboxField id="export" label="Export" checked={form.export} onChange={(checked) => handleFieldChange('export', checked)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="rounded-2xl border border-border/70 bg-white/65 px-4 py-3 text-sm text-muted-foreground">
            {recentRuns && recentRuns.length > 0 ? (
              <>
                <span className="font-medium text-primary">{recentRuns.length}</span> production run
                {recentRuns.length === 1 ? '' : 's'} available in history.
              </>
            ) : (
              'No production runs recorded yet.'
            )}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[220px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Production Run
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
