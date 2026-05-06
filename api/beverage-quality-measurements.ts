import { beverageQualityData } from '../src/data/beverage-quality-data';
import { getSupabaseServerClient } from './_lib/supabase';
import { sendError, sendMethodNotAllowed } from './_lib/responses';

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
      .order('packsize', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json((data?.length ? data : beverageQualityData) ?? []);
  } catch (error) {
    return sendError(res, error);
  }
}
