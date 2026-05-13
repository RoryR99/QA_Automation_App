import type { ProductSpec } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { sendError, sendMethodNotAllowed } from './_lib/responses';

type ProductSpecRow = {
  id: string;
  brand: string;
  flavour: string;
  package_type: string;
  target_temperature_f: number;
  fill_volume_ml: number;
  closure_torque_nm: string;
  carbonation_range: string;
  label_sku: string;
  allergen_note: string;
};

function mapProductSpec(row: ProductSpecRow): ProductSpec {
  return {
    id: row.id,
    brand: row.brand,
    flavour: row.flavour,
    packageType: row.package_type,
    targetTemperatureF: Number(row.target_temperature_f),
    fillVolumeMl: Number(row.fill_volume_ml),
    closureTorqueNm: row.closure_torque_nm,
    carbonationRange: row.carbonation_range,
    labelSku: row.label_sku,
    allergenNote: row.allergen_note,
  };
}

function fallbackSpec(brand: string, flavour: string, packageType: string): ProductSpec {
  return {
    id: 'spec-generic',
    brand: brand || 'House Blend',
    flavour: flavour || 'Original',
    packageType: packageType || '12 oz Can',
    targetTemperatureF: 41,
    fillVolumeMl: packageType.includes('16') ? 473 : 355,
    closureTorqueNm: '2.0 - 2.4',
    carbonationRange: '2.5 - 2.7 vols',
    labelSku: 'LBL-GENERIC-001',
    allergenNote: 'Verify packaging materials match the active production run.',
  };
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[] | undefined> }, res: any) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(req, res, ['GET']);
  }

  const brand = String(req.query?.brand ?? '');
  const flavour = String(req.query?.flavour ?? '');
  const packageType = String(req.query?.packageType ?? '');

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from('product_specs').select('*').limit(1);

    if (brand) query = query.ilike('brand', brand);
    if (flavour) query = query.ilike('flavour', flavour);
    if (packageType) query = query.ilike('package_type', packageType);

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json(data ? mapProductSpec(data) : fallbackSpec(brand, flavour, packageType));
  } catch (error) {
    return sendError(res, error);
  }
}
