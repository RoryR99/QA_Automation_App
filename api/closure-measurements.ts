import type { ClosureMeasurementInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { mapClosureMeasurement } from './_lib/mappers';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses';

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('closure_measurements').select('*').order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json((data ?? []).map(mapClosureMeasurement));
    }

    if (req.method === 'POST') {
      const input = await readJsonBody<ClosureMeasurementInput>(req);

      if (!input.measurementname) {
        return res.status(400).json({ message: 'Measurement name is required.' });
      }

      if (!input.hourlyinspection?.id) {
        return res.status(400).json({ message: 'Related inspection is required.' });
      }

      const row = {
        id: crypto.randomUUID(),
        hourly_inspection_id: input.hourlyinspection.id,
        created_at: new Date().toISOString(),
        payload_json: input,
      };

      const { data, error } = await supabase.from('closure_measurements').insert(row).select().single();

      if (error) {
        throw error;
      }

      return res.status(201).json(mapClosureMeasurement(data));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
}
