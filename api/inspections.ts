import type { CreateInspectionInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase.js';
import { mapInspection } from './_lib/mappers.js';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses.js';

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('hourly_inspections').select('*').order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json((data ?? []).map(mapInspection));
    }

    if (req.method === 'POST') {
      const input = await readJsonBody<CreateInspectionInput>(req);

      if (!input.hourlyinspectionname || !input.timestamp || !input.inspector || !input.productionrunid) {
        return res.status(400).json({ message: 'Missing required inspection fields.' });
      }

      const row = {
        id: crypto.randomUUID(),
        production_run_id: input.productionrunid.id,
        inspection_type: input.inspectionType,
        created_at: new Date().toISOString(),
        payload_json: input,
      };

      const { data, error } = await supabase.from('hourly_inspections').insert(row).select().single();

      if (error) {
        throw error;
      }

      return res.status(201).json(mapInspection(data));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
}
