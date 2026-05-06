import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, Check, CheckCircle, FlaskConical, Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useBeverageQualityMeasurementList } from '@/hooks/use-beverage-quality-measurement-list';
import { useCreateClosureMeasurement } from '@/hooks/use-create-closure-measurement';
import { useCreateInspection } from '@/hooks/use-create-inspection';
import { useUser } from '@/hooks/use-user';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import { cn } from '@/lib/utils';

interface SpecField {
  key: string;
  label: string;
  unit: string;
  value?: number;
  lowerLimit?: number;
  upperLimit?: number;
}

interface ClosureMeasurement {
  id: string;
  applicationAngle?: number;
  removalTorque?: number;
}

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

const defaultSpecFields: SpecField[] = [
  { key: 'fillheight', label: 'Fill Height', unit: 'mm' },
  { key: 'brix', label: 'Brix', unit: 'deg Bx' },
  { key: 'co2pressure', label: 'CO2 Pressure', unit: 'psi' },
  { key: 'co2temperature', label: 'CO2 Temperature', unit: 'deg F' },
  { key: 'co2final', label: 'CO2 Volume', unit: 'vol' },
  { key: 'ph', label: 'pH', unit: '' },
  { key: 'ta', label: 'TA', unit: '%' },
  { key: 'vitaminc', label: 'Ascorbic Acid / Vitamin C', unit: 'mg/L' },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function extractPackSize(packageType: string) {
  const match = packageType.match(/\d+/);
  return match ? match[0] : packageType.trim();
}

function formatRange(field: SpecField) {
  if (field.lowerLimit === undefined || field.upperLimit === undefined) {
    return 'No limits defined';
  }

  return `Range: ${field.lowerLimit} - ${field.upperLimit}${field.unit ? ` ${field.unit}` : ''}`;
}

function YesNoRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Label className="text-base font-medium">{label}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Select value={value ? 'yes' : 'no'} onChange={(event) => onChange(event.target.value === 'yes')} className="w-full md:w-24">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
      </div>
    </div>
  );
}

export function ProductSpecsPage() {
  const navigate = useNavigate();
  const currentRun = useAtomValue(currentProductionRunAtom);
  const createInspection = useCreateInspection();
  const createClosureMeasurement = useCreateClosureMeasurement();
  const { data: user } = useUser();
  const { data: specifications } = useBeverageQualityMeasurementList();

  const [netCompletion, setNetCompletion] = useState(false);
  const [cpAndCpkCompletion, setCpAndCpkCompletion] = useState(false);
  const [cipCompletion, setCipCompletion] = useState(false);
  const [cipMethod, setCipMethod] = useState<CipMethod | ''>('');
  const [copCompletion, setCopCompletion] = useState(false);
  const [copChemical, setCopChemical] = useState<CopChemical | ''>('');

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [selectedPackSize, setSelectedPackSize] = useState('');
  const [closureSupplier, setClosureSupplier] = useState('');
  const [closureMeasurements, setClosureMeasurements] = useState<ClosureMeasurement[]>([
    { id: '1', applicationAngle: undefined, removalTorque: undefined },
  ]);
  const [specFields, setSpecFields] = useState<SpecField[]>(defaultSpecFields);

  const brands = useMemo(() => {
    if (!specifications) {
      return [];
    }

    return [...new Set(specifications.map((item) => item.brand))];
  }, [specifications]);

  const flavors = useMemo(() => {
    if (!specifications || !selectedBrand) {
      return [];
    }

    return [...new Set(specifications.filter((item) => item.brand === selectedBrand).map((item) => item.flavor))];
  }, [specifications, selectedBrand]);

  const packSizes = useMemo(() => {
    if (!specifications || !selectedBrand || !selectedFlavor) {
      return [];
    }

    return [
      ...new Set(
        specifications
          .filter((item) => item.brand === selectedBrand && item.flavor === selectedFlavor)
          .map((item) => item.packsize),
      ),
    ];
  }, [specifications, selectedBrand, selectedFlavor]);

  useEffect(() => {
    if (!currentRun || !specifications || selectedBrand) {
      return;
    }

    const runBrand = normalize(currentRun.brand);
    const runFlavor = normalize(currentRun.flavour);
    const runPackSize = normalize(extractPackSize(currentRun.packageType));

    const exactMatch = specifications.find(
      (item) =>
        normalize(item.brand) === runBrand &&
        normalize(item.flavor) === runFlavor &&
        normalize(item.packsize) === runPackSize,
    );

    if (exactMatch) {
      setSelectedBrand(exactMatch.brand);
      setSelectedFlavor(exactMatch.flavor);
      setSelectedPackSize(exactMatch.packsize);
      return;
    }

    const partialMatch = specifications.find(
      (item) => normalize(item.brand) === runBrand && normalize(item.flavor) === runFlavor,
    );

    if (partialMatch) {
      setSelectedBrand(partialMatch.brand);
      setSelectedFlavor(partialMatch.flavor);
      setSelectedPackSize(partialMatch.packsize);
    }
  }, [currentRun, selectedBrand, specifications]);

  useEffect(() => {
    const matchedSpec =
      specifications?.find((item) => {
        const matchesBrandFlavor = item.brand === selectedBrand && item.flavor === selectedFlavor;

        if (!matchesBrandFlavor) {
          return false;
        }

        if (!selectedPackSize) {
          return true;
        }

        return item.packsize === selectedPackSize;
      }) ?? null;

    setSpecFields((prev) =>
      prev.map((field) => {
        const nextField = { ...field };

        switch (field.key) {
          case 'fillheight':
            nextField.lowerLimit = matchedSpec?.fillheightll;
            nextField.upperLimit = matchedSpec?.fillheightul;
            break;
          case 'brix':
            nextField.lowerLimit = matchedSpec?.brixll;
            nextField.upperLimit = matchedSpec?.brixul;
            break;
          case 'co2pressure':
          case 'co2final':
            nextField.lowerLimit = matchedSpec?.co2ll;
            nextField.upperLimit = matchedSpec?.co2ul;
            break;
          case 'ph':
            nextField.lowerLimit = matchedSpec?.phll;
            nextField.upperLimit = matchedSpec?.phul;
            break;
          case 'ta':
            nextField.lowerLimit = matchedSpec?.tall;
            nextField.upperLimit = matchedSpec?.taul;
            break;
          case 'vitaminc':
            nextField.lowerLimit = matchedSpec?.vitamincll;
            nextField.upperLimit = matchedSpec?.vitamincul;
            break;
          default:
            nextField.lowerLimit = undefined;
            nextField.upperLimit = undefined;
        }

        if (field.key === 'co2temperature') {
          nextField.lowerLimit = undefined;
          nextField.upperLimit = undefined;
        }

        return nextField;
      }),
    );
  }, [selectedBrand, selectedFlavor, selectedPackSize, specifications]);

  const updateSpecValue = (key: string, value: number | undefined) => {
    setSpecFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
  };

  const addClosureMeasurement = () => {
    setClosureMeasurements((prev) => [
      ...prev,
      { id: String(Date.now()), applicationAngle: undefined, removalTorque: undefined },
    ]);
  };

  const removeClosureMeasurement = (id: string) => {
    setClosureMeasurements((prev) => prev.filter((measurement) => measurement.id !== id));
  };

  const updateClosureMeasurement = (
    id: string,
    field: 'applicationAngle' | 'removalTorque',
    value: number | undefined,
  ) => {
    setClosureMeasurements((prev) =>
      prev.map((measurement) => (measurement.id === id ? { ...measurement, [field]: value } : measurement)),
    );
  };

  const isOutOfSpec = (field: SpecField) => {
    if (field.value === undefined) {
      return false;
    }

    if (field.lowerLimit !== undefined && field.value < field.lowerLimit) {
      return true;
    }

    if (field.upperLimit !== undefined && field.value > field.upperLimit) {
      return true;
    }

    return false;
  };

  const isInSpec = (field: SpecField) => {
    if (field.value === undefined) {
      return false;
    }

    if (field.lowerLimit === undefined && field.upperLimit === undefined) {
      return true;
    }

    return !isOutOfSpec(field);
  };

  const handleSubmit = async () => {
    if (!currentRun) {
      toast.error('No active production run');
      return;
    }

    if (!selectedBrand || !selectedFlavor) {
      toast.error('Please select brand and flavor.');
      return;
    }

    if (packSizes.length > 0 && !selectedPackSize) {
      toast.error('Please select a pack size.');
      return;
    }

    if (cipCompletion && !cipMethod) {
      toast.error('Please select a CIP method.');
      return;
    }

    if (copCompletion && !copChemical) {
      toast.error('Please select a COP chemical.');
      return;
    }

    try {
      const inspection = await createInspection.mutateAsync({
        hourlyinspectionname: `Product Specs - ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        inspector: user?.userPrincipalName ?? 'Unknown',
        inspectionType: 'product-specs',
        productionrunid: { id: currentRun.id, productioncode: currentRun.productioncode },
        brand: selectedBrand,
        flavor: selectedFlavor,
        packsize: selectedPackSize || undefined,
        fillheight: specFields.find((field) => field.key === 'fillheight')?.value,
        brix: specFields.find((field) => field.key === 'brix')?.value,
        co2pressure: specFields.find((field) => field.key === 'co2pressure')?.value,
        co2temperature: specFields.find((field) => field.key === 'co2temperature')?.value,
        co2: specFields.find((field) => field.key === 'co2final')?.value,
        ph: specFields.find((field) => field.key === 'ph')?.value,
        ta: specFields.find((field) => field.key === 'ta')?.value,
        vitaminc: specFields.find((field) => field.key === 'vitaminc')?.value,
        closuresupplier: closureSupplier || undefined,
        netcompletion: netCompletion,
        cpandcpkcompletion: cpAndCpkCompletion,
        cipcompletion: cipCompletion,
        cipmethod: cipCompletion ? cipMethodLabels[cipMethod as CipMethod] : undefined,
        copcompletion: copCompletion,
        copchemical: copCompletion ? copChemicalLabels[copChemical as CopChemical] : undefined,
      });

      let measurementErrors = 0;

      for (let index = 0; index < closureMeasurements.length; index += 1) {
        const measurement = closureMeasurements[index];

        if (measurement.applicationAngle !== undefined || measurement.removalTorque !== undefined) {
          try {
            await createClosureMeasurement.mutateAsync({
              measurementname: `Measurement ${index + 1} - ${new Date().toLocaleString()}`,
              hourlyinspection: {
                id: inspection.id,
                hourlyinspectionname: String(inspection.payload.hourlyinspectionname),
              },
              measurementnumber: index + 1,
              applicationangle: measurement.applicationAngle ?? 0,
              removaltorque: measurement.removalTorque ?? 0,
            });
          } catch {
            measurementErrors += 1;
          }
        }
      }

      if (measurementErrors > 0) {
        toast.warning(`Inspection saved, but ${measurementErrors} closure measurement(s) failed to save.`);
      } else {
        toast.success('Product specifications inspection saved');
      }

      navigate('/history');
    } catch {
      toast.error('Failed to save inspection');
    }
  };

  if (!currentRun) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 text-center">
          <FlaskConical className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
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
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-4xl font-semibold text-foreground">Product Specifications</h1>
          </div>
          <p className="text-muted-foreground">
            Run: <span className="font-medium text-foreground">{currentRun.productioncode}</span> | {currentRun.brand} -{' '}
            {currentRun.flavour}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Product Selection</CardTitle>
              <CardDescription>
                Select brand, flavor, and pack size to auto-populate specification limits from the image-based mock data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select
                  value={selectedBrand}
                  onChange={(event) => {
                    setSelectedBrand(event.target.value);
                    setSelectedFlavor('');
                    setSelectedPackSize('');
                  }}
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Flavor</Label>
                <Select
                  value={selectedFlavor}
                  onChange={(event) => {
                    setSelectedFlavor(event.target.value);
                    setSelectedPackSize('');
                  }}
                  disabled={!selectedBrand}
                >
                  <option value="">{selectedBrand ? 'Select flavor' : 'Select brand first'}</option>
                  {flavors.map((flavor) => (
                    <option key={flavor} value={flavor}>
                      {flavor}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pack Size</Label>
                <Select
                  value={selectedPackSize}
                  onChange={(event) => setSelectedPackSize(event.target.value)}
                  disabled={!selectedFlavor || packSizes.length === 0}
                >
                  <option value="">
                    {!selectedFlavor
                      ? 'Select flavor first'
                      : packSizes.length === 0
                        ? 'No pack sizes available'
                        : 'Select pack size'}
                  </option>
                  {packSizes.map((packSize) => (
                    <option key={packSize} value={packSize}>
                      {packSize}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Measurements</CardTitle>
              <CardDescription>Enter measured values for each specification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {specFields.map((field, index) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <Label className="text-base font-medium">{field.label}</Label>
                      <div className="mt-1 text-sm text-muted-foreground">{formatRange(field)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter value"
                        className={cn(
                          'w-36',
                          isOutOfSpec(field) && 'border-destructive focus-visible:ring-destructive',
                          isInSpec(field) && 'border-emerald-500 focus-visible:ring-emerald-500',
                        )}
                        value={field.value ?? ''}
                        onChange={(event) =>
                          updateSpecValue(field.key, event.target.value ? Number.parseFloat(event.target.value) : undefined)
                        }
                      />
                      {isOutOfSpec(field) && <AlertTriangle className="h-5 w-5 text-destructive" />}
                      {isInSpec(field) && <Check className="h-5 w-5 text-emerald-500" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Closure Measurements</CardTitle>
                  <CardDescription>Record application angle and removal torque for each closure tested.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addClosureMeasurement} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add measurement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={closureSupplier} onChange={(event) => setClosureSupplier(event.target.value)}>
                  <option value="">Select supplier</option>
                  <option value="BERICAP">BERICAP</option>
                  <option value="CSI">CSI</option>
                </Select>
              </div>

              <div className="space-y-3">
                {closureMeasurements.map((measurement, index) => (
                  <motion.div
                    key={measurement.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-3 rounded-2xl border border-border bg-muted/30 p-4"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Application Angle (deg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter angle"
                          value={measurement.applicationAngle ?? ''}
                          onChange={(event) =>
                            updateClosureMeasurement(
                              measurement.id,
                              'applicationAngle',
                              event.target.value ? Number.parseFloat(event.target.value) : undefined,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Removal Torque (lbf-in)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter torque"
                          value={measurement.removalTorque ?? ''}
                          onChange={(event) =>
                            updateClosureMeasurement(
                              measurement.id,
                              'removalTorque',
                              event.target.value ? Number.parseFloat(event.target.value) : undefined,
                            )
                          }
                        />
                      </div>
                    </div>
                    {closureMeasurements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeClosureMeasurement(measurement.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Product Spec Completion</CardTitle>
              <CardDescription>Record completion status for the quality checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <YesNoRow
                label="Net Completion"
                description="Has net weight verification been completed?"
                value={netCompletion}
                onChange={setNetCompletion}
              />
              <YesNoRow
                label="CP and CPK Completion"
                description="Has process capability analysis been completed?"
                value={cpAndCpkCompletion}
                onChange={setCpAndCpkCompletion}
              />

              <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Label className="text-base font-medium">CIP Completion</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Has Clean-In-Place process been completed?</p>
                  </div>
                  <Select
                    value={cipCompletion ? 'yes' : 'no'}
                    onChange={(event) => {
                      const enabled = event.target.value === 'yes';
                      setCipCompletion(enabled);
                      if (!enabled) {
                        setCipMethod('');
                      }
                    }}
                    className="w-full md:w-24"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                {cipCompletion && (
                  <div className="border-l-2 border-primary/30 pl-4">
                    <div className="space-y-2">
                      <Label className="text-sm">CIP Method</Label>
                      <Select value={cipMethod} onChange={(event) => setCipMethod(event.target.value as CipMethod | '')} className="w-full md:w-[220px]">
                        <option value="">Select method</option>
                        {Object.entries(cipMethodLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
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
                    value={copCompletion ? 'yes' : 'no'}
                    onChange={(event) => {
                      const enabled = event.target.value === 'yes';
                      setCopCompletion(enabled);
                      if (!enabled) {
                        setCopChemical('');
                      }
                    }}
                    className="w-full md:w-24"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                {copCompletion && (
                  <div className="border-l-2 border-primary/30 pl-4">
                    <div className="space-y-2">
                      <Label className="text-sm">COP Chemical</Label>
                      <Select
                        value={copChemical}
                        onChange={(event) => setCopChemical(event.target.value as CopChemical | '')}
                        className="w-full md:w-[220px]"
                      >
                        <option value="">Select chemical</option>
                        {Object.entries(copChemicalLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/secondary-packaging')}>
            Back to secondary packaging
          </Button>
          <Button onClick={handleSubmit} disabled={createInspection.isPending} className="min-w-[200px]">
            {createInspection.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete inspection
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
