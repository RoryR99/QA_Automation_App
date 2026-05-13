import { beverageQualityData } from '../src/data/beverage-quality-data';
import type { BeverageQualityMeasurement } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { sendMethodNotAllowed } from './_lib/responses';

function readNumber(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && value !== '') {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : undefined;
    }
  }

  return undefined;
}

function readString(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }

  return '';
}

function mapBeverageQualityMeasurement(row: Record<string, unknown>): BeverageQualityMeasurement {
  return {
    id: readString(row, 'beveragequalitymeasurementid', 'id'),
    brand: readString(row, 'brand'),
    flavor: readString(row, 'flavor'),
    packsize: readString(row, 'packagesizeml', 'packsize'),
    frequency:
      readString(row, 'productspecification', 'frequency', 'fillheightmeasurementfrequency', 'brixmeasurementfrequency').trim() ||
      'Not specified',
    fillheightll: readNumber(row, 'fillheightlowerlimit', 'fillheightll'),
    fillheightul: readNumber(row, 'fillheightupperlimit', 'fillheightul'),
    brixll: readNumber(row, 'brixlowerlimit', 'brixll'),
    brixul: readNumber(row, 'brixupperlimit', 'brixul'),
    co2ll: readNumber(row, 'co2lowerlimit', 'co2ll'),
    co2ul: readNumber(row, 'co2upperlimit', 'co2ul'),
    phll: readNumber(row, 'phlowerlimit', 'phll'),
    phul: readNumber(row, 'phupperlimit', 'phul'),
    tall: readNumber(row, 'titratableaciditylowerlimit', 'tall'),
    taul: readNumber(row, 'titratableacidityupperlimit', 'taul'),
    vitamincll: readNumber(row, 'vitaminclowerlimit', 'vitamincll'),
    vitamincul: readNumber(row, 'vitamincupperlimit', 'vitamincul'),
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
      .select('*');

    if (error) {
      throw error;
    }

    const mappedData = (data ?? [])
      .map(mapBeverageQualityMeasurement)
      .filter((item) => item.brand && item.flavor)
      .sort((a, b) => `${a.brand}|${a.flavor}|${a.packsize}`.localeCompare(`${b.brand}|${b.flavor}|${b.packsize}`));

    return res.status(200).json(mappedData.length ? mappedData : beverageQualityData);
  } catch (error) {
    console.error('Failed to load beverage quality measurements', error);
    return res.status(200).json(beverageQualityData);
  }
}
