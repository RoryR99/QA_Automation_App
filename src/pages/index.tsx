import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
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
];

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
  };
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getShiftLabel(shiftKey: ProductionRunShiftKey) {
  return shiftOptions.find((option) => option.key === shiftKey)?.label ?? shiftKey;
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
  const { data: beverageQualityData } = useBeverageQualityMeasurementList();
  const { data: user } = useUser();
  const [form, setForm] = useState<RunFormState>(buildInitialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.displayName && !form.qatechnician.trim()) {
      setForm((prev) => ({ ...prev, qatechnician: user.displayName }));
    }
  }, [form.qatechnician, user?.displayName]);

  const brandOptions = useMemo(() => {
    return Array.from(new Set((beverageQualityData ?? []).map((item) => item.brand).filter(Boolean))).sort();
  }, [beverageQualityData]);

  const flavourOptions = useMemo(() => {
    const matchingRows = (beverageQualityData ?? []).filter((item) => !form.brand || item.brand === form.brand);
    return Array.from(new Set(matchingRows.map((item) => item.flavor).filter(Boolean))).sort();
  }, [beverageQualityData, form.brand]);

  const handleFieldChange = <K extends keyof RunFormState>(key: K, value: RunFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleBrandChange = (brand: string) => {
    setForm((prev) => ({
      ...prev,
      brand,
      flavour: prev.brand === brand ? prev.flavour : '',
    }));
    setErrors((prev) => ({ ...prev, brand: undefined, flavour: undefined }));
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

    if (!form.qatechnician.trim()) {
      nextErrors.qatechnician = 'QA Technician is required.';
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
              <Input
                id="linenumber"
                value={form.linenumber}
                onChange={(event) => handleFieldChange('linenumber', event.target.value)}
                placeholder="e.g. Line 1"
              />
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
              <Select id="brand" value={form.brand} onChange={(event) => handleBrandChange(event.target.value)}>
                <option value="">Select brand</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>
              {renderError('brand')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flavour">Flavour *</Label>
              <Select
                id="flavour"
                value={form.flavour}
                onChange={(event) => handleFieldChange('flavour', event.target.value)}
                disabled={!form.brand}
              >
                <option value="">{form.brand ? 'Select flavour' : 'Select brand first'}</option>
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
              <Label htmlFor="qatechnician">QA Technician *</Label>
              <Input
                id="qatechnician"
                value={form.qatechnician}
                onChange={(event) => handleFieldChange('qatechnician', event.target.value)}
                placeholder="Enter name"
              />
              {renderError('qatechnician')}
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

              <div className="space-y-2">
                <Label htmlFor="planner">Planner</Label>
                <Input
                  id="planner"
                  value={form.planner}
                  onChange={(event) => handleFieldChange('planner', event.target.value)}
                  placeholder="Enter planner name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueinspectorid">QA Technician ID</Label>
                <Input
                  id="uniqueinspectorid"
                  value={form.uniqueinspectorid}
                  onChange={(event) => handleFieldChange('uniqueinspectorid', event.target.value)}
                  placeholder="Enter ID"
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
                <span className="font-medium text-primary">{recentRuns.length}</span> saved run
                {recentRuns.length === 1 ? '' : 's'} available in history.
              </>
            ) : (
              'No saved runs yet. The first run you start here will appear in history.'
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
