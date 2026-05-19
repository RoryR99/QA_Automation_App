import type { BeverageQualityMeasurement } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase.js';
import { sendMethodNotAllowed } from './_lib/responses.js';

const fallbackBeverageQualityData: BeverageQualityMeasurement[] = [
  {
    id: 'fallback-busta-grape-500',
    brand: 'BUSTA',
    flavor: 'GRAPE',
    packsize: '500',
    frequency: 'Every Hour',
    fillheightll: 495,
    fillheightul: 505,
    brixll: 13,
    brixul: 13.4,
    co2ll: 3.4,
    co2ul: 3.8,
  },
  {
    id: 'fallback-lucozade-apple-500',
    brand: 'LUCOZADE',
    flavor: 'APPLE',
    packsize: '500',
    frequency: 'Every Hour',
    fillheightll: 495,
    fillheightul: 505,
    brixll: 8.45,
    brixul: 8.79,
    co2ll: 3.8,
    co2ul: 4.2,
    phll: 2.5,
    phul: 2.9,
  },
];

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

    return res.status(200).json(mappedData.length ? mappedData : fallbackBeverageQualityData);
  } catch (error) {
    console.error('Failed to load beverage quality measurements', error);
    return res.status(200).json(fallbackBeverageQualityData);
  }
}
