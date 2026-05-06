import { wait } from '@/services/mock-db';
import type { ProductSpec, ProductionRun } from '@/types/app';

const specs: ProductSpec[] = [
  {
    id: 'spec-citrus-spark',
    brand: 'Sparkline',
    flavour: 'Citrus Burst',
    packageType: '12 oz Can',
    targetTemperatureF: 42,
    fillVolumeMl: 355,
    closureTorqueNm: '2.1 - 2.5',
    carbonationRange: '2.6 - 2.8 vols',
    labelSku: 'LBL-SPK-CIT-12',
    allergenNote: 'No declared allergens. Verify date code legibility every hour.',
  },
  {
    id: 'spec-berry-wave',
    brand: 'Sparkline',
    flavour: 'Berry Wave',
    packageType: '16 oz PET',
    targetTemperatureF: 40,
    fillVolumeMl: 473,
    closureTorqueNm: '1.8 - 2.2',
    carbonationRange: '2.4 - 2.6 vols',
    labelSku: 'LBL-SPK-BER-16',
    allergenNote: 'Check label alignment after every flavor changeover.',
  },
];

function fallbackSpec(run: ProductionRun | null): ProductSpec {
  return {
    id: 'spec-generic',
    brand: run?.brand ?? 'House Blend',
    flavour: run?.flavour ?? 'Original',
    packageType: run?.packageType ?? '12 oz Can',
    targetTemperatureF: 41,
    fillVolumeMl: run?.packageType.includes('16') ? 473 : 355,
    closureTorqueNm: '2.0 - 2.4',
    carbonationRange: '2.5 - 2.7 vols',
    labelSku: 'LBL-GENERIC-001',
    allergenNote: 'Verify packaging materials match the active production run.',
  };
}

export async function getProductSpec(run: ProductionRun | null) {
  await wait(250);

  if (!run) {
    return fallbackSpec(null);
  }

  return (
    specs.find(
      (spec) =>
        spec.brand.toLowerCase() === run.brand.toLowerCase() &&
        spec.flavour.toLowerCase() === run.flavour.toLowerCase(),
    ) ?? fallbackSpec(run)
  );
}
