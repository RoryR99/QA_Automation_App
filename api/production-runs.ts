import type { ProductionRun, StartRunInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase.js';
import { mapProductionRun } from './_lib/mappers.js';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses.js';

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;
type ProductionRunRow = Record<string, unknown>;
type ProductionRunBatchRow = Record<string, unknown>;

function buildProductionCode(input: StartRunInput) {
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  return `${input.brand.slice(0, 3).toUpperCase()}-${input.flavour.slice(0, 3).toUpperCase()}-${stamp}`;
}

function optionalStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : undefined;
}

async function attachBatchRows(supabase: SupabaseClient, runs: ProductionRunRow[]) {
  if (runs.length === 0) {
    return runs;
  }

  const runIds = runs.map((run) => String(run.id));
  const { data, error } = await supabase
    .from('production_run_batches')
    .select('*')
    .in('production_run_id', runIds)
    .order('created_at', { ascending: true });

  if (error) {
    return runs;
  }

  const batchesByRunId = new Map<string, ProductionRunBatchRow[]>();

  for (const batch of data ?? []) {
    const runId = String(batch.production_run_id);
    batchesByRunId.set(runId, [...(batchesByRunId.get(runId) ?? []), batch]);
  }

  return runs.map((run) => ({
    ...run,
    production_run_batches: batchesByRunId.get(String(run.id)) ?? [],
  }));
}

async function selectRunWithBatches(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from('production_runs').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  const [run] = await attachBatchRows(supabase, [data]);
  return run;
}

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('production_runs').select('*').order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const runsWithBatches = await attachBatchRows(supabase, data ?? []);
      return res.status(200).json(runsWithBatches.map(mapProductionRun));
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
        cip_completed: input.cipcompletion ?? false,
        cip_methods: optionalStringArray(input.cipmethod) ?? [],
        cop_completed: input.copcompletion ?? false,
        cop_chemicals: optionalStringArray(input.copchemical) ?? [],
        payload_json: input,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('production_runs').insert(runRow).select().single();

      if (error) {
        throw error;
      }

      return res.status(201).json(mapProductionRun(data));
    }

    if (req.method === 'PATCH') {
      const input = await readJsonBody<{ id?: string; status?: 'active' | 'closed' }>(req);

      if (!input.id || input.status !== 'closed') {
        return res.status(400).json({ message: 'Production run id and closed status are required.' });
      }

      const { data, error } = await supabase
        .from('production_runs')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const runWithBatches = await selectRunWithBatches(supabase, String(data.id));
      return res.status(200).json(mapProductionRun(runWithBatches));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST', 'PATCH']);
  } catch (error) {
    return sendError(res, error);
  }
}
