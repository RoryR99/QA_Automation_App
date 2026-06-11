import { mapProductionRunBatch } from './_lib/mappers.js';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses.js';
import { getSupabaseServerClient } from './_lib/supabase.js';

function normalizeBatchNumbers(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(req, res, ['POST']);
  }

  try {
    const supabase = getSupabaseServerClient();
    const input = await readJsonBody<{ productionRunId?: string; batchNumbers?: string[] }>(req);
    const batchNumbers = normalizeBatchNumbers(input.batchNumbers);

    if (!input.productionRunId || batchNumbers.length === 0) {
      return res.status(400).json({ message: 'Production run id and at least one batch number are required.' });
    }

    const { data: run, error: runError } = await supabase
      .from('production_runs')
      .select('id, status')
      .eq('id', input.productionRunId)
      .single();

    if (runError) {
      throw runError;
    }

    if (run.status === 'closed') {
      return res.status(400).json({ message: 'Batch numbers cannot be added to a closed production run.' });
    }

    const rows = batchNumbers.map((batchNumber) => ({
      id: crypto.randomUUID(),
      production_run_id: input.productionRunId,
      batch_number: batchNumber,
    }));

    const { data, error } = await supabase
      .from('production_run_batches')
      .upsert(rows, { onConflict: 'production_run_id,batch_number', ignoreDuplicates: true })
      .select()
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(201).json((data ?? []).map(mapProductionRunBatch));
  } catch (error) {
    return sendError(res, error);
  }
}
