import { beverageQualityData } from '../src/data/beverage-quality-data';
import type { BeverageQualityMeasurement } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { sendError, sendMethodNotAllowed } from './_lib/responses';

function mapBeverageQualityMeasurement(row: Record<string, unknown>): BeverageQualityMeasurement {
  return {
    id: String(row.beveragequalitymeasurementid ?? ''),
    brand: String(row.brand ?? ''),
    flavor: String(row.flavor ?? ''),
    packsize: String(row.packagesizeml ?? ''),
    frequency:
      String(row.productspecification ?? row.fillheightmeasurementfrequency ?? row.brixmeasurementfrequency ?? '').trim() ||
      'Not specified',
    fillheightll: Number(row.fillheightlowerlimit ?? NaN),
    fillheightul: Number(row.fillheightupperlimit ?? NaN),
    brixll: Number(row.brixlowerlimit ?? NaN),
    brixul: Number(row.brixupperlimit ?? NaN),
    co2ll: Number(row.co2lowerlimit ?? NaN),
    co2ul: Number(row.co2upperlimit ?? NaN),
    phll: Number(row.phlowerlimit ?? NaN),
    phul: Number(row.phupperlimit ?? NaN),
    tall: Number(row.titratableaciditylowerlimit ?? NaN),
    taul: Number(row.titratableacidityupperlimit ?? NaN),
    vitamincll: Number(row.vitaminclowerlimit ?? NaN),
    vitamincul: Number(row.vitamincupperlimit ?? NaN),
  };
}

export default async function handler(req: { method?: string }, res: any) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(req, res, ['GET']);
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('beverage_quality_measurements')
      .select('*')
      .order('brand', { ascending: true })
      .order('flavor', { ascending: true })
      .order('packagesizeml', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json(data?.length ? data.map(mapBeverageQualityMeasurement) : beverageQualityData);
  } catch (error) {
    return sendError(res, error);
  }
}
