import type { CreateInspectionExtensionInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { mapInspectionExtension } from './_lib/mappers';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses';

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('inspection_extensions').select('*').order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json((data ?? []).map(mapInspectionExtension));
    }

    if (req.method === 'POST') {
      const input = await readJsonBody<CreateInspectionExtensionInput>(req);

      if (!input.extensionname) {
        return res.status(400).json({ message: 'Extension name is required.' });
      }

      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        payload_json: input,
      };

      const { data, error } = await supabase.from('inspection_extensions').insert(row).select().single();

      if (error) {
        throw error;
      }

      return res.status(201).json(mapInspectionExtension(data));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
}
