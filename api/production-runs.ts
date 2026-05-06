import type { ProductionRun, StartRunInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { mapProductionRun } from './_lib/mappers';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses';

function buildProductionCode(input: StartRunInput) {
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  return `${input.brand.slice(0, 3).toUpperCase()}-${input.flavour.slice(0, 3).toUpperCase()}-${stamp}`;
}

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('production_runs').select('*').order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json((data ?? []).map(mapProductionRun));
    }

    if (req.method === 'POST') {
      const input = await readJsonBody<StartRunInput>(req);

      if (!input.brand || !input.flavour || !input.packageType || !input.line || !input.shift) {
        return res.status(400).json({ message: 'Missing required production run fields.' });
      }

      const runRow = {
        id: crypto.randomUUID(),
        productioncode: buildProductionCode(input),
        brand: input.brand,
        flavour: input.flavour,
        package_type: input.packageType,
        line: input.line,
        shift: input.shift,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('production_runs').insert(runRow).select().single();

      if (error) {
        throw error;
      }

      return res.status(201).json(mapProductionRun(data));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
}
